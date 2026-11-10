import { db } from './db'

// Una voce del catalogo come la mostra la pagina "Catalogo" e come la scrive il CSV da cui costruire una scheda.
export type VoceCatalogo = {
  id: number
  nome: string
  nomeEn: string
  // Il percorso dell'immagine o vuoto se non c'è.
  immagine: string
  categoria: string
  attrezzatura: string
  muscolo: string
}

// Tutto il catalogo, uguale per tutti, in ordine alfabetico per nome italiano. Senza i testi lunghi (esecuzione,
// accortezze): quelli si chiedono a richiesta, una voce alla volta.
export async function leggiCatalogo(): Promise<VoceCatalogo[]> {
  const righe = await db.catalogoEsercizio.findMany({
    select: { id: true, nomeIt: true, nomeEn: true, immagine: true, categoria: true, attrezzatura: true, muscoloPrincipale: true },
  })
  return righe
    .map((riga) => ({
      id: riga.id,
      nome: riga.nomeIt,
      nomeEn: riga.nomeEn,
      immagine: riga.immagine ?? '',
      categoria: riga.categoria,
      attrezzatura: riga.attrezzatura,
      muscolo: riga.muscoloPrincipale,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}
