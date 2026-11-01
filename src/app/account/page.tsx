import type { Metadata } from 'next'
import { FormEmail } from '@/components/FormEmail'
import { stileCarta } from '@/components/stili'
import { richiediUtente } from '@/lib/accesso'
import { emailAttiva } from '@/lib/email'
import { mascheraEmail } from '@/lib/indirizzo-email'
import { primoParametro } from '@/lib/url'
import { leggiUtente } from '@/lib/utente'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Account' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AccountPage({ searchParams }: Props) {
  const userId = await richiediUtente()
  const utente = await leggiUtente(userId)
  if (!utente) return null

  const haEmail = utente.email !== null
  const attiva = emailAttiva()
  const appenaReimpostata = primoParametro((await searchParams).r) === '1'

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
        <p className="text-muto">
          {utente.fullName} · <span className="font-semibold text-testo">{utente.username}</span>
        </p>
      </header>

      {appenaReimpostata && (
        <p role="status" className="rounded-2xl bg-ok/10 p-3 text-sm font-semibold text-ok">
          Password cambiata.
        </p>
      )}

      <section className={`${stileCarta} space-y-3 p-4`}>
        <h2 className="text-lg font-extrabold">Email per il recupero</h2>
        <p className="text-sm text-muto">
          Se dimentichi la password, ti mando un&apos;email con un codice per sceglierne una nuova dalla pagina di
          accesso. È l&apos;unico modo:{' '}
          <span className="font-semibold">senza un&apos;email collegata, una password dimenticata non si recupera da qui</span>.
        </p>

        <p className={`rounded-2xl p-3 text-sm font-semibold ${haEmail ? 'bg-ok/10 text-ok' : 'bg-attenzione/15 text-attenzione'}`}>
          {haEmail ? `Email collegata: ${mascheraEmail(utente.email!)}` : 'Nessuna email collegata.'}
        </p>
        {haEmail && (
          <p className="text-sm text-muto">
            L&apos;email non si può togliere, perché serve a recuperare la password. Puoi solo sostituirla con un&apos;altra:
            servono la password e un codice di conferma all&apos;indirizzo nuovo.
          </p>
        )}

        {attiva ? (
          <FormEmail haEmail={haEmail} />
        ) : (
          <p className="rounded-2xl bg-carta-alta p-3 text-sm text-muto">
            L&apos;invio delle email non è attivo su questo server, quindi non si può collegare un indirizzo. Chi gestisce
            il server deve configurarlo (vedi il README).
          </p>
        )}
      </section>
    </div>
  )
}
