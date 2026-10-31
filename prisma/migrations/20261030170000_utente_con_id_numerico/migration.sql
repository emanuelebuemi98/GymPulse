-- Gli id di User, Esercizio e Sessione passano da testo a numeri progressivi.
-- Restano testo gli id delle giornate (A, B, C), delle voci della scheda e delle serie.
-- L'account ottiene anche fullName (al posto di name) e perde email e createdAt, che non servono.
-- I dati non si perdono: ogni riferimento viene ricostruito sul nuovo numero.
-- Si procede a passi (colonna nuova -> riempita -> obbligatoria -> vecchia tolta). Postgres esegue lo script
-- come un'unica transazione: se un passo fallisce, il database resta com'era.

-- 1. Un account senza nome utente o password non può entrare: si toglie. I suoi dati andrebbero persi, quindi
--    la migrazione si ferma se ne esistono, e dice come rimediare.
DO $$
DECLARE orfani integer;
BEGIN
  SELECT count(*) INTO orfani FROM "User" u
  WHERE (u."username" IS NULL OR u."passwordHash" IS NULL)
    AND (EXISTS (SELECT 1 FROM "Sessione" s WHERE s."userId" = u."id")
      OR EXISTS (SELECT 1 FROM "GiornoScheda" g WHERE g."userId" = u."id")
      OR EXISTS (SELECT 1 FROM "Esercizio" e WHERE e."userId" = u."id"));
  IF orfani > 0 THEN
    RAISE EXCEPTION 'Ci sono % account con dati ma senza nome utente o password: collegali con "npm run db:utente" prima di migrare', orfani;
  END IF;
END $$;
DELETE FROM "User" WHERE "username" IS NULL OR "passwordHash" IS NULL;

-- 2. I nuovi id numerici, in colonne di appoggio: le righe esistenti li ricevono subito
ALTER TABLE "User" ADD COLUMN "newId" SERIAL;
ALTER TABLE "Esercizio" ADD COLUMN "newId" SERIAL;
ALTER TABLE "Sessione" ADD COLUMN "newId" SERIAL;

-- 3. Si tolgono le chiavi esterne che dipendono dai vecchi id
ALTER TABLE "SerieEseguita" DROP CONSTRAINT "SerieEseguita_sessioneId_userId_fkey";
ALTER TABLE "SerieEseguita" DROP CONSTRAINT "SerieEseguita_userId_esercizioId_fkey";
ALTER TABLE "VoceScheda" DROP CONSTRAINT "VoceScheda_userId_giornoId_fkey";
ALTER TABLE "VoceScheda" DROP CONSTRAINT "VoceScheda_userId_esercizioId_fkey";
ALTER TABLE "Sessione" DROP CONSTRAINT "Sessione_userId_giornoId_fkey";
ALTER TABLE "Sessione" DROP CONSTRAINT "Sessione_userId_fkey";
ALTER TABLE "GiornoScheda" DROP CONSTRAINT "GiornoScheda_userId_fkey";
ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_userId_fkey";

-- 4. Ogni riferimento ha una colonna numerica di appoggio, riempita guardando a chi puntava il vecchio testo
ALTER TABLE "GiornoScheda" ADD COLUMN "userIdNum" INTEGER;
ALTER TABLE "Esercizio" ADD COLUMN "userIdNum" INTEGER;
ALTER TABLE "Sessione" ADD COLUMN "userIdNum" INTEGER;
ALTER TABLE "VoceScheda" ADD COLUMN "userIdNum" INTEGER, ADD COLUMN "esercizioIdNum" INTEGER;
ALTER TABLE "SerieEseguita" ADD COLUMN "userIdNum" INTEGER, ADD COLUMN "esercizioIdNum" INTEGER, ADD COLUMN "sessioneIdNum" INTEGER;

UPDATE "GiornoScheda" t SET "userIdNum" = u."newId" FROM "User" u WHERE u."id" = t."userId";
UPDATE "Esercizio" t SET "userIdNum" = u."newId" FROM "User" u WHERE u."id" = t."userId";
UPDATE "Sessione" t SET "userIdNum" = u."newId" FROM "User" u WHERE u."id" = t."userId";
UPDATE "VoceScheda" v SET "userIdNum" = u."newId", "esercizioIdNum" = e."newId"
  FROM "User" u, "Esercizio" e
  WHERE u."id" = v."userId" AND e."userId" = v."userId" AND e."id" = v."esercizioId";
UPDATE "SerieEseguita" s SET "userIdNum" = u."newId", "esercizioIdNum" = e."newId", "sessioneIdNum" = ses."newId"
  FROM "User" u, "Esercizio" e, "Sessione" ses
  WHERE u."id" = s."userId" AND e."userId" = s."userId" AND e."id" = s."esercizioId" AND ses."id" = s."sessioneId";

-- 5. Ora sono obbligatorie: se una riga non ha trovato il suo riferimento, la migrazione si ferma qui
ALTER TABLE "GiornoScheda" ALTER COLUMN "userIdNum" SET NOT NULL;
ALTER TABLE "Esercizio" ALTER COLUMN "userIdNum" SET NOT NULL;
ALTER TABLE "Sessione" ALTER COLUMN "userIdNum" SET NOT NULL;
ALTER TABLE "VoceScheda" ALTER COLUMN "userIdNum" SET NOT NULL, ALTER COLUMN "esercizioIdNum" SET NOT NULL;
ALTER TABLE "SerieEseguita" ALTER COLUMN "userIdNum" SET NOT NULL, ALTER COLUMN "esercizioIdNum" SET NOT NULL, ALTER COLUMN "sessioneIdNum" SET NOT NULL;

-- 6. Chiavi primarie e indici che usavano i vecchi id
ALTER TABLE "GiornoScheda" DROP CONSTRAINT "GiornoScheda_pkey";
ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_pkey";
ALTER TABLE "Sessione" DROP CONSTRAINT "Sessione_pkey";
DROP INDEX "VoceScheda_userId_giornoId_ordine_idx";
DROP INDEX "VoceScheda_userId_giornoId_esercizioId_key";
DROP INDEX "SerieEseguita_userId_esercizioId_idx";
DROP INDEX "SerieEseguita_sessioneId_idx";
DROP INDEX "Sessione_userId_data_idx";
DROP INDEX "Sessione_id_userId_key";

-- 7. Le vecchie colonne spariscono e le nuove ne prendono il posto
ALTER TABLE "GiornoScheda" DROP COLUMN "userId";
ALTER TABLE "Esercizio" DROP COLUMN "userId", DROP COLUMN "id";
ALTER TABLE "Sessione" DROP COLUMN "userId", DROP COLUMN "id";
ALTER TABLE "VoceScheda" DROP COLUMN "userId", DROP COLUMN "esercizioId";
ALTER TABLE "SerieEseguita" DROP COLUMN "userId", DROP COLUMN "esercizioId", DROP COLUMN "sessioneId";

ALTER TABLE "GiornoScheda" RENAME COLUMN "userIdNum" TO "userId";
ALTER TABLE "Esercizio" RENAME COLUMN "userIdNum" TO "userId";
ALTER TABLE "Esercizio" RENAME COLUMN "newId" TO "id";
ALTER TABLE "Sessione" RENAME COLUMN "userIdNum" TO "userId";
ALTER TABLE "Sessione" RENAME COLUMN "newId" TO "id";
ALTER TABLE "VoceScheda" RENAME COLUMN "userIdNum" TO "userId";
ALTER TABLE "VoceScheda" RENAME COLUMN "esercizioIdNum" TO "esercizioId";
ALTER TABLE "SerieEseguita" RENAME COLUMN "userIdNum" TO "userId";
ALTER TABLE "SerieEseguita" RENAME COLUMN "esercizioIdNum" TO "esercizioId";
ALTER TABLE "SerieEseguita" RENAME COLUMN "sessioneIdNum" TO "sessioneId";

-- 8. La tabella User: id numerico, nome completo, username e password obbligatori, senza email e createdAt
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";
ALTER TABLE "User" DROP COLUMN "id";
ALTER TABLE "User" RENAME COLUMN "newId" TO "id";
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
ALTER TABLE "User" RENAME COLUMN "name" TO "fullName";
ALTER TABLE "User" DROP COLUMN "email";
ALTER TABLE "User" DROP COLUMN "createdAt";
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;
DROP INDEX IF EXISTS "User_email_key";

-- 9. Chiavi primarie e sequenze con i nomi che si aspetta Prisma
ALTER TABLE "GiornoScheda" ADD CONSTRAINT "GiornoScheda_pkey" PRIMARY KEY ("userId", "id");
ALTER TABLE "Esercizio" ADD CONSTRAINT "Esercizio_pkey" PRIMARY KEY ("id");
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_pkey" PRIMARY KEY ("id");
ALTER SEQUENCE "User_newId_seq" RENAME TO "User_id_seq";
ALTER SEQUENCE "Esercizio_newId_seq" RENAME TO "Esercizio_id_seq";
ALTER SEQUENCE "Sessione_newId_seq" RENAME TO "Sessione_id_seq";

-- 10. Indici
CREATE UNIQUE INDEX "Esercizio_userId_id_key" ON "Esercizio"("userId", "id");
CREATE UNIQUE INDEX "Sessione_id_userId_key" ON "Sessione"("id", "userId");
CREATE INDEX "Sessione_userId_data_idx" ON "Sessione"("userId", "data");
CREATE INDEX "VoceScheda_userId_giornoId_ordine_idx" ON "VoceScheda"("userId", "giornoId", "ordine");
CREATE UNIQUE INDEX "VoceScheda_userId_giornoId_esercizioId_key" ON "VoceScheda"("userId", "giornoId", "esercizioId");
CREATE INDEX "SerieEseguita_sessioneId_idx" ON "SerieEseguita"("sessioneId");
CREATE INDEX "SerieEseguita_userId_esercizioId_idx" ON "SerieEseguita"("userId", "esercizioId");

-- 11. Le chiavi esterne: ogni dato può puntare solo a dati della stessa persona
ALTER TABLE "GiornoScheda" ADD CONSTRAINT "GiornoScheda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Esercizio" ADD CONSTRAINT "Esercizio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES "GiornoScheda"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES "Esercizio"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES "GiornoScheda"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_sessioneId_userId_fkey" FOREIGN KEY ("sessioneId", "userId") REFERENCES "Sessione"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES "Esercizio"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
