-- Il titolo della giornata si salva con la seduta: lo storico mostra quello che la giornata aveva quel giorno.
--
-- Prima la seduta ricordava solo la sigla (A, B, C) e lo storico leggeva il titolo di OGGI della giornata: rinominare «Petto - braccia»
-- in «Petto - dorso» cambiava anche le sedute vecchie, che erano state fatte con altri esercizi.
--
-- "Sessione"."giornoTitolo": il titolo al momento del salvataggio. Le sedute già salvate prendono il titolo che la giornata ha adesso:
-- è l'unico che il database conosce. Dove una giornata era stata rinominata prima di questa migrazione, quel titolo è quello nuovo e va
-- corretto a mano (vedi «Cosa cambia in questo deploy» di DEPLOY.md): la correzione non sta qui perché riguarda dati di una persona
-- precisa e questa migrazione gira su ogni database.
--
-- Aggiunge soltanto una colonna: il codice di prima funziona anche sul database nuovo (non la legge e, salvando, la lascia vuota).
-- La colonna resta facoltativa: dove è vuota il codice legge il titolo attuale della giornata, come faceva prima.

ALTER TABLE "Sessione" ADD COLUMN "giornoTitolo" TEXT;

UPDATE "Sessione" s
SET "giornoTitolo" = g."titolo"
FROM "GiornoScheda" g
WHERE g."userId" = s."userId" AND g."id" = s."giornoId";
