-- Nasce la categoria "glutei", separata da "gambe": le categorie salgono da otto a nove.
--
-- Questa migrazione cambia solo i due vincoli scritti a mano, che ammettono le chiavi permesse. Gli esercizi che passano
-- da "gambe" a "glutei" li sposta `npm run db:catalogo`, che legge la categoria di ogni esercizio da
-- prisma/dati/catalogo-esercizi.json e la riporta anche sugli esercizi delle persone collegati al catalogo: le loro schede
-- e il loro storico restano agganciati agli stessi esercizi, cambia solo la categoria.

ALTER TABLE "CatalogoEsercizio" DROP CONSTRAINT "CatalogoEsercizio_categoria";
ALTER TABLE "CatalogoEsercizio"
  ADD CONSTRAINT "CatalogoEsercizio_categoria"
  CHECK ("categoria" IN ('petto', 'dorsali', 'spalle', 'braccia', 'gambe', 'glutei', 'addome', 'cardio', 'riscaldamento'));

ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_categoria";
ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_categoria"
  CHECK ("categoria" IN ('', 'petto', 'dorsali', 'spalle', 'braccia', 'gambe', 'glutei', 'addome', 'cardio', 'riscaldamento'));
