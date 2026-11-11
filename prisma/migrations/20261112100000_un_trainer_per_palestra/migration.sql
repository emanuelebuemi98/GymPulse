-- Un solo personal trainer per palestra: chi si registra con il codice d'invito e sceglie una palestra la occupa, e nessun altro
-- può più essere trainer di quella palestra. La regola sta nel database e non solo nel modulo, così vale anche se due persone si
-- registrano nello stesso istante: la seconda trova la violazione di unicità e riceve un messaggio chiaro.
--
-- L'indice è parziale: riguarda soltanto i trainer. Gli utenti possono essere quanti si vuole nella stessa palestra, ed è per questo che
-- non c'è un indice unico su (palestra) e basta. Prisma non sa descrivere gli indici parziali (come per i CHECK di questa tabella): lo
-- schema non cambia, e la regola sta qui.
--
-- Se due trainer fossero già nella stessa palestra, la creazione si ferma con un errore e non cambia niente: prima di applicarla si
-- controlla con  SELECT palestra, count(*) FROM "User" WHERE ruolo = 'trainer' GROUP BY palestra HAVING count(*) > 1;

CREATE UNIQUE INDEX "User_un_trainer_per_palestra" ON "User"("palestra") WHERE "ruolo" = 'trainer';
