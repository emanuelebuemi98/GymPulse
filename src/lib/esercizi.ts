// Id di un esercizio aggiunto dall'utente: "x-" + nome semplificato + un suffisso casuale.
// Il prefisso evita collisioni con gli id della scheda predefinita.
export function creaIdEsercizio(nome: string, casuale: () => string = () => crypto.randomUUID().slice(0, 6)): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/, '')
  return `x-${base || 'esercizio'}-${casuale()}`
}
