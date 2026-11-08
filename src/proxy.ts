import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSIONE, INTESTAZIONE_PERCORSO, tokenValido } from '@/lib/sessione-auth'

// Prima porta dell'app: senza un cookie di sessione valido si vedono solo le pagine pubbliche.
// Gli stessi controlli si ripetono in pagine, azioni e /api/export (vedi lib/accesso.ts).
export function proxy(richiesta: NextRequest) {
  const { pathname, search } = richiesta.nextUrl

  // Le pagine pubbliche: la presentazione dell'app (/), la registrazione e le due dell'accesso (entra, recupera la password).
  // La presentazione, se sei già dentro, ti manda alla tua home: lo fa la pagina stessa, che sa chi sei.
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/registrati' ||
    pathname === '/login/recupera'
  ) {
    return NextResponse.next()
  }

  if (tokenValido(richiesta.cookies.get(COOKIE_SESSIONE)?.value, process.env.AUTH_SECRET)) {
    // Passa alle pagine l'indirizzo richiesto (sempre sovrascritto qui: un valore mandato dal browser non conta). Serve
    // quando la firma è buona ma la password nel frattempo è cambiata: la pagina rimanda al login e, dopo l'accesso,
    // si torna dove si era.
    const intestazioni = new Headers(richiesta.headers)
    intestazioni.set(INTESTAZIONE_PERCORSO, pathname + search)
    return NextResponse.next({ request: { headers: intestazioni } })
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ errore: 'Non autorizzato' }, { status: 401 })
  }

  const login = new URL('/login', richiesta.url)
  if (richiesta.method === 'GET') login.searchParams.set('da', pathname + search)
  // 303: dopo un POST il browser deve ripartire con un GET, non rimandare di nuovo i dati.
  return NextResponse.redirect(login, 303)
}

// Fuori dal controllo restano solo i file statici: icone e manifest vengono richiesti dal browser senza cookie, e le
// immagini degli esercizi compaiono anche nella presentazione, che si vede prima di fare l'accesso. Sono uguali per tutti
// e non contengono dati di nessuno.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|icon\\.svg|icon-.*\\.png|apple-icon\\.png|manifest\\.webmanifest|esercizi/).*)',
  ],
}
