import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSIONE, tokenValido } from '@/lib/sessione-auth'

// Prima porta dell'app: senza un cookie di sessione valido si può vedere solo /login.
// Gli stessi controlli si ripetono in pagine, azioni e /api/export (vedi lib/accesso.ts).
export function proxy(richiesta: NextRequest) {
  const { pathname, search } = richiesta.nextUrl

  // Le due pagine pubbliche: accesso e registrazione (che chiede comunque il codice di invito).
  if (pathname === '/login' || pathname === '/login/registrati') return NextResponse.next()

  if (tokenValido(richiesta.cookies.get(COOKIE_SESSIONE)?.value, process.env.AUTH_SECRET)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ errore: 'Non autorizzato' }, { status: 401 })
  }

  const login = new URL('/login', richiesta.url)
  if (richiesta.method === 'GET') login.searchParams.set('da', pathname + search)
  // 303: dopo un POST il browser deve ripartire con un GET, non rimandare di nuovo i dati.
  return NextResponse.redirect(login, 303)
}

// Fuori dal controllo restano solo i file statici: l'icona e il manifest vengono richiesti dal browser senza cookie.
export const config = {
  matcher: ['/((?!_next/static|_next/image|icon.svg|manifest.webmanifest).*)'],
}
