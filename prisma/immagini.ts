import { existsSync, readdirSync } from 'node:fs'

// Le immagini degli esercizi stanno in public/esercizi, una per esercizio. Il nome del file è il numero dell'esercizio e il
// suo slug, separati da un trattino basso: 35_push-up.jpg (anche .png o .webp). Si accettano anche i nomi più corti, solo
// lo slug (push-up.jpg) o solo il numero (35.jpg). Lo script del catalogo le ritrova da qui, quindi per aggiungerne una
// basta mettere il file nella cartella e rilanciare `npm run db:catalogo`.

const ESTENSIONI = ['jpg', 'jpeg', 'png', 'webp'] as const

export type EserciziPerImmagini = { id: number; slug: string }

export type RisultatoImmagini = {
  // slug -> percorso pubblico ('/esercizi/35_push-up.jpg')
  perSlug: Map<string, string>
  // file con un nome che non è di nessun esercizio (un errore di battitura)
  senzaEsercizio: string[]
  // più file per lo stesso esercizio (jpg e png insieme, oppure 35.jpg e 35_push-up.jpg): non si sa quale tenere
  doppie: string[]
  // il numero nel nome non è quello dello slug (di solito perché i numeri sono cambiati): l'immagine si usa lo stesso,
  // perché il contenuto lo dice lo slug, ma il file andrebbe rinominato
  numeroDiverso: string[]
}

// Per ogni esercizio del catalogo il file della sua immagine, se c'è nella cartella.
export function trovaImmagini(cartella: string, esercizi: Iterable<EserciziPerImmagini>): RisultatoImmagini {
  const perSlugNoto = new Map<string, number>()
  const perId = new Map<number, string>()
  for (const { id, slug } of esercizi) {
    perSlugNoto.set(slug, id)
    perId.set(id, slug)
  }

  const risultato: RisultatoImmagini = { perSlug: new Map(), senzaEsercizio: [], doppie: [], numeroDiverso: [] }
  if (!existsSync(cartella)) return risultato

  const trovati = new Map<string, string[]>()
  const avvisi = new Map<string, string>()
  for (const file of readdirSync(cartella)) {
    const punto = file.lastIndexOf('.')
    if (punto <= 0) continue
    const nome = file.slice(0, punto).toLowerCase()
    const estensione = file.slice(punto + 1).toLowerCase()
    if (!(ESTENSIONI as readonly string[]).includes(estensione)) continue

    let slug: string | undefined
    let numero: number | undefined
    const completo = /^(\d+)_(.+)$/.exec(nome)
    if (/^\d+$/.test(nome)) {
      numero = Number(nome)
      slug = perId.get(numero)
    } else if (completo) {
      numero = Number(completo[1])
      slug = completo[2]
    } else {
      slug = nome
    }

    if (slug === undefined || !perSlugNoto.has(slug)) {
      risultato.senzaEsercizio.push(file)
      continue
    }
    const idVero = perSlugNoto.get(slug)!
    if (numero !== undefined && numero !== idVero) avvisi.set(file, `${file}: il numero giusto di ${slug} è ${idVero}`)
    trovati.set(slug, [...(trovati.get(slug) ?? []), file])
  }

  for (const [slug, file] of trovati) {
    if (file.length > 1) {
      risultato.doppie.push(`${slug}: ${file.join(', ')}`)
      continue
    }
    risultato.perSlug.set(slug, `/esercizi/${file[0]}`)
    const avviso = avvisi.get(file[0])
    if (avviso) risultato.numeroDiverso.push(avviso)
  }
  risultato.senzaEsercizio.sort()
  risultato.doppie.sort()
  risultato.numeroDiverso.sort()
  return risultato
}

// Le animazioni (gif) stanno in public/gif-esercizi, una per esercizio, con lo stesso nome delle foto: 45_lat-pulldown.gif, il numero e lo slug
// separati da un trattino basso. A differenza delle foto non ci sono nomi più corti: un file con un nome che non è di nessun esercizio viene
// segnalato, e chi non ha la gif resta senza (nel «Come si fa» si vede allora la foto). Il confronto non bada alle maiuscole.
export type RisultatoGif = {
  // slug -> percorso pubblico ('/gif-esercizi/45_lat-pulldown.gif')
  perSlug: Map<string, string>
  // file con un nome che non è di nessun esercizio (un errore di battitura, o un numero che non è quello dello slug)
  senzaEsercizio: string[]
  // più file per lo stesso esercizio (per esempio 45_lat-pulldown.gif e 45_Lat-Pulldown.gif)
  doppie: string[]
}

export function trovaGif(cartella: string, esercizi: Iterable<EserciziPerImmagini>): RisultatoGif {
  const nomi = new Map<string, string>() // '45_lat-pulldown' -> slug
  for (const { id, slug } of esercizi) nomi.set(`${id}_${slug}`, slug)

  const risultato: RisultatoGif = { perSlug: new Map(), senzaEsercizio: [], doppie: [] }
  if (!existsSync(cartella)) return risultato

  const trovati = new Map<string, string[]>()
  for (const file of readdirSync(cartella)) {
    const punto = file.lastIndexOf('.')
    if (punto <= 0 || file.slice(punto + 1).toLowerCase() !== 'gif') continue
    const nome = file.slice(0, punto).toLowerCase()
    const slug = nomi.get(nome)
    if (slug === undefined) {
      risultato.senzaEsercizio.push(file)
      continue
    }
    trovati.set(slug, [...(trovati.get(slug) ?? []), file])
  }
  for (const [slug, file] of trovati) {
    if (file.length > 1) risultato.doppie.push(`${slug}: ${file.join(', ')}`)
    else risultato.perSlug.set(slug, `/gif-esercizi/${file[0]}`)
  }
  risultato.senzaEsercizio.sort()
  risultato.doppie.sort()
  return risultato
}
