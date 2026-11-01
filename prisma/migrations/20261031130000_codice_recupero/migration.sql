-- Recupero della password con un codice via SMS.
-- User.telefono: il cellulare confermato dalla persona. Vuoto per gli account esistenti, che non cambiano.
-- CodiceSms: i codici monouso mandati per SMS. Di ogni codice si salva solo un HMAC, mai il numero a sei cifre.
ALTER TABLE "User" ADD COLUMN "telefono" TEXT;

CREATE TABLE "CodiceSms" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "codiceHash" TEXT NOT NULL,
    "tentativi" INTEGER NOT NULL DEFAULT 0,
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scadeIl" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodiceSms_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CodiceSms_userId_creatoIl_idx" ON "CodiceSms"("userId", "creatoIl");

CREATE INDEX "CodiceSms_creatoIl_idx" ON "CodiceSms"("creatoIl");

ALTER TABLE "CodiceSms" ADD CONSTRAINT "CodiceSms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
