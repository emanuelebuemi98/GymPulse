-- Ogni persona ha i propri dati: giornate, esercizi, voci della scheda e serie portano lo userId.
-- I dati già presenti non si perdono: appartenevano all'unico utente dell'app, 'atleta-locale',
-- e restano suoi. Si procede a passi (colonna nulla -> riempita -> obbligatoria) proprio per questo.

-- 1. Il proprietario dei dati esistenti deve esistere (su un database vuoto non serve e non si crea).
INSERT INTO "User" ("id", "name")
SELECT 'atleta-locale', 'Atleta'
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "id" = 'atleta-locale')
  AND (EXISTS (SELECT 1 FROM "GiornoScheda") OR EXISTS (SELECT 1 FROM "Esercizio") OR EXISTS (SELECT 1 FROM "Sessione"));

-- 2. Le vecchie chiavi esterne e gli indici che non servono più
ALTER TABLE "SerieEseguita" DROP CONSTRAINT "SerieEseguita_esercizioId_fkey";
ALTER TABLE "SerieEseguita" DROP CONSTRAINT "SerieEseguita_sessioneId_fkey";
ALTER TABLE "Sessione" DROP CONSTRAINT "Sessione_giornoId_fkey";
ALTER TABLE "VoceScheda" DROP CONSTRAINT "VoceScheda_esercizioId_fkey";
ALTER TABLE "VoceScheda" DROP CONSTRAINT "VoceScheda_giornoId_fkey";

DROP INDEX "SerieEseguita_esercizioId_idx";
DROP INDEX "VoceScheda_giornoId_esercizioId_key";
DROP INDEX "VoceScheda_giornoId_ordine_idx";

-- 3. Le nuove colonne, prima senza vincolo
ALTER TABLE "Esercizio" ADD COLUMN "userId" TEXT;
ALTER TABLE "GiornoScheda" ADD COLUMN "userId" TEXT;
ALTER TABLE "VoceScheda" ADD COLUMN "userId" TEXT;
ALTER TABLE "SerieEseguita" ADD COLUMN "userId" TEXT;

-- 4. Riempite: ogni riga prende il proprietario della seduta o del dato a cui appartiene
UPDATE "Esercizio" SET "userId" = 'atleta-locale';
UPDATE "GiornoScheda" SET "userId" = 'atleta-locale';
UPDATE "VoceScheda" SET "userId" = 'atleta-locale';
UPDATE "SerieEseguita" AS s SET "userId" = ses."userId" FROM "Sessione" AS ses WHERE ses."id" = s."sessioneId";

-- 5. Ora sono obbligatorie
ALTER TABLE "Esercizio" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "GiornoScheda" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "VoceScheda" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SerieEseguita" ALTER COLUMN "userId" SET NOT NULL;

-- 6. Le chiavi primarie diventano composte (userId, id)
ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_pkey", ADD CONSTRAINT "Esercizio_pkey" PRIMARY KEY ("userId", "id");
ALTER TABLE "GiornoScheda" DROP CONSTRAINT "GiornoScheda_pkey", ADD CONSTRAINT "GiornoScheda_pkey" PRIMARY KEY ("userId", "id");

-- 7. Indici
CREATE INDEX "SerieEseguita_userId_esercizioId_idx" ON "SerieEseguita"("userId", "esercizioId");
CREATE UNIQUE INDEX "Sessione_id_userId_key" ON "Sessione"("id", "userId");
CREATE INDEX "VoceScheda_userId_giornoId_ordine_idx" ON "VoceScheda"("userId", "giornoId", "ordine");
CREATE UNIQUE INDEX "VoceScheda_userId_giornoId_esercizioId_key" ON "VoceScheda"("userId", "giornoId", "esercizioId");

-- 8. Le nuove chiavi esterne: ogni dato può puntare solo a dati della stessa persona
ALTER TABLE "GiornoScheda" ADD CONSTRAINT "GiornoScheda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Esercizio" ADD CONSTRAINT "Esercizio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES "GiornoScheda"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES "Esercizio"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES "GiornoScheda"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_sessioneId_userId_fkey" FOREIGN KEY ("sessioneId", "userId") REFERENCES "Sessione"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES "Esercizio"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
