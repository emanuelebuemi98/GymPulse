import { formatDataLunga } from '@/lib/formato'
import type { Giorno } from '@/lib/scheda-tipi'

// «Modificata da NOME, il giorno»: compare solo se la giornata è stata cambiata da qualcun altro (un personal trainer della tua
// palestra). Se l'hai cambiata tu non serve dirlo. Così chi ha scelto la palestra sa sempre cosa è cambiato nella sua scheda e da chi.
export function ModificataDa({ modificata }: { modificata: Giorno['modificata'] }) {
  if (!modificata || !modificata.daAltri) return null
  return (
    <p className="rounded-2xl bg-carta-alta px-3 py-2 text-sm text-muto">
      Modificata da <span className="font-semibold text-testo">{modificata.da ?? 'un personal trainer'}</span>,{' '}
      {formatDataLunga(new Date(modificata.il))}
    </p>
  )
}
