// Super serie: esercizi consecutivi di una giornata da fare senza pausa tra uno e l'altro. Con 2 esercizi si chiama superset, con 3
// triset, con 4 o più gigantset. Il nome non si salva: si ricava da quanti esercizi ha il gruppo.
//
// Le funzioni sono pure e lavorano su qualunque elenco di voci che abbia un `gruppo` (numero, oppure vuoto): le usano il server
// (per controllare), l'editor (per creare e spostare), la scheda e la sessione (per mostrare e per il recupero).

export const GRUPPO_MIN = 2
export const GRUPPO_MAX = 10

export type NomeGruppo = 'Superset' | 'Triset' | 'Gigantset'

export function nomeGruppo(esercizi: number): NomeGruppo {
  return esercizi <= 2 ? 'Superset' : esercizi === 3 ? 'Triset' : 'Gigantset'
}

// Un blocco di esercizi consecutivi con lo stesso gruppo. `da` è l'indice del primo, `quanti` quanti sono.
export type Blocco = { gruppo: number; da: number; quanti: number }

// I blocchi di una giornata nell'ordine in cui compaiono. Un esercizio senza gruppo non fa blocco. Due esercizi con lo stesso numero
// ma separati da un altro esercizio sono due blocchi diversi (e il controllo del server li rifiuta).
export function blocchi(voci: { gruppo: number | null }[]): Blocco[] {
  const trovati: Blocco[] = []
  voci.forEach((voce, indice) => {
    if (voce.gruppo === null) return
    const ultimo = trovati[trovati.length - 1]
    if (ultimo && ultimo.gruppo === voce.gruppo && ultimo.da + ultimo.quanti === indice) ultimo.quanti += 1
    else trovati.push({ gruppo: voce.gruppo, da: indice, quanti: 1 })
  })
  return trovati
}

// Il blocco a cui appartiene l'esercizio in posizione `indice`, se c'è.
export function bloccoDi(voci: { gruppo: number | null }[], indice: number): Blocco | null {
  return blocchi(voci).find((blocco) => indice >= blocco.da && indice < blocco.da + blocco.quanti) ?? null
}

// Controlla le regole di una giornata. Restituisce il messaggio di errore, oppure null se va bene: ogni gruppo è fatto da esercizi
// vicini, da 2 a 10.
export function controllaGruppi(voci: { gruppo: number | null }[]): string | null {
  const tutti = blocchi(voci)
  // Prima di tutto: lo stesso numero non può stare in due blocchi separati (altrimenti il messaggio sulla dimensione sarebbe fuorviante).
  const visti = new Set<number>()
  for (const blocco of tutti) {
    if (visti.has(blocco.gruppo)) return 'Gli esercizi di una super serie devono essere uno dopo l’altro'
    visti.add(blocco.gruppo)
  }
  for (const blocco of tutti) {
    if (blocco.quanti < GRUPPO_MIN) return `Una super serie ha almeno ${GRUPPO_MIN} esercizi`
    if (blocco.quanti > GRUPPO_MAX) return `Una super serie può avere al massimo ${GRUPPO_MAX} esercizi`
  }
  return null
}

// Rinumera i gruppi 1, 2, ... nell'ordine in cui compaiono. Un gruppo che ha un solo esercizio si scioglie (l'esercizio torna
// singolo). Serve dopo ogni modifica: togliere un esercizio, spostare un blocco, sciogliere un gruppo.
export function normalizzaGruppi<T extends { gruppo: number | null }>(voci: T[]): T[] {
  const nuovi = new Map<number, number>()
  const validi = blocchi(voci).filter((blocco) => blocco.quanti >= GRUPPO_MIN)
  validi.forEach((blocco, posizione) => nuovi.set(blocco.da, posizione + 1))
  return voci.map((voce, indice) => {
    const blocco = validi.find((b) => indice >= b.da && indice < b.da + b.quanti)
    return { ...voce, gruppo: blocco ? nuovi.get(blocco.da)! : null }
  })
}

// Sposta un blocco intero (o un esercizio singolo) di una posizione, saltando un intero gruppo vicino: un esercizio singolo non
// entra mai in mezzo a un gruppo. `indice` è un esercizio qualunque del blocco; `verso` è -1 (su) o 1 (giù).
export function spostaBlocco<T extends { gruppo: number | null }>(voci: T[], indice: number, verso: -1 | 1): T[] {
  const questo = bloccoDi(voci, indice) ?? { gruppo: 0, da: indice, quanti: 1 }
  const confine = verso === -1 ? questo.da - 1 : questo.da + questo.quanti
  if (confine < 0 || confine >= voci.length) return voci
  const accanto = bloccoDi(voci, confine) ?? { gruppo: 0, da: confine, quanti: 1 }

  const primo = verso === -1 ? accanto : questo
  const secondo = verso === -1 ? questo : accanto
  const copia = [...voci]
  const spostati = [
    ...voci.slice(secondo.da, secondo.da + secondo.quanti),
    ...voci.slice(primo.da, primo.da + primo.quanti),
  ]
  copia.splice(primo.da, primo.quanti + secondo.quanti, ...spostati)
  return normalizzaGruppi(copia)
}

// Sposta un esercizio di una posizione restando dentro il suo gruppo (scambia con il vicino del gruppo). Fuori dal gruppo non si va.
export function spostaNelGruppo<T extends { gruppo: number | null }>(voci: T[], indice: number, verso: -1 | 1): T[] {
  const blocco = bloccoDi(voci, indice)
  if (!blocco) return voci
  const destinazione = indice + verso
  if (destinazione < blocco.da || destinazione >= blocco.da + blocco.quanti) return voci
  const copia = [...voci]
  ;[copia[indice], copia[destinazione]] = [copia[destinazione], copia[indice]]
  return copia
}

// Mette insieme gli esercizi scelti (per indice) in un solo gruppo, uno dopo l'altro, nel punto del primo. Gli altri restano
// nell'ordine che avevano. `recuperoSec` è il recupero del gruppo. Restituisce le voci nuove con il campo `gruppo` dato dalla
// funzione `conGruppo`, oppure null se la scelta non è valida (meno di 2, o più di 10).
export function creaGruppo<T extends { gruppo: number | null }>(
  voci: T[],
  scelti: number[],
  conGruppo: (voce: T) => T,
): T[] | null {
  const unici = [...new Set(scelti)].sort((a, b) => a - b)
  if (unici.length < GRUPPO_MIN || unici.length > GRUPPO_MAX) return null
  if (unici.some((indice) => indice < 0 || indice >= voci.length || voci[indice].gruppo !== null)) return null

  const insieme = unici.map((indice) => conGruppo(voci[indice]))
  const resto = voci.filter((_, indice) => !unici.includes(indice))
  // Il gruppo va dove stava il primo scelto: si conta quanti esercizi lo precedevano che non sono stati presi.
  const prima = voci.slice(0, unici[0]).length
  resto.splice(prima, 0, ...insieme)
  return normalizzaGruppi(resto)
}

// In sessione: dopo che si è confermata la serie numero `serie` (da 0) di un esercizio, il giro del suo gruppo è finito? Vale quando
// ogni altro esercizio del gruppo che ha quella serie l'ha già confermata (uno a cui la serie è stata tolta, o che ha meno serie,
// non si aspetta). `membri` sono gli esercizi del gruppo nell'ordine della scheda; `corrente` è quello appena confermato, la cui
// serie conta come confermata anche se lo stato non si è ancora aggiornato.
export function giroCompleto(
  membri: { chiave: string; serie: { confermata: boolean }[] }[],
  corrente: string,
  serie: number,
): boolean {
  return membri.every(
    (membro) => membro.chiave === corrente || membro.serie.length <= serie || membro.serie[serie].confermata,
  )
}

// Scioglie il gruppo a cui appartiene l'esercizio in posizione `indice`: tutti i suoi esercizi tornano singoli.
export function sciogliGruppo<T extends { gruppo: number | null }>(voci: T[], indice: number): T[] {
  const blocco = bloccoDi(voci, indice)
  if (!blocco) return voci
  return normalizzaGruppi(
    voci.map((voce, i) => (i >= blocco.da && i < blocco.da + blocco.quanti ? { ...voce, gruppo: null } : voce)),
  )
}
