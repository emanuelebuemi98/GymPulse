-- Catalogo degli esercizi e dieci categorie al posto dei sette gruppi muscolari.
--
-- 1. Nasce la tabella CatalogoEsercizio (uguale per tutti): la riempie lo script `npm run db:catalogo`, non questa migrazione.
-- 2. Esercizio.muscoli diventa Esercizio.categoria. I gruppi di prima si convertono: PETTO -> petto, SPALLE -> spalle,
--    BICIPITI e TRICIPITI -> braccia, DORSO -> dorsali, GAMBE -> gambe, ADDOME -> addome. Il testo vuoto resta vuoto.
-- 3. Esercizio.catalogoId lega l'esercizio di una persona a una riga del catalogo. Resta vuoto per tutti gli esercizi che
--    ci sono oggi (sono personali): li lega lo script del catalogo, solo dove il nome coincide.
-- 4. Due vincoli scritti a mano, perche' Prisma non li descrive: le categorie ammesse sono le dieci chiavi.

CREATE TABLE "CatalogoEsercizio" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nomeIt" TEXT NOT NULL,
    "nomeEn" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "attrezzatura" TEXT NOT NULL,
    "muscoloPrincipale" TEXT NOT NULL,
    "muscoliSecondari" TEXT NOT NULL,
    "tipoMovimento" TEXT NOT NULL,
    "immagine" TEXT,
    "esecuzione" TEXT,
    "accortezze" TEXT,
    "alias" TEXT,

    CONSTRAINT "CatalogoEsercizio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogoEsercizio_slug_key" ON "CatalogoEsercizio"("slug");
CREATE UNIQUE INDEX "CatalogoEsercizio_nomeIt_key" ON "CatalogoEsercizio"("nomeIt");
CREATE INDEX "CatalogoEsercizio_categoria_idx" ON "CatalogoEsercizio"("categoria");

ALTER TABLE "CatalogoEsercizio"
  ADD CONSTRAINT "CatalogoEsercizio_categoria"
  CHECK ("categoria" IN ('petto', 'dorsali', 'spalle', 'braccia', 'gambe', 'addome', 'olimpico', 'corpo_intero', 'cardio', 'altri'));

-- Esercizio: via il vincolo dei sette gruppi, la colonna cambia nome e i valori si convertono.
ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_muscoli_standard";
ALTER TABLE "Esercizio" RENAME COLUMN "muscoli" TO "categoria";

UPDATE "Esercizio" SET "categoria" = CASE "categoria"
  WHEN 'PETTO'     THEN 'petto'
  WHEN 'SPALLE'    THEN 'spalle'
  WHEN 'BICIPITI'  THEN 'braccia'
  WHEN 'TRICIPITI' THEN 'braccia'
  WHEN 'DORSO'     THEN 'dorsali'
  WHEN 'GAMBE'     THEN 'gambe'
  WHEN 'ADDOME'    THEN 'addome'
  ELSE ''
END;

ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_categoria"
  CHECK ("categoria" IN ('', 'petto', 'dorsali', 'spalle', 'braccia', 'gambe', 'addome', 'olimpico', 'corpo_intero', 'cardio', 'altri'));

ALTER TABLE "Esercizio" ADD COLUMN "catalogoId" INTEGER;
CREATE UNIQUE INDEX "Esercizio_userId_catalogoId_key" ON "Esercizio"("userId", "catalogoId");
CREATE INDEX "Esercizio_catalogoId_idx" ON "Esercizio"("catalogoId");
ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_catalogoId_fkey" FOREIGN KEY ("catalogoId") REFERENCES "CatalogoEsercizio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
