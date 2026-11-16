-- Due cose, entrambe che si limitano ad AGGIUNGERE:
--
-- 1. La colonna "gif" del catalogo: il percorso dell'animazione dell'esercizio (per esempio '/gif-esercizi/45_lat-pulldown.gif'), vuota se
--    non c'è. Nel «Come si fa» si vede la gif al posto della foto; senza gif si vede la foto, e senza nessuna delle due niente. La
--    carica `npm run db:catalogo`, come le foto. La colonna è facoltativa e non ha un valore di partenza, quindi il codice di prima
--    funziona anche sul database nuovo (non la legge).
--
-- 2. La categoria «isometria», per gli esercizi di tenuta (plank, ponte laterale, wall sit…): i due controlli sulla categoria ammettono
--    una chiave in più, le categorie salgono da undici a dodici. Gli esercizi che passano a «isometria» li sposta `npm run db:catalogo`
--    (legge la categoria dal file del catalogo e la riporta anche sugli esercizi delle persone collegati al catalogo: schede e
--    storico restano agganciati agli stessi esercizi, cambia solo la categoria). Il codice di prima non conosce la chiave nuova: finché
--    non si pubblica quello nuovo, quegli esercizi non compaiono sotto nessuna categoria nel catalogo, senza errori.

ALTER TABLE "CatalogoEsercizio" ADD COLUMN "gif" TEXT;

ALTER TABLE "CatalogoEsercizio" DROP CONSTRAINT "CatalogoEsercizio_categoria";
ALTER TABLE "CatalogoEsercizio"
  ADD CONSTRAINT "CatalogoEsercizio_categoria"
  CHECK ("categoria" IN ('petto', 'dorsali', 'spalle', 'bicipiti', 'tricipiti', 'avambracci', 'gambe', 'glutei', 'addome', 'isometria', 'cardio', 'riscaldamento'));

ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_categoria";
ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_categoria"
  CHECK ("categoria" IN ('', 'petto', 'dorsali', 'spalle', 'bicipiti', 'tricipiti', 'avambracci', 'gambe', 'glutei', 'addome', 'isometria', 'cardio', 'riscaldamento'));
