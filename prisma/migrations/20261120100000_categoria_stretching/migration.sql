-- La categoria «riscaldamento» si chiama «stretching»: cambia la chiave, non solo il nome che si vede.
--
-- Come nelle migrazioni sulle categorie di prima, i due controlli (CatalogoEsercizio_categoria ed Esercizio_categoria) ammettono soltanto le
-- chiavi elencate: vanno tolti prima di cambiare i valori e rimessi dopo, con «stretching» al posto di «riscaldamento». Gli esercizi delle
-- persone seguono la voce del catalogo, e anche quelli personali (senza collegamento al catalogo) che avevano la vecchia chiave la cambiano.
-- Nessun dato si perde: cambia solo il testo della categoria.
--
-- ATTENZIONE: a differenza delle ultime migrazioni, che aggiungevano soltanto colonne, questa CAMBIA dei valori. Il codice vecchio, finché non si
-- pubblica quello nuovo, non conosce «stretching»: le voci di stretching non compaiono sotto nessuna categoria nel catalogo e in scheda non
-- mostrano la categoria, senza errori. Per questo migrazione e merge su main si fanno uno dopo l'altro, senza pause.
-- Il catalogo non va ricaricato: le sue voci le aggiorna già questa migrazione, ed è uguale al file. Se si lancia `db:catalogo` PRIMA della
-- migrazione, si ferma senza scrivere niente (il file nuovo ha «stretching», che il controllo vecchio rifiuta).

ALTER TABLE "CatalogoEsercizio" DROP CONSTRAINT "CatalogoEsercizio_categoria";
ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_categoria";

UPDATE "CatalogoEsercizio" SET "categoria" = 'stretching' WHERE "categoria" = 'riscaldamento';
UPDATE "Esercizio" SET "categoria" = 'stretching' WHERE "categoria" = 'riscaldamento';

ALTER TABLE "CatalogoEsercizio"
  ADD CONSTRAINT "CatalogoEsercizio_categoria"
  CHECK ("categoria" IN ('petto', 'dorsali', 'spalle', 'bicipiti', 'tricipiti', 'avambracci', 'gambe', 'glutei', 'addome', 'isometria', 'cardio', 'stretching'));

ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_categoria"
  CHECK ("categoria" IN ('', 'petto', 'dorsali', 'spalle', 'bicipiti', 'tricipiti', 'avambracci', 'gambe', 'glutei', 'addome', 'isometria', 'cardio', 'stretching'));
