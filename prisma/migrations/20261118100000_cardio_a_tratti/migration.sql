-- Il cardio a tratti: ogni tratto ha una durata e una velocità, e l'app ne ricava km e calorie.
--
-- 1) "VoceScheda"."velocitaKmh" e "inclinazionePct": la velocità e la pendenza di partenza di un esercizio di cardio con velocità
--    (tapis roulant, corsa all'aperto), uguali per tutti i suoi tratti. La durata di ogni tratto è "durataSec", che c'è già.
-- 2) "SerieEseguita": un tratto di cardio è una serie. Oltre a "durataSec" (il tempo del tratto, che c'è già) ha la velocità, la
--    pendenza, i km, le calorie e i battiti medi. Vuote per tutte le altre serie.
-- 3) "Sessione"."pesoCorporeoKg": il peso di quel giorno, serve a stimare le calorie. La colonna era stata tolta a ottobre
--    (migrazione senza_peso_corporeo) e qui si rimette, vuota per le sedute già salvate.
--
-- Aggiunge soltanto colonne e controlli: nessun dato esistente cambia e il codice di prima funziona anche sul database nuovo (non
-- le legge e, riscrivendo, le lascia vuote). Una serie di cardio ha "ripetizioni" = 1 e nessun peso, come una tenuta: lo impone già
-- il controllo "SerieEseguita_durataSec". Prisma non descrive i CHECK: lo schema aggiunge soltanto le colonne.

ALTER TABLE "VoceScheda" ADD COLUMN "velocitaKmh" DOUBLE PRECISION;
ALTER TABLE "VoceScheda" ADD COLUMN "inclinazionePct" DOUBLE PRECISION;

ALTER TABLE "SerieEseguita" ADD COLUMN "velocitaKmh" DOUBLE PRECISION;
ALTER TABLE "SerieEseguita" ADD COLUMN "inclinazionePct" DOUBLE PRECISION;
ALTER TABLE "SerieEseguita" ADD COLUMN "km" DOUBLE PRECISION;
ALTER TABLE "SerieEseguita" ADD COLUMN "kcal" INTEGER;
ALTER TABLE "SerieEseguita" ADD COLUMN "bpm" INTEGER;

ALTER TABLE "Sessione" ADD COLUMN "pesoCorporeoKg" DOUBLE PRECISION;

-- Nella scheda: la velocità da 0,5 a 30 km/h, la pendenza da 0 a 40 %; la velocità solo su una voce a tempo (con la durata del tratto),
-- e la pendenza solo se c'è la velocità. Gli IS NULL sono scritti apposta: un CHECK che dà "sconosciuto" (NULL) passa.
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_velocita"
  CHECK (
    ("velocitaKmh" IS NULL AND "inclinazionePct" IS NULL)
    OR (
      "velocitaKmh" IS NOT NULL AND "velocitaKmh" BETWEEN 0.5 AND 30
      AND "durataSec" IS NOT NULL
      AND ("inclinazionePct" IS NULL OR "inclinazionePct" BETWEEN 0 AND 40)
    )
  );

-- Nelle serie: le colonne del tratto solo con la durata; i valori dentro limiti sensati. La pendenza solo con la velocità.
ALTER TABLE "SerieEseguita" ADD CONSTRAINT "SerieEseguita_tratto"
  CHECK (
    ("velocitaKmh" IS NULL AND "inclinazionePct" IS NULL AND "km" IS NULL AND "kcal" IS NULL AND "bpm" IS NULL)
    OR (
      "durataSec" IS NOT NULL
      AND ("velocitaKmh" IS NULL OR "velocitaKmh" BETWEEN 0.5 AND 30)
      AND ("inclinazionePct" IS NULL OR ("velocitaKmh" IS NOT NULL AND "inclinazionePct" BETWEEN 0 AND 40))
      AND ("km" IS NULL OR "km" BETWEEN 0 AND 500)
      AND ("kcal" IS NULL OR "kcal" BETWEEN 0 AND 5000)
      AND ("bpm" IS NULL OR "bpm" BETWEEN 30 AND 250)
    )
  );

-- Il peso della seduta: da 20 a 400 kg.
ALTER TABLE "Sessione" ADD CONSTRAINT "Sessione_pesoCorporeoKg"
  CHECK ("pesoCorporeoKg" IS NULL OR "pesoCorporeoKg" BETWEEN 20 AND 400);
