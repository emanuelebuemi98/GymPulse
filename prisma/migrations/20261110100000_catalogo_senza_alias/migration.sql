-- Il catalogo non ha più gli "alias" (altri nomi con cui cercare o ritrovare un esercizio): la ricerca e il collegamento
-- per nome usano solo il nome italiano e il nome inglese. Si toglie la sola colonna; nessun esercizio, scheda o seduta cambia.

ALTER TABLE "CatalogoEsercizio" DROP COLUMN "alias";
