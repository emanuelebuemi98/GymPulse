// Le regole comuni dei file CSV dell'app: separatore punto e virgola, UTF-8 con BOM, celle tra virgolette. Le usa
// lib/csv-scheda.ts, che scrive e legge il catalogo e la scheda. Il file si apre in Excel e si legge anche con la virgola o con
// il tab, se è stato salvato da un altro programma.

export const LIMITE_CSV = 900_000 // caratteri: i server action accettano al massimo 1 MB

export const SEPARATORE = ';'

// Chi apre il file in Excel potrebbe eseguire una formula scritta in un nome o in una nota: i testi che
// iniziano con uno di questi caratteri portano un apostrofo davanti, che l'importazione toglie.
const INIZIO_PERICOLOSO = /^[=+\-@\t\r]/

export function proteggi(testo: string): string {
  return INIZIO_PERICOLOSO.test(testo) ? `'${testo}` : testo
}

export function scopri(testo: string): string {
  return testo.startsWith("'") && INIZIO_PERICOLOSO.test(testo.slice(1)) ? testo.slice(1) : testo
}

export function campo(valore: string): string {
  return /[;"\r\n]/.test(valore) ? `"${valore.replaceAll('"', '""')}"` : valore
}

// Divide il testo in righe e celle, con le virgolette del formato CSV: una cella tra virgolette può contenere
// il separatore, un a capo e le virgolette stesse (raddoppiate). Null se le virgolette non si chiudono.
export function dividi(testo: string, separatore: string): string[][] | null {
  const righe: string[][] = []
  let riga: string[] = []
  let cella = ''
  let traVirgolette = false

  for (let i = 0; i < testo.length; i++) {
    const c = testo[i]
    if (traVirgolette) {
      if (c !== '"') cella += c
      else if (testo[i + 1] === '"') {
        cella += '"'
        i++
      } else traVirgolette = false
    } else if (c === '"' && cella === '') {
      traVirgolette = true
    } else if (c === separatore) {
      riga.push(cella)
      cella = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && testo[i + 1] === '\n') i++
      riga.push(cella)
      righe.push(riga)
      riga = []
      cella = ''
    } else {
      cella += c
    }
  }
  if (traVirgolette) return null
  if (cella !== '' || riga.length > 0) {
    riga.push(cella)
    righe.push(riga)
  }
  return righe
}

// Il separatore è quello più frequente nella prima riga: un file salvato all'estero usa la virgola.
export function separatoreDi(testo: string): string {
  const intestazione = testo.split(/\r?\n/, 1)[0]
  const conteggi = [';', ',', '\t'].map((s) => [s, intestazione.split(s).length - 1] as const)
  const [separatore, quanti] = conteggi.reduce((migliore, c) => (c[1] > migliore[1] ? c : migliore))
  return quanti > 0 ? separatore : SEPARATORE
}
