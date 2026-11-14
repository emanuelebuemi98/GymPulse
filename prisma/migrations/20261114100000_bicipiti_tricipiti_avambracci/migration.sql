-- La categoria «braccia» si divide in tre: «bicipiti», «tricipiti» e «avambracci». Le categorie salgono da nove a undici.
--
-- Questa migrazione cambia dei valori, non la struttura: i due vincoli scritti a mano (Prisma non li descrive, quindi lo schema non
-- cambia) ammettono le tre chiavi nuove e non più «braccia».
--
-- 1. Catalogo: le voci di «braccia» si distribuiscono in base al loro numero, che è lo stesso in sviluppo e in produzione (lo fissa
--    prisma/dati/catalogo-esercizi.json): 100-115 bicipiti, 116-135 tricipiti tranne 120, 124, 125 e 127, che sono avambracci. Nessun
--    altro numero può essere di «braccia»: se ce ne fosse uno, la migrazione si ferma (NOT NULL) invece di indovinare.
-- 2. Esercizio: gli esercizi collegati al catalogo prendono la categoria della loro voce. Quelli personali che erano «braccia» e non
--    sono collegati diventano senza categoria (testo vuoto), come già successe con «olimpico» e «corpo_intero»: `npm run db:catalogo`
--    li ricollega da solo se il nome coincide con una voce del catalogo, e a quel punto prendono la categoria giusta.
-- 3. Le serie, la scheda e lo storico non si toccano: cambia solo l'etichetta con cui si raggruppano i kg.
--
-- Il codice di prima, ancora online tra la migrazione e la pubblicazione, non conosce le tre chiavi nuove: per quel breve intervallo gli
-- esercizi delle braccia non compaiono sotto nessuna categoria nel catalogo e i loro kg non entrano nel grafico per categoria. Non dà
-- errori e il database resta coerente; si risolve da solo con la pubblicazione del codice nuovo.

ALTER TABLE "CatalogoEsercizio" DROP CONSTRAINT "CatalogoEsercizio_categoria";

UPDATE "CatalogoEsercizio"
SET "categoria" = CASE
  WHEN "id" IN (120, 124, 125, 127) THEN 'avambracci'
  WHEN "id" BETWEEN 100 AND 115 THEN 'bicipiti'
  WHEN "id" BETWEEN 116 AND 135 THEN 'tricipiti'
END
WHERE "categoria" = 'braccia';

ALTER TABLE "CatalogoEsercizio"
  ADD CONSTRAINT "CatalogoEsercizio_categoria"
  CHECK ("categoria" IN ('petto', 'dorsali', 'spalle', 'bicipiti', 'tricipiti', 'avambracci', 'gambe', 'glutei', 'addome', 'cardio', 'riscaldamento'));

ALTER TABLE "Esercizio" DROP CONSTRAINT "Esercizio_categoria";

UPDATE "Esercizio" AS e
SET "categoria" = c."categoria"
FROM "CatalogoEsercizio" AS c
WHERE e."catalogoId" = c."id" AND e."categoria" = 'braccia';

UPDATE "Esercizio" SET "categoria" = '' WHERE "categoria" = 'braccia';

ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_categoria"
  CHECK ("categoria" IN ('', 'petto', 'dorsali', 'spalle', 'bicipiti', 'tricipiti', 'avambracci', 'gambe', 'glutei', 'addome', 'cardio', 'riscaldamento'));
