import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import Link from 'next/link'
import { esci } from '@/app/login/actions'
import { SimboloGymPulse } from '@/components/Logo'
import { NavSuperiore } from '@/components/NavSuperiore'
import { PiePagina } from '@/components/PiePagina'
import { TemaPulsante } from '@/components/TemaPulsante'
import { haAccesso } from '@/lib/accesso'
import { COLORI_BARRA, SCRIPT_TEMA } from '@/lib/tema'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'GymPulse', template: '%s · GymPulse' },
  description: 'Il tuo diario di allenamento: la tua scheda, le sedute, lo storico e i progressi.',
  applicationName: 'GymPulse',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
  appleWebApp: { capable: true, title: 'GymPulse', statusBarStyle: 'default' },
}

// Il colore della barra del browser sul telefono segue il tema del telefono; se la persona sceglie l'altro tema col
// pulsante, lo cambia il pulsante stesso.
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: COLORI_BARRA.chiaro },
    { media: '(prefers-color-scheme: dark)', color: COLORI_BARRA.scuro },
  ],
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Menu e pulsante "Esci" solo per chi è entrato: le pagine pubbliche hanno la loro intestazione.
  const dentro = await haAccesso()

  return (
    // suppressHydrationWarning: lo script qui sotto aggiunge data-theme a <html> prima che React parta, ed è voluto.
    <html lang="it" className={bricolage.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-fondo font-sans text-testo antialiased">
        {dentro ? (
          <header className="sticky top-0 z-20 border-b border-bordo bg-fondo/95 backdrop-blur">
            <div className="mx-auto max-w-2xl px-4 pt-3">
              <div className="flex items-center justify-between">
                <Link href="/home" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
                  <SimboloGymPulse className="size-7" />
                  GymPulse
                </Link>
                <div className="flex items-center">
                  <TemaPulsante />
                  <Link href="/account" className="rounded-full px-3 py-1.5 text-sm font-semibold text-muto active:bg-carta-alta">
                    Account
                  </Link>
                  <form action={esci}>
                    <button type="submit" className="rounded-full px-3 py-1.5 text-sm font-semibold text-muto active:bg-carta-alta">
                      Esci
                    </button>
                  </form>
                </div>
              </div>
              <NavSuperiore />
            </div>
          </header>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl justify-end px-4 pt-3">
            <TemaPulsante />
          </div>
        )}
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6">{children}</main>
        {/* Il piè di pagina è in tutte le pagine, anche dentro l'app. In fondo resta lo spazio del timer di recupero, fisso
            sullo schermo durante la sessione, che altrimenti coprirebbe il nome. */}
        <div className="mx-auto w-full max-w-2xl px-4 pt-12 pb-20">
          <PiePagina />
        </div>
      </body>
    </html>
  )
}
