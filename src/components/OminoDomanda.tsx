// L'omino pensieroso con il punto interrogativo, disegnato per GymPulse. È un disegno vettoriale senza sfondo: nitido a
// qualunque grandezza e con i colori del tema (verde dell'accento per la figura, carta per il fumetto), quindi si legge sia
// in chiaro sia in scuro. Sta nel pulsante "Come si fa". È decorazione: il pulsante ha già il suo nome.

// Un tono più scuro dell'accento per il contorno delle braccia, così si staccano dal corpo senza un colore nuovo.
const SCURO = 'color-mix(in srgb, var(--color-accento) 70%, var(--color-testo))'

export function OminoDomanda({ className = 'h-12 w-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 146" aria-hidden="true" className={className}>
      {/* L'ombra a terra */}
      <ellipse cx="45" cy="141" rx="22" ry="3.6" style={{ fill: 'var(--color-testo)', opacity: 0.14 }} />

      {/* Il fumetto: due bolle piccole che salgono dalla testa e quella grande con il punto interrogativo */}
      <circle cx="64" cy="49" r="3.2" style={{ fill: 'var(--color-carta)', stroke: 'var(--color-accento)', strokeWidth: 1.6 }} />
      <circle cx="69" cy="40" r="4.8" style={{ fill: 'var(--color-carta)', stroke: 'var(--color-accento)', strokeWidth: 1.6 }} />
      <ellipse cx="89" cy="22" rx="27" ry="19" style={{ fill: 'var(--color-carta)', stroke: 'var(--color-accento)', strokeWidth: 2 }} />
      <path
        d="M80.5 17.5c0-4.9 3.7-8 8.6-8s8.4 3 8.4 7.3c0 3.1-1.8 4.9-4.3 6.6-2.1 1.4-3 2.4-3 4.6v1"
        fill="none"
        strokeWidth="4.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'var(--color-accento)' }}
      />
      <circle cx="90.2" cy="35.2" r="2.9" style={{ fill: 'var(--color-accento)' }} />

      {/* Le gambe e i piedi */}
      <path d="M39 110v22M51 110v22" fill="none" strokeWidth="10" strokeLinecap="round" style={{ stroke: 'var(--color-accento)' }} />
      <ellipse cx="36.5" cy="136" rx="8.5" ry="4.4" style={{ fill: SCURO }} />
      <ellipse cx="53.5" cy="136" rx="8.5" ry="4.4" style={{ fill: SCURO }} />

      {/* Il busto */}
      <path d="M33 82c0-6 5-9.5 12-9.5s12 3.500 12 9.500l1.500 29c-4 3.500-8 4.500-13.500 4.500S36 114.500 31.500 111Z" style={{ fill: 'var(--color-accento)' }} />

      {/* Il braccio che regge il gomito, di traverso sul busto */}
      <path d="M55 86c4 11 1 17-17 16" fill="none" strokeWidth="8" strokeLinecap="round" style={{ stroke: SCURO }} />
      <path d="M55 86c4 11 1 17-17 16" fill="none" strokeWidth="5.600" strokeLinecap="round" style={{ stroke: 'var(--color-accento)' }} />

      {/* Il braccio con la mano al mento */}
      <path d="M36 85c-5 8-5 14 0 17l9-26" fill="none" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: SCURO }} />
      <path d="M36 85c-5 8-5 14 0 17l9-26" fill="none" strokeWidth="5.600" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--color-accento)' }} />

      {/* La testa, con un riflesso */}
      <circle cx="44" cy="60" r="14" style={{ fill: 'var(--color-accento)' }} />
      <ellipse cx="39.500" cy="54" rx="5.500" ry="3.400" transform="rotate(-30 39.500 54)" style={{ fill: 'var(--color-su-accento)', opacity: 0.28 }} />
      <circle cx="46" cy="73" r="4.200" style={{ fill: 'var(--color-accento)', stroke: SCURO, strokeWidth: 1.400 }} />
    </svg>
  )
}
