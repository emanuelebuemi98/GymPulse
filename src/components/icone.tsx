import type { ReactNode } from 'react'

type Props = { className?: string }

function Icona({ children, className = 'size-5' }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const IconaHome = (p: Props) => (
  <Icona {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
  </Icona>
)

export const IconaScheda = (p: Props) => (
  <Icona {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4h6v3H9z" />
    <path d="M9 12h6M9 16h6" />
  </Icona>
)

export const IconaStorico = (p: Props) => (
  <Icona {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </Icona>
)

export const IconaProgressi = (p: Props) => (
  <Icona {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Icona>
)

export const IconaPlay = (p: Props) => (
  <Icona {...p}>
    <path d="M7 5v14l12-7z" />
  </Icona>
)

export const IconaSpunta = (p: Props) => (
  <Icona {...p}>
    <path d="M5 12.5 10 17.5 19 7" />
  </Icona>
)

export const IconaCestino = (p: Props) => (
  <Icona {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icona>
)

export const IconaPiu = (p: Props) => (
  <Icona {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icona>
)

export const IconaMeno = (p: Props) => (
  <Icona {...p}>
    <path d="M5 12h14" />
  </Icona>
)

export const IconaSu = (p: Props) => (
  <Icona {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icona>
)

export const IconaGiu = (p: Props) => (
  <Icona {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icona>
)

export const IconaRegolazioni = (p: Props) => (
  <Icona {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icona>
)

export const IconaScarica = (p: Props) => (
  <Icona {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icona>
)

export const IconaCarica = (p: Props) => (
  <Icona {...p}>
    <path d="M12 16V5M7 10l5-5 5 5M5 20h14" />
  </Icona>
)

export const IconaChiudi = (p: Props) => (
  <Icona {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icona>
)

export const IconaSinistra = (p: Props) => (
  <Icona {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icona>
)

export const IconaDestra = (p: Props) => (
  <Icona {...p}>
    <path d="M9 5l7 7-7 7" />
  </Icona>
)

export const IconaLente = (p: Props) => (
  <Icona {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
  </Icona>
)

export const IconaSole = (p: Props) => (
  <Icona {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icona>
)

export const IconaLuna = (p: Props) => (
  <Icona {...p}>
    <path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2z" />
  </Icona>
)

export const IconaScudo = (p: Props) => (
  <Icona {...p}>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
    <path d="M12 9v4M12 16h.01" />
  </Icona>
)
