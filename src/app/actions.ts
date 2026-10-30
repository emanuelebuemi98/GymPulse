'use server'

import { redirect } from 'next/navigation'
import { stimaKcal } from '@/lib/allenamento'
import { db } from '@/lib/db'
import { validaSessione } from '@/lib/sessione-schema'
import { UTENTE_LOCALE_ID } from '@/lib/utente'

// Salva una sessione completa. Il server ricontrolla tutto, perché il browser non è fidato.
export async function salvaSessione(input: unknown): Promise<{ errore: string }> {
  const esito = validaSessione(input)
  if (!esito.ok) return { errore: esito.errore }

  const { giornoId, durataMinuti, pesoCorporeoKg, esercizi } = esito.dati
  const kcalStimate =
    pesoCorporeoKg !== null && durataMinuti !== null ? stimaKcal(pesoCorporeoKg, durataMinuti) : null

  await db.sessione.create({
    data: {
      userId: UTENTE_LOCALE_ID,
      giornoId,
      durataMinuti,
      pesoCorporeoKg,
      kcalStimate,
      serie: {
        create: esercizi.flatMap((esercizio) =>
          esercizio.serie.map((serie, indice) => ({
            esercizioId: esercizio.esercizioId,
            ordine: indice + 1,
            pesoKg: serie.pesoKg,
            ripetizioni: serie.ripetizioni,
          })),
        ),
      },
    },
  })

  redirect('/')
}
