import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EditorScheda } from '@/components/EditorScheda'
import { leggiCatalogo, leggiGiorno } from '@/lib/scheda-db'
import { primoParametro } from '@/lib/url'

// Legge il database a ogni richiesta: l'editor parte dalla scheda salvata.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Personalizza scheda' }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ModificaSchedaPage({ searchParams }: Props) {
  const id = primoParametro((await searchParams).r)
  const [giorno, catalogo] = await Promise.all([id ? leggiGiorno(id) : null, leggiCatalogo()])
  if (!giorno) notFound()

  // `key` riporta l'editor allo stato salvato quando si cambia giornata.
  return <EditorScheda key={giorno.id} giorno={giorno} catalogo={catalogo} />
}
