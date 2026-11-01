-- Il recupero della password passa dal cellulare all'email: gli SMS costano, l'email no.
--
-- User.telefono viene eliminato (e con lui il numero che qualcuno aveva già collegato) e arriva User.email, vuota per
-- tutti finché la persona non la collega dalla pagina Account.
-- Le due tabelle dei codici contengono solo dati che scadono in dieci minuti (codici da cambiare con l'email e
-- registrazioni in attesa): si ricreano con le colonne giuste invece di rinominarle.
-- Con IF EXISTS la migrazione funziona anche se una di queste tabelle è già stata eliminata a mano.
DROP TABLE IF EXISTS "CodiceSms";
DROP TABLE IF EXISTS "RegistrazioneSospesa";

ALTER TABLE "User" DROP COLUMN IF EXISTS "telefono";
ALTER TABLE "User" ADD COLUMN "email" TEXT;

CREATE TABLE "CodiceEmail" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "chiave" TEXT NOT NULL,
    "codiceHash" TEXT NOT NULL,
    "tentativi" INTEGER NOT NULL DEFAULT 0,
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scadeIl" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodiceEmail_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CodiceEmail_userId_creatoIl_idx" ON "CodiceEmail"("userId", "creatoIl");

CREATE INDEX "CodiceEmail_chiave_creatoIl_idx" ON "CodiceEmail"("chiave", "creatoIl");

CREATE INDEX "CodiceEmail_creatoIl_idx" ON "CodiceEmail"("creatoIl");

ALTER TABLE "CodiceEmail" ADD CONSTRAINT "CodiceEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "RegistrazioneSospesa" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "chiave" TEXT NOT NULL,
    "codiceHash" TEXT NOT NULL,
    "tentativi" INTEGER NOT NULL DEFAULT 0,
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scadeIl" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrazioneSospesa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrazioneSospesa_chiave_creatoIl_idx" ON "RegistrazioneSospesa"("chiave", "creatoIl");

CREATE INDEX "RegistrazioneSospesa_creatoIl_idx" ON "RegistrazioneSospesa"("creatoIl");
