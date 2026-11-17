-- L'isometria a tempo: gli esercizi che si tengono per un tempo (plank, wall sit, trazione isometrica...) hanno una durata in
-- secondi invece di ripetizioni e kg.
--
-- 1) "VoceScheda"."durataSec": la durata di ogni serie nella scheda, uguale per tutte (45 = tre serie da 45 secondi). Vuota per tutti
--    gli altri esercizi. Una voce a tempo non fa parte di una super serie e ha "ripMin" e "ripMax" a 1, così il codice di prima (che
--    legge solo quelli) non si rompe.
-- 2) "SerieEseguita"."durataSec": i secondi tenuti in una serie a tempo. Vuota per le serie con kg e ripetizioni. Una serie a tempo
--    ha "ripetizioni" = 1 e nessun peso: "ripetizioni" resta obbligatoria, come prima.
--
-- Aggiunge soltanto due colonne e due controlli: nessun dato esistente cambia (le colonne nuove sono vuote) e il codice di prima
-- funziona anche sul database nuovo. Le voci di isometria già nelle schede restano senza durata: l'app le legge come 30 secondi
-- finché non si salva la giornata. Prisma non descrive i CHECK: lo schema aggiunge soltanto le due colonne.

ALTER TABLE "VoceScheda" ADD COLUMN "durataSec" INTEGER;
ALTER TABLE "SerieEseguita" ADD COLUMN "durataSec" INTEGER;

-- Da 1 a 3600 secondi (un'ora). Una voce a tempo non sta in una super serie: gli IS NULL sono scritti apposta, perché un CHECK che
-- dà "sconosciuto" (NULL) passa (vedi "VoceScheda_gruppo").
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_durataSec"
  CHECK ("durataSec" IS NULL OR ("durataSec" BETWEEN 1 AND 3600 AND "gruppo" IS NULL));

-- Una serie a tempo non ha peso e conta come una ripetizione.
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_durataSec"
  CHECK ("durataSec" IS NULL OR ("durataSec" BETWEEN 1 AND 3600 AND "pesoKg" IS NULL AND "ripetizioni" = 1));
