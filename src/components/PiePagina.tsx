import { SimboloGymPulse } from './Logo'

// Il piè di pagina di GymPulse, in fondo a tutte le pagine (si mette una volta sola, nel layout): presentazione, accesso e
// pagine dell'app.
export function PiePagina() {
  return (
    <footer className="space-y-2 border-t border-bordo pt-6 text-center">
      <p className="flex items-center justify-center gap-2 font-extrabold tracking-tight">
        <SimboloGymPulse className="size-6" />
        GymPulse
      </p>
      <p className="text-sm text-muto">
        App ideata e creata da <span className="font-bold text-testo">Emanuele Buemi</span>.
      </p>
      <p className="text-xs text-muto">© {new Date().getFullYear()} Emanuele Buemi</p>
    </footer>
  )
}
