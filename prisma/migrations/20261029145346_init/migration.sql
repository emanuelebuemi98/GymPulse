-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiornoScheda" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titolo" TEXT NOT NULL,
    "focus" TEXT NOT NULL,

    CONSTRAINT "GiornoScheda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Esercizio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "muscoli" TEXT NOT NULL,

    CONSTRAINT "Esercizio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessione" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "giornoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pesoCorporeoKg" DOUBLE PRECISION,
    "durataMinuti" INTEGER,
    "kcalStimate" INTEGER,

    CONSTRAINT "Sessione_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerieEseguita" (
    "id" TEXT NOT NULL,
    "sessioneId" TEXT NOT NULL,
    "esercizioId" TEXT NOT NULL,
    "ordine" INTEGER NOT NULL,
    "pesoKg" DOUBLE PRECISION,
    "ripetizioni" INTEGER NOT NULL,

    CONSTRAINT "SerieEseguita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Sessione_userId_data_idx" ON "Sessione"("userId", "data");

-- CreateIndex
CREATE INDEX "SerieEseguita_sessioneId_idx" ON "SerieEseguita"("sessioneId");

-- AddForeignKey
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_giornoId_fkey" FOREIGN KEY ("giornoId") REFERENCES "GiornoScheda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_sessioneId_fkey" FOREIGN KEY ("sessioneId") REFERENCES "Sessione"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_esercizioId_fkey" FOREIGN KEY ("esercizioId") REFERENCES "Esercizio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
