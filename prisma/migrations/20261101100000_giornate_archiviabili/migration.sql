-- Il numero di giornate della scheda non è più fisso a tre: da 1 a 7, a scelta di ciascuno.
-- Una giornata che ha delle sedute non si può cancellare (le sedute puntano a lei e si perderebbero): quando la si toglie
-- dalla scheda si segna come non attiva e resta solo per lo storico. Tutte le giornate esistenti restano attive.
ALTER TABLE "GiornoScheda" ADD COLUMN "attiva" BOOLEAN NOT NULL DEFAULT true;
