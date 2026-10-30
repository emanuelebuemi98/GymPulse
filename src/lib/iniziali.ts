import type { SessioneIniziale } from '../data/dati-iniziali'

// Mezzogiorno UTC: a Roma cade sempre nello stesso giorno, qualunque sia l'ora legale.
export function istanteIniziale(data: string): Date {
  const trovato = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data)
  if (!trovato) throw new Error(`Data non valida: ${data}`)
  return new Date(Date.UTC(Number(trovato[1]), Number(trovato[2]) - 1, Number(trovato[3]), 12))
}

// Dalla sessione scritta a mano ai dati da salvare nel database. Le serie sono numerate di seguito su tutta la sessione.
export function sessioneDaIniziale(sessione: SessioneIniziale, userId: string) {
  let ordine = 0
  const serie = sessione.esercizi.flatMap((esercizio) => {
    const numero = esercizio.kg?.length ?? (Array.isArray(esercizio.rip) ? esercizio.rip.length : 0)
    if (numero === 0) throw new Error(`Nessuna serie per ${esercizio.esercizioId}`)
    if (Array.isArray(esercizio.rip) && esercizio.rip.length !== numero) {
      throw new Error(`Kg e ripetizioni non coincidono per ${esercizio.esercizioId}`)
    }

    return Array.from({ length: numero }, (_, i) => ({
      esercizioId: esercizio.esercizioId,
      ordine: ++ordine,
      pesoKg: esercizio.kg ? esercizio.kg[i] : null,
      ripetizioni: Array.isArray(esercizio.rip) ? esercizio.rip[i] : esercizio.rip,
    }))
  })

  return {
    id: sessione.id,
    userId,
    giornoId: sessione.giornoId,
    data: istanteIniziale(sessione.data),
    datiIniziali: true,
    serie: { create: serie },
  }
}
