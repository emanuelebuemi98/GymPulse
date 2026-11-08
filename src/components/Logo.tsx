// Il logo di GymPulse: una kettlebell con il battito dentro. Il disegno è lo stesso di public/icon.svg (l'icona del
// browser e del telefono), ma qui prende i colori del tema, così in chiaro e in scuro resta leggibile.
export function SimboloGymPulse({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="15" className="fill-accento" />
      <path
        d="M23.5 25C22 11 42 11 40.5 25"
        fill="none"
        strokeWidth={4.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-su-accento"
      />
      <circle cx="32" cy="38" r="16" className="fill-su-accento" />
      <path
        d="M21 38H27L30 31L35 45L38 38H43"
        fill="none"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-accento"
      />
    </svg>
  )
}

// Simbolo e nome, al centro: per le pagine di accesso e la schermata di benvenuto.
export function LogoGymPulse({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-2.5 text-xl font-extrabold tracking-tight ${className}`}>
      <SimboloGymPulse className="size-9" />
      GymPulse
    </p>
  )
}
