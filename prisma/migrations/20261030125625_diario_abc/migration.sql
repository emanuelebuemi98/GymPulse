-- AlterTable
ALTER TABLE "Esercizio" ADD COLUMN     "personalizzato" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Sessione" ADD COLUMN     "datiIniziali" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "VoceScheda" (
    "id" TEXT NOT NULL,
    "giornoId" TEXT NOT NULL,
    "esercizioId" TEXT NOT NULL,
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
    "incrementoKg" DOUBLE PRECISION,

    CONSTRAINT "VoceScheda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoceScheda_giornoId_ordine_idx" ON "VoceScheda"("giornoId", "ordine");

-- CreateIndex
CREATE UNIQUE INDEX "VoceScheda_giornoId_esercizioId_key" ON "VoceScheda"("giornoId", "esercizioId");

-- CreateIndex
CREATE INDEX "SerieEseguita_esercizioId_idx" ON "SerieEseguita"("esercizioId");

-- AddForeignKey
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_giornoId_fkey" FOREIGN KEY ("giornoId") REFERENCES "GiornoScheda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_esercizioId_fkey" FOREIGN KEY ("esercizioId") REFERENCES "Esercizio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
