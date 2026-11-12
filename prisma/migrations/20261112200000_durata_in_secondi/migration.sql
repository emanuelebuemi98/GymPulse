-- La durata di una seduta si salva in secondi, così lo storico la mostra come ore, minuti e secondi. Prima era in minuti interi
-- (`durataMinuti`), scritti a mano.
--
-- La migrazione aggiunge soltanto una colonna, quindi il codice vecchio funziona anche sul database nuovo (continua a leggere
-- `durataMinuti`). Le durate già salvate si riportano in secondi (minuti x 60); `durataMinuti` resta dov'è e non viene più scritta:
-- si potrà togliere con una migrazione successiva, quando non servirà più tornare al codice di prima.

ALTER TABLE "Sessione" ADD COLUMN "durataSecondi" INTEGER;

UPDATE "Sessione" SET "durataSecondi" = "durataMinuti" * 60 WHERE "durataMinuti" IS NOT NULL;
