-- Due novità della scheda, tutte e due su "VoceScheda":
--
-- 1) Ripetizioni diverse per ogni serie (12-10-8-6 oppure 6-8-10-12): "ripSerie", un testo con i numeri separati da virgola.
--    Vuoto = uguali per tutte, come prima. "ripMin" e "ripMax" restano e vengono tenuti uguali al minimo e al massimo della lista,
--    così il codice di prima (che legge solo quelli) vede un intervallo giusto invece di rompersi.
--
-- 2) Super serie: superset (2 esercizi), triset (3) e gigantset (4 o più) consecutivi, da fare senza pausa tra uno e l'altro.
--    "gruppo" è il numero del gruppo nella giornata (1, 2, ...), uguale per tutti i suoi esercizi; "recuperoGruppoSec" è il
--    recupero dopo ogni giro del gruppo, scritto uguale su ognuno. Vuoti entrambi per un esercizio singolo.
--
-- Aggiunge soltanto colonne e due controlli: il codice di prima funziona anche sul database nuovo (non le legge e, riscrivendo una
-- giornata, le lascia vuote). Le regole che riguardano più righe insieme (esercizi consecutivi, almeno due per gruppo, solo
-- esercizi "serie × ripetizioni") non si possono scrivere in un CHECK: le controlla il server prima di salvare.
-- Prisma non descrive i CHECK: lo schema aggiunge soltanto le tre colonne.

ALTER TABLE "VoceScheda" ADD COLUMN "ripSerie" TEXT;
ALTER TABLE "VoceScheda" ADD COLUMN "gruppo" INTEGER;
ALTER TABLE "VoceScheda" ADD COLUMN "recuperoGruppoSec" INTEGER;

-- Da 1 a 20 numeri, ognuno da 1 a 100, separati da virgola e senza spazi.
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_ripSerie"
  CHECK ("ripSerie" IS NULL OR "ripSerie" ~ '^([1-9][0-9]?|100)(,([1-9][0-9]?|100)){0,19}$');

-- Il gruppo e il suo recupero vanno insieme: o tutti e due vuoti, o tutti e due scritti (gruppo da 1, recupero da 0 a 900 secondi).
-- Gli IS NOT NULL sono scritti apposta: un CHECK che dà "sconosciuto" (NULL) passa, e con una sola delle due colonne vuota il
-- confronto darebbe proprio quello, lasciando entrare un gruppo senza recupero o un recupero senza gruppo.
ALTER TABLE "VoceScheda" ADD CONSTRAINT "VoceScheda_gruppo"
  CHECK (
    ("gruppo" IS NULL AND "recuperoGruppoSec" IS NULL)
    OR ("gruppo" IS NOT NULL AND "recuperoGruppoSec" IS NOT NULL AND "gruppo" >= 1 AND "recuperoGruppoSec" BETWEEN 0 AND 900)
  );
