-- Le categorie scendono da dieci a otto: "altri" diventa "riscaldamento", "olimpico" e "corpo_intero" non esistono più.
--
-- 1. Catalogo: le voci olimpiche e a corpo intero si tolgono. Gli esercizi delle persone collegati a una di queste voci
--    non si perdono (la chiave esterna è ON DELETE SET NULL): restano nelle loro schede e nel loro storico, ma diventano
--    esercizi personali, senza categoria. Le voci "altri" prendono il nuovo nome.
-- 2. Esercizio: "altri" diventa "riscaldamento"; "olimpico" e "corpo_intero" diventano il testo vuoto (senza categoria).
-- 3. I due vincoli scritti a mano ammettono solo le otto chiavi nuove. Vanno tolti prima di cambiare i valori e rimessi dopo.

ALTER TABLE "CatalogoEsercizio" DROP CONSTRAINT "CatalogoEsercizio_categoria";

DELETE FROM "CatalogoEsercizio" WHERE "categoria" IN ('olimpico', 'corpo_intero');
UPDATE "CatalogoEsercizio" SET "categoria" = 'riscaldamento' WHERE "categoria" = 'altri';

ALTER TABLE "CatalogoEsercizio"
  ADD CONSTRAINT "CatalogoEsercizio_categoria"
  CHECK ("categoria" IN ('petto', 'dorsali', 'spalle', 'braccia', 'gambe', 'addome', 'cardio', 'riscaldamento'));

ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_categoria";

UPDATE "Esercizio" SET "categoria" = 'riscaldamento' WHERE "categoria" = 'altri';
UPDATE "Esercizio" SET "categoria" = '' WHERE "categoria" IN ('olimpico', 'corpo_intero');

ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_categoria"
  CHECK ("categoria" IN ('', 'petto', 'dorsali', 'spalle', 'braccia', 'gambe', 'addome', 'cardio', 'riscaldamento'));
