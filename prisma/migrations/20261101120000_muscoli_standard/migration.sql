-- Ogni esercizio appartiene a una delle sette categorie standard (PETTO, SPALLE, BICIPITI, TRICIPITI, DORSO, GAMBE,
-- ADDOME). Prima "muscoli" era un testo libero ("Quadricipiti / glutei"): lo si converte nella categoria che il testo
-- nomina per prima (il muscolo principale), e poi il database accetta solo quelle.
--
-- "Bicipite femorale" è un muscolo della coscia (GAMBE), non il bicipite del braccio: BICIPITI non scatta quando dopo
-- "bicipite" c'è "femorale". Un testo che non somiglia a nessuna categoria diventa vuoto (da scegliere dalla scheda).
-- Se la categoria dedotta non è quella giusta, si cambia dalla scheda (Personalizza).

UPDATE "Esercizio" e
   SET "muscoli" = coalesce((
     SELECT t.gruppo
       FROM (VALUES
         (1, 'PETTO',     'petto|pettoral'),
         (2, 'SPALLE',    'spall|deltoid'),
         (3, 'BICIPITI',  'bicip(?![a-z]*\s+femoral)'),
         (4, 'TRICIPITI', 'tricip'),
         (5, 'DORSO',     'dors|trapez|romboid|lombar'),
         (6, 'GAMBE',     'gamb|quadricip|femoral|ischiocrural|glute|polpacc|gastrocnem|soleo'),
         (7, 'ADDOME',    'addom|abdom')
       ) AS t(ordine, gruppo, regola)
      WHERE regexp_instr(e."muscoli", t.regola, 1, 1, 0, 'i') > 0
      ORDER BY regexp_instr(e."muscoli", t.regola, 1, 1, 0, 'i'), t.ordine
      LIMIT 1
   ), '');

-- Ammessi: nessuna categoria (esercizi arrivati da un CSV, da completare dalla scheda) oppure una delle sette.
ALTER TABLE "Esercizio"
  ADD CONSTRAINT "Esercizio_muscoli_standard"
  CHECK ("muscoli" IN ('', 'PETTO', 'SPALLE', 'BICIPITI', 'TRICIPITI', 'DORSO', 'GAMBE', 'ADDOME'));
