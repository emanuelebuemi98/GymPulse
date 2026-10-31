-- Dati dell'orologio per ogni seduta: frequenza cardiaca media e massima e calorie misurate.
-- Sono facoltativi e le sedute esistenti restano così come sono (le colonne nuove sono vuote).
ALTER TABLE "Sessione" ADD COLUMN "fcMediaBpm" INTEGER;
ALTER TABLE "Sessione" ADD COLUMN "fcMassimaBpm" INTEGER;
ALTER TABLE "Sessione" ADD COLUMN "kcalOrologio" INTEGER;
