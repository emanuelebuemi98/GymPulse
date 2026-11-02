-- Tolti i dati dell'orologio (battiti medi e massimi, calorie): l'app non li usa più. La durata della seduta resta.
-- Le colonne si cancellano con quello che contengono: nessuna seduta registrata finora le aveva compilate.
ALTER TABLE "Sessione" DROP COLUMN "fcMediaBpm";
ALTER TABLE "Sessione" DROP COLUMN "fcMassimaBpm";
ALTER TABLE "Sessione" DROP COLUMN "kcalOrologio";
