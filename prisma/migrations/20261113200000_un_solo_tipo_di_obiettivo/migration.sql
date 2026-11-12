-- Un solo tipo di obiettivo, «serie × ripetizioni»: le scelte «ripetizioni totali» e «serie a scelta» spariscono dall'app. Nell'editor
-- le ripetizioni si indicano con un minimo e un massimo, oppure una per ogni serie (piramidali), e di tipo ce n'è uno.
--
-- Gli esercizi che usavano i due tipi tolti diventano «serie × ripetizioni» con numeri neutri: 3 serie da 8-10 ripetizioni e 90 secondi
-- di recupero; per «serie a scelta» le serie sono il minimo che avevano. Si ritoccano dall'editor.
--
-- Le colonne "ripTotali", "serieMin" e "serieMax" restano dove sono, vuote: toglierle romperebbe il codice di prima, che le legge ancora.
-- La migrazione cambia dei valori, non la struttura: il codice di prima continua a funzionare (legge una riga di tipo «serie»), ma
-- non riconosce più come «ripetizioni totali» o «serie a scelta» quei due esercizi. Prisma non descrive i CHECK: lo schema non cambia.

UPDATE "VoceScheda"
SET "tipo" = 'serie',
    "serie" = COALESCE("serieMin", 3),
    "ripMin" = 8,
    "ripMax" = 10,
    "recuperoSec" = 90,
    "ripTotali" = NULL,
    "serieMin" = NULL,
    "serieMax" = NULL
WHERE "tipo" = 'libero';

UPDATE "VoceScheda"
SET "tipo" = 'serie',
    "serie" = 3,
    "ripMin" = 8,
    "ripMax" = 10,
    "recuperoSec" = 90,
    "ripTotali" = NULL,
    "serieMin" = NULL,
    "serieMax" = NULL
WHERE "tipo" = 'totale';

-- Da qui in poi l'unico tipo ammesso è «serie».
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_tipo" CHECK ("tipo" = 'serie');
