-- La registrazione non manda più un codice per email: l'account nasce subito, con l'indirizzo Gmail scritto dalla persona.
-- La tabella delle registrazioni in attesa del codice non serve più e si toglie. Conteneva solo registrazioni a metà
-- (nome, nome utente, hash della password, indirizzo) che scadevano dopo dieci minuti: nessun account esistente dipende da lì.

DROP TABLE "RegistrazioneSospesa";
