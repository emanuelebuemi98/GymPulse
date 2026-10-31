-- Riordina le colonne (l'id per primo in ogni tabella) e toglie quattro colonne che non servono:
--   GiornoScheda.numero      duplica la sigla A/B/C
--   GiornoScheda.focus       non compariva in nessuna pagina
--   Esercizio.personalizzato non cambiava mai nulla
--   Sessione.kcalStimate     si ricava da peso corporeo e durata
-- Postgres non permette di spostare una colonna, quindi ogni tabella viene ricostruita: si crea la nuova (con un nome
-- provvisorio, senza vincoli), si copiano i dati con gli stessi id, si elimina la vecchia e si rimettono vincoli e indici
-- con i nomi che si aspetta Prisma. Lo script gira come un'unica transazione: se un passo fallisce, resta tutto com'era.

-- 1. Le nuove tabelle, con le colonne nell'ordine voluto
CREATE TABLE "User_n" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL
);

CREATE TABLE "GiornoScheda_n" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "titolo" TEXT NOT NULL
);

CREATE TABLE "Esercizio_n" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "muscoli" TEXT NOT NULL
);

CREATE TABLE "VoceScheda_n" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "giornoId" TEXT NOT NULL,
    "esercizioId" INTEGER NOT NULL,
    "ordine" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'serie',
    "serie" INTEGER,
    "ripMin" INTEGER,
    "ripMax" INTEGER,
    "recuperoSec" INTEGER,
    "ripTotali" INTEGER,
    "serieMin" INTEGER,
    "serieMax" INTEGER,
    "nota" TEXT,
    "incrementoKg" DOUBLE PRECISION
);

CREATE TABLE "Sessione_n" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "giornoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "pesoCorporeoKg" DOUBLE PRECISION,
    "durataMinuti" INTEGER,
    "datiIniziali" BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE "SerieEseguita_n" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessioneId" INTEGER NOT NULL,
    "esercizioId" INTEGER NOT NULL,
    "ordine" INTEGER NOT NULL,
    "pesoKg" DOUBLE PRECISION,
    "ripetizioni" INTEGER NOT NULL
);

-- 2. I dati, con gli stessi id di prima (anche il cookie di accesso resta valido). L'ordine rende le righe leggibili.
INSERT INTO "User_n" ("id", "fullName", "username", "passwordHash")
SELECT "id", "fullName", "username", "passwordHash" FROM "User" ORDER BY "id";

INSERT INTO "GiornoScheda_n" ("id", "userId", "titolo")
SELECT "id", "userId", "titolo" FROM "GiornoScheda" ORDER BY "userId", "id";

INSERT INTO "Esercizio_n" ("id", "userId", "nome", "muscoli")
SELECT "id", "userId", "nome", "muscoli" FROM "Esercizio" ORDER BY "id";

INSERT INTO "VoceScheda_n" ("id", "userId", "giornoId", "esercizioId", "ordine", "tipo", "serie", "ripMin", "ripMax", "recuperoSec", "ripTotali", "serieMin", "serieMax", "nota", "incrementoKg")
SELECT "id", "userId", "giornoId", "esercizioId", "ordine", "tipo", "serie", "ripMin", "ripMax", "recuperoSec", "ripTotali", "serieMin", "serieMax", "nota", "incrementoKg"
FROM "VoceScheda" ORDER BY "userId", "giornoId", "ordine";

INSERT INTO "Sessione_n" ("id", "userId", "giornoId", "data", "note", "pesoCorporeoKg", "durataMinuti", "datiIniziali")
SELECT "id", "userId", "giornoId", "data", "note", "pesoCorporeoKg", "durataMinuti", "datiIniziali" FROM "Sessione" ORDER BY "id";

INSERT INTO "SerieEseguita_n" ("id", "userId", "sessioneId", "esercizioId", "ordine", "pesoKg", "ripetizioni")
SELECT "id", "userId", "sessioneId", "esercizioId", "ordine", "pesoKg", "ripetizioni" FROM "SerieEseguita" ORDER BY "sessioneId", "ordine";

-- 3. Le vecchie tabelle spariscono, dai figli ai padri (così cadono anche le chiavi esterne che le collegano)
DROP TABLE "SerieEseguita";
DROP TABLE "VoceScheda";
DROP TABLE "Sessione";
DROP TABLE "Esercizio";
DROP TABLE "GiornoScheda";
DROP TABLE "User";

-- 4. Le nuove prendono il loro posto, comprese le sequenze degli id
ALTER TABLE "User_n" RENAME TO "User";
ALTER TABLE "GiornoScheda_n" RENAME TO "GiornoScheda";
ALTER TABLE "Esercizio_n" RENAME TO "Esercizio";
ALTER TABLE "VoceScheda_n" RENAME TO "VoceScheda";
ALTER TABLE "Sessione_n" RENAME TO "Sessione";
ALTER TABLE "SerieEseguita_n" RENAME TO "SerieEseguita";

ALTER SEQUENCE "User_n_id_seq" RENAME TO "User_id_seq";
ALTER SEQUENCE "Esercizio_n_id_seq" RENAME TO "Esercizio_id_seq";
ALTER SEQUENCE "Sessione_n_id_seq" RENAME TO "Sessione_id_seq";

-- Il prossimo id nuovo riparte dopo l'ultimo presente (altrimenti si scontrerebbe con i dati copiati)
DO $$
BEGIN
  PERFORM setval('"User_id_seq"', COALESCE((SELECT MAX("id") FROM "User"), 1), (SELECT MAX("id") FROM "User") IS NOT NULL);
  PERFORM setval('"Esercizio_id_seq"', COALESCE((SELECT MAX("id") FROM "Esercizio"), 1), (SELECT MAX("id") FROM "Esercizio") IS NOT NULL);
  PERFORM setval('"Sessione_id_seq"', COALESCE((SELECT MAX("id") FROM "Sessione"), 1), (SELECT MAX("id") FROM "Sessione") IS NOT NULL);
END $$;

-- 5. Chiavi primarie e indici
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
ALTER TABLE "GiornoScheda" ADD CONSTRAINT "GiornoScheda_pkey" PRIMARY KEY ("userId", "id");
ALTER TABLE "Esercizio" ADD CONSTRAINT "Esercizio_pkey" PRIMARY KEY ("id");
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_pkey" PRIMARY KEY ("id");
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_pkey" PRIMARY KEY ("id");
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Esercizio_userId_id_key" ON "Esercizio"("userId", "id");
CREATE UNIQUE INDEX "VoceScheda_userId_giornoId_esercizioId_key" ON "VoceScheda"("userId", "giornoId", "esercizioId");
CREATE INDEX "VoceScheda_userId_giornoId_ordine_idx" ON "VoceScheda"("userId", "giornoId", "ordine");
CREATE UNIQUE INDEX "Sessione_id_userId_key" ON "Sessione"("id", "userId");
CREATE INDEX "Sessione_userId_data_idx" ON "Sessione"("userId", "data");
CREATE INDEX "SerieEseguita_sessioneId_idx" ON "SerieEseguita"("sessioneId");
CREATE INDEX "SerieEseguita_userId_esercizioId_idx" ON "SerieEseguita"("userId", "esercizioId");

-- 6. Le chiavi esterne: ogni dato può puntare solo a dati della stessa persona
ALTER TABLE "GiornoScheda" ADD CONSTRAINT "GiornoScheda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Esercizio" ADD CONSTRAINT "Esercizio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES "GiornoScheda"("userId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES "Esercizio"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_userId_giornoId_fkey" FOREIGN KEY ("userId", "giornoId") REFERENCES "GiornoScheda"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_sessioneId_userId_fkey" FOREIGN KEY ("sessioneId", "userId") REFERENCES "Sessione"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_userId_esercizioId_fkey" FOREIGN KEY ("userId", "esercizioId") REFERENCES "Esercizio"("userId", "id") ON DELETE NO ACTION ON UPDATE CASCADE;
