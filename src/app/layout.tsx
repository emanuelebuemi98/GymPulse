import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { NavSuperiore } from '@/components/NavSuperiore'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'GymPulse', template: '%s · GymPulse' },
  description: 'Il tuo diario di allenamento: scheda A, B e C, sedute, storico e progressi.',
  applicationName: 'GymPulse',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  appleWebApp: { capable: true, title: 'GymPulse', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#f2eee3',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={bricolage.variable}>
      <body className="min-h-dvh bg-fondo font-sans text-testo antialiased">
        <header className="sticky top-0 z-20 border-b border-bordo bg-fondo/95 backdrop-blur">
          <div className="mx-auto max-w-2xl px-4 pt-3">
            <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <span aria-hidden="true" className="size-2.5 rounded-full bg-accento" />
              GymPulse
            </p>
            <NavSuperiore />
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 pt-6 pb-20">{children}</main>
      </body>
    </html>
  )
}
