import type { Metadata } from 'next'
import Link from 'next/link'
import { EliminaAccount } from '@/components/EliminaAccount'
import { FormEmail } from '@/components/FormEmail'
import { FormPalestra } from '@/components/FormPalestra'
import { stileCarta } from '@/components/stili'
import { richiediUtente } from '@/lib/accesso'
import { emailAttiva } from '@/lib/email'
import { mascheraEmail } from '@/lib/indirizzo-email'
import { leggiTrainerDellaPalestra } from '@/lib/trainer-db'
import { contaDatiAccount, leggiUtente } from '@/lib/utente'

// Legge il database a ogni richiesta.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Account' }

export default async function AccountPage() {
  const userId = await richiediUtente()
  const utente = await leggiUtente(userId)
  if (!utente) return null

  const haEmail = utente.email !== null
  const attiva = emailAttiva()
  const èTrainer = utente.ruolo === 'trainer'
  // I nomi dei trainer che, grazie alla palestra scelta, possono vedere la scheda: chi ha dato il consenso deve sapere a chi.
  const trainerDellaPalestra = utente.palestra && !èTrainer ? await leggiTrainerDellaPalestra(utente.palestra) : null
  // Cosa sparirebbe eliminando l'account: lo mostra il pannello «Elimina account».
  const dati = await contaDatiAccount(userId)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
      </header>

      {/* Il riepilogo di tutto ciò che l'app sa di te, in un posto solo. */}
      <section aria-labelledby="titolo-profilo" className={`${stileCarta} space-y-3 p-4`}>
        <h2 id="titolo-profilo" className="text-lg font-extrabold">
          Il tuo profilo
        </h2>
        <dl className="divide-y divide-bordo text-sm">
          <Riga etichetta="Tipo di account" valore={èTrainer ? 'Personal trainer' : 'Utente'} />
          <Riga etichetta="Nome" valore={utente.fullName} />
          <Riga etichetta="Nome utente" valore={utente.username} />
          <Riga etichetta="Palestra" valore={utente.palestra ?? 'Nessuna'} spento={!utente.palestra} />
          <Riga
            etichetta="Email"
            valore={haEmail ? mascheraEmail(utente.email!) : 'Nessuna email collegata'}
            spento={!haEmail}
          />
        </dl>
      </section>

      <section className={`${stileCarta} space-y-3 p-4`}>
        <h2 className="text-lg font-extrabold">{èTrainer ? 'La tua palestra' : 'Palestra e personal trainer'}</h2>
        {èTrainer ? (
          <>
            <p className="text-sm text-muto">
              Sei un personal trainer di <span className="font-semibold text-testo">{utente.palestra}</span>. Degli utenti che hanno
              scelto questa palestra vedi il nome e la scheda, e puoi modificarla: giornate, esercizi, serie, ripetizioni, recuperi
              e note. Non vedi i kg che sollevano, lo storico degli allenamenti, i grafici né l&apos;email.
            </p>
            <Link
              href="/trainer"
              className="flex items-center justify-between rounded-2xl bg-carta-alta px-4 py-3 font-semibold active:opacity-80"
            >
              I tuoi allievi
              <span aria-hidden="true" className="text-muto">
                ›
              </span>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-muto">
              Scegliendo la tua palestra, il suo personal trainer può vedere e modificare la tua{' '}
              <span className="font-semibold">scheda</span>: giornate, esercizi, serie, ripetizioni, recuperi e note. Non vede i
              kg che sollevi, lo storico degli allenamenti, i grafici né l&apos;email, e il suo nome compare qui sotto. Puoi
              cambiarla o toglierla quando vuoi: la scheda resta tua e puoi modificarla come sempre.
            </p>
            {utente.palestra && (
              <p className="rounded-2xl bg-carta-alta p-3 text-sm text-muto">
                {trainerDellaPalestra ? (
                  <>
                    Può vedere la tua scheda: <span className="font-semibold text-testo">{trainerDellaPalestra}</span>.
                  </>
                ) : (
                  'Nessun personal trainer è ancora registrato per questa palestra: per ora la tua scheda non la vede nessuno.'
                )}
              </p>
            )}
            <FormPalestra attuale={utente.palestra ?? ''} utenteId={userId} />
          </>
        )}
      </section>

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
          <FormEmail haEmail={haEmail} utenteId={userId} />
        ) : (
          <p className="rounded-2xl bg-carta-alta p-3 text-sm text-muto">
            L&apos;invio delle email non è attivo su questo server, quindi non si può collegare un indirizzo. Chi gestisce
            il server deve configurarlo (vedi il README).
          </p>
        )}
      </section>

      <EliminaAccount utenteId={userId} dati={dati} èTrainer={èTrainer} />
    </div>
  )
}

// Una riga del profilo: etichetta a sinistra, valore a destra. `spento`: il valore è un "niente" (nessuna palestra, nessuna email).
function Riga({ etichetta, valore, spento = false }: { etichetta: string; valore: string; spento?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muto">{etichetta}</dt>
      <dd className={`min-w-0 text-right font-semibold break-words ${spento ? 'text-muto' : 'text-testo'}`}>{valore}</dd>
    </div>
  )
}
