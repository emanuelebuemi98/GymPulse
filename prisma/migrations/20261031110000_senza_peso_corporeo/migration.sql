-- Peso corporeo e calorie escono dall'app: la colonna non serve più.
-- Nessun dato da portare via: nel database reale nessuna seduta aveva il peso registrato.
ALTER TABLE "Sessione" DROP COLUMN "pesoCorporeoKg";
