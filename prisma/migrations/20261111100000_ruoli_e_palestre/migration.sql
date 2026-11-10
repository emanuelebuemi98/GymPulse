-- Ruoli e palestre: un utente può indicare la palestra a cui appartiene (facoltativo) e un personal trainer, che si registra con
-- un codice d'invito, vede e modifica la scheda (solo la scheda) degli utenti della sua palestra.
--
-- Migrazione solo additiva: colonne nuove, nessun dato esistente cambia (tutti restano 'utente', senza palestra), quindi il codice
-- precedente continua a funzionare sul database nuovo. L'elenco delle palestre ammesse sta nel codice (src/lib/palestre.ts) e non
-- qui: aggiungerne una non richiede migrazioni.

ALTER TABLE "User" ADD COLUMN "palestra" TEXT;
ALTER TABLE "User" ADD COLUMN "ruolo" TEXT NOT NULL DEFAULT 'utente';

ALTER TABLE "User" ADD CONSTRAINT "User_ruolo" CHECK ("ruolo" IN ('utente', 'trainer'));
ALTER TABLE "User" ADD CONSTRAINT "User_trainer_palestra" CHECK ("ruolo" <> 'trainer' OR "palestra" IS NOT NULL);

CREATE INDEX "User_palestra_ruolo_idx" ON "User"("palestra", "ruolo");

-- Chi ha modificato la giornata per ultimo e quando. Se l'account di chi ha modificato viene cancellato, la giornata resta e il
-- nome sparisce (SET NULL): le altre chiavi verso User sono CASCADE e qui cancellerebbero la scheda di un altro.
ALTER TABLE "GiornoScheda" ADD COLUMN "modificatoDaId" INTEGER;
ALTER TABLE "GiornoScheda" ADD COLUMN "modificatoIl" TIMESTAMP(3);
ALTER TABLE "GiornoScheda" ADD CONSTRAINT "GiornoScheda_modificatoDaId_fkey" FOREIGN KEY ("modificatoDaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
