// Limite di tentativi: protegge registrazione e accesso da chi prova a scriptare migliaia di richieste.
// Tiene il conto in memoria, per indirizzo, in una finestra di tempo. Su un server solo (e in locale) basta;
// su Vercel ogni istanza ha la sua memoria, quindi il limite è "per istanza": rallenta, non blocca del tutto.
// Per un blocco rigido servirebbe un archivio condiviso (per esempio un database): è un possibile passo successivo.

type Voce = { inizio: number; tentativi: number }

export type EsitoLimite = { consentito: true } | { consentito: false; riprovaTraSec: number }

export function creaLimite(massimo: number, finestraMs: number, maxVoci = 5000) {
  const voci = new Map<string, Voce>()

  // La voce ancora valida per questa chiave, oppure undefined se non c'è o è scaduta.
  const attiva = (chiave: string, adesso: number): Voce | undefined => {
    const voce = voci.get(chiave)
    return voce && adesso - voce.inizio < finestraMs ? voce : undefined
  }

  const bloccato = (voce: Voce, adesso: number): EsitoLimite =>
    voce.tentativi < massimo
      ? { consentito: true }
      : { consentito: false, riprovaTraSec: Math.max(1, Math.ceil((voce.inizio + finestraMs - adesso) / 1000)) }

  // La mappa non deve crescere senza limite: se è piena, si buttano le voci scadute (e se serve, le più vecchie).
  const faiSpazio = (adesso: number) => {
    if (voci.size < maxVoci) return
    for (const [k, v] of voci) if (adesso - v.inizio >= finestraMs) voci.delete(k)
    if (voci.size >= maxVoci) {
      const piuVecchia = voci.keys().next().value
      if (piuVecchia !== undefined) voci.delete(piuVecchia)
    }
  }

  return {
    // Dice se un altro tentativo è consentito, SENZA contarlo. Si usa prima di un'azione che potrebbe essere
    // rifiutata per un errore banale (un campo scritto male) e che non deve consumare il limite.
    controlla(chiave: string, adesso = Date.now()): EsitoLimite {
      const voce = attiva(chiave, adesso)
      return voce ? bloccato(voce, adesso) : { consentito: true }
    },
    // Conta un tentativo andato a buon fine (o comunque da contare).
    conta(chiave: string, adesso = Date.now()): void {
      const voce = attiva(chiave, adesso)
      if (voce) {
        voce.tentativi += 1
        return
      }
      faiSpazio(adesso)
      voci.set(chiave, { inizio: adesso, tentativi: 1 })
    },
    // Controlla e conta in un colpo solo: il tentativo è consentito se non si è già al massimo, e viene registrato.
    prova(chiave: string, adesso = Date.now()): EsitoLimite {
      const esito = this.controlla(chiave, adesso)
      if (esito.consentito) this.conta(chiave, adesso)
      return esito
    },
    // Dimentica una chiave (per esempio dopo un accesso riuscito).
    azzera(chiave: string) {
      voci.delete(chiave)
    },
    dimensione: () => voci.size,
  }
}

export const testoLimite = (secondi: number) =>
  `Troppi tentativi. Riprova tra ${secondi >= 120 ? `${Math.ceil(secondi / 60)} minuti` : `${secondi} secondi`}.`

// L'indirizzo di chi ha fatto la richiesta. Su Vercel arriva in x-forwarded-for; il primo valore è il client.
// Senza intestazione (in locale) si usa una chiave fissa: un solo "indirizzo" per tutti, il che va bene per la prova.
export function indirizzoClient(intestazioni: { get(nome: string): string | null }): string {
  const inoltrato = intestazioni.get('x-forwarded-for')?.split(',')[0]?.trim()
  const reale = intestazioni.get('x-real-ip')?.trim()
  const ip = inoltrato || reale || 'locale'
  return ip.slice(0, 64)
}
