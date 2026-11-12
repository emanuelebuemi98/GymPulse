import type { VoceForm } from './scheda-form'

// Bozza della scheda che si sta scrivendo, salvata nel browser: se si esce per sbaglio dall'editor (Annulla, indietro, la pagina
// che si ricarica, il telefono che chiude il browser) le modifiche non si perdono. Come la bozza della sessione (bozza.ts), ma
// con un prefisso diverso, così la home non la scambia per una sessione da riprendere. Tutto in try/catch: lo spazio può non
// essere disponibile.
//
// La chiave porta tre cose: chi sta modificando, di chi è la scheda e la giornata. Così un personal trainer che modifica la
// scheda di un allievo non mischia la bozza con quella della propria, e due account sullo stesso browser non si vedono.
// La bozza ricorda anche la `versione` della giornata da cui è partita (il momento dell'ultima modifica): se nel frattempo la
// giornata è cambiata (un trainer, un altro telefono) la bozza non si applica in silenzio. Vale 24 ore dall'ultima modifica.
const PREFISSO = 'gympulse-scheda-'
const VALIDITA_MS = 24 * 60 * 60 * 1000

export type BozzaScheda = { titolo: string; voci: VoceForm[]; versione: string | null }

const chiave = (utenteId: number, proprietarioId: number, giornoId: string) => `${PREFISSO}${utenteId}-${proprietarioId}-${giornoId}`

const CAMPI_TESTO = [
  'chiave',
  'nome',
  'nomeEn',
  'immagine',
  'categoria',
  'serie',
  'ripMin',
  'ripMax',
  'recuperoSec',
  'nota',
  'incrementoKg',
] as const

// Campi nati dopo la prima versione della bozza: una bozza scritta prima non li ha, e non per questo va buttata. In lettura si
// completano con "nessuno" (ripetizioni uguali per tutte, nessuna super serie).
const èIdOnull = (valore: unknown) => valore === null || (typeof valore === 'number' && Number.isInteger(valore))
const èGruppo = (valore: unknown) => valore === null || (typeof valore === 'number' && Number.isInteger(valore) && valore >= 1 && valore <= 999)
const èTestoFacoltativo = (valore: unknown) => valore === undefined || (typeof valore === 'string' && valore.length <= 300)

// Il contenuto viene dal browser: prima di usarlo si controlla che sia fatto come una riga dell'editor.
function voceValida(valore: unknown): valore is VoceForm {
  if (typeof valore !== 'object' || valore === null) return false
  const v = valore as Record<string, unknown>
  if (!CAMPI_TESTO.every((campo) => typeof v[campo] === 'string' && (v[campo] as string).length <= 300)) return false
  // Una bozza scritta quando c'erano ancora i tipi «ripetizioni totali» e «serie a scelta» ha un tipo (e dei campi) che ora non
  // servono: non è un errore, l'esercizio è trattato come «serie × ripetizioni» con i numeri che ha.
  // L'immagine è un file dell'app o niente: un percorso diverso non si carica.
  const immagine = v.immagine as string
  if (immagine !== '' && !immagine.startsWith('/esercizi/')) return false
  if (!èTestoFacoltativo(v.ripSerie) || !èTestoFacoltativo(v.recuperoGruppo)) return false
  if (v.gruppo !== undefined && !èGruppo(v.gruppo)) return false
  return èIdOnull(v.esercizioId) && èIdOnull(v.catalogoId) && èIdOnull(v.catalogoRif)
}

// Completa una riga letta dalla bozza con i campi che una bozza più vecchia non aveva.
function completa(voce: VoceForm & { tipo?: unknown; ripTotali?: unknown; serieMin?: unknown; serieMax?: unknown }): VoceForm {
  // Si tolgono i campi dei vecchi tipi: non fanno più parte di una riga, e l'impronta (che confronta con la scheda salvata)
  // altrimenti risulterebbe sempre diversa.
  const { tipo: _tipo, ripTotali: _ripTotali, serieMin: _serieMin, serieMax: _serieMax, ...resto } = voce
  void _tipo, _ripTotali, _serieMin, _serieMax
  return { ...resto, ripSerie: voce.ripSerie ?? '', gruppo: voce.gruppo ?? null, recuperoGruppo: voce.recuperoGruppo ?? '' }
}

function leggiVoce(grezzo: string, ora: number): BozzaScheda | null {
  const letto: unknown = JSON.parse(grezzo)
  if (typeof letto !== 'object' || letto === null) return null
  const { salvatoIl, dati } = letto as { salvatoIl?: unknown; dati?: unknown }
  if (typeof salvatoIl !== 'number' || ora - salvatoIl > VALIDITA_MS) return null
  if (typeof dati !== 'object' || dati === null) return null
  const { titolo, voci, versione } = dati as { titolo?: unknown; voci?: unknown; versione?: unknown }
  if (typeof titolo !== 'string' || titolo.length > 200) return null
  if (!Array.isArray(voci) || voci.length > 50 || !voci.every(voceValida)) return null
  if (versione !== null && typeof versione !== 'string') return null
  return { titolo, voci: (voci as VoceForm[]).map(completa), versione }
}

// L'impronta di una scheda dell'editor: serve a sapere se è uguale a quella salvata. Le chiavi si ordinano, così non conta
// l'ordine in cui sono scritte.
export function improntaScheda(titolo: string, voci: VoceForm[]): string {
  return JSON.stringify([
    titolo,
    voci.map((voce) => Object.entries(voce).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  ])
}

// La bozza di questa giornata, se c'è ed è valida. Una bozza scaduta o illeggibile si butta.
export function leggiBozzaScheda(utenteId: number, proprietarioId: number, giornoId: string, ora = Date.now()): BozzaScheda | null {
  const k = chiave(utenteId, proprietarioId, giornoId)
  try {
    const grezzo = localStorage.getItem(k)
    if (!grezzo) return null
    const bozza = leggiVoce(grezzo, ora)
    if (!bozza) localStorage.removeItem(k)
    return bozza
  } catch {
    try {
      localStorage.removeItem(k)
    } catch {
      // niente da fare
    }
    return null
  }
}

export function salvaBozzaScheda(utenteId: number, proprietarioId: number, giornoId: string, dati: BozzaScheda): void {
  try {
    localStorage.setItem(chiave(utenteId, proprietarioId, giornoId), JSON.stringify({ salvatoIl: Date.now(), dati }))
  } catch {
    // spazio pieno o storage bloccato: la bozza è solo una comodità
  }
}

export function eliminaBozzaScheda(utenteId: number, proprietarioId: number, giornoId: string): void {
  try {
    localStorage.removeItem(chiave(utenteId, proprietarioId, giornoId))
  } catch {
    // niente da fare
  }
}

// Butta le bozze di scheda scadute o illeggibili di chiunque. Una bozza ancora valida non si tocca mai.
export function ripulisciBozzeSchedeScadute(ora = Date.now()): void {
  try {
    const daTogliere: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith(PREFISSO)) continue
      try {
        const grezzo = localStorage.getItem(k)
        if (!grezzo || !leggiVoce(grezzo, ora)) daTogliere.push(k)
      } catch {
        daTogliere.push(k)
      }
    }
    for (const k of daTogliere) localStorage.removeItem(k)
  } catch {
    // niente da fare
  }
}

// Toglie dal browser TUTTE le bozze di scheda scritte da una persona, anche se ancora valide. Si usa quando l'account viene
// eliminato. Le bozze degli altri account sullo stesso browser non si toccano (la chiave porta l'id). Restituisce quante ne ha
// tolte.
export function eliminaBozzeSchedeDi(utenteId: number): number {
  try {
    const inizio = `${PREFISSO}${utenteId}-`
    const daTogliere: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(inizio)) daTogliere.push(k)
    }
    for (const k of daTogliere) localStorage.removeItem(k)
    return daTogliere.length
  } catch {
    return 0
  }
}
