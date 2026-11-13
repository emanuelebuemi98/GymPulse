import type { ReactNode } from 'react'
import { ImmagineEsercizio } from '../ImmagineEsercizio'
import { SimboloGymPulse } from '../Logo'

// La cornice di un telefono con dentro un pezzo d'app disegnato a mano: serve alla schermata di benvenuto per far vedere
// com'è fatta l'app prima di registrarsi. È decorazione (nascosta a chi usa lo screen reader): a spiegare c'è la didascalia.
// Usa gli stessi colori dell'app, quindi cambia da sola col tema chiaro e scuro.
export function Telefono({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="rounded-[2.2rem] bg-inchiostro p-2 shadow-lg">
      <div className="flex h-[352px] flex-col gap-2 overflow-hidden rounded-[1.7rem] bg-fondo p-3 text-[11px] leading-snug text-testo">
        {children}
      </div>
    </div>
  )
}

function Barra({ attiva }: { attiva: 'Home' | 'Scheda' | 'Storico' | 'Progressi' }) {
  return (
    <>
      <div className="flex items-center gap-1.5 text-[13px] font-extrabold">
        <SimboloGymPulse className="size-5" />
        GymPulse
      </div>
      <div className="-mx-3 flex border-b border-bordo px-3">
        {(['Home', 'Scheda', 'Storico', 'Progressi'] as const).map((voce) => (
          <span
            key={voce}
            className={`-mb-px flex-1 border-b-[3px] pt-1 pb-1.5 text-center text-[10px] font-bold ${
              voce === attiva ? 'border-accento text-testo' : 'border-transparent text-muto'
            }`}
          >
            {voce}
          </span>
        ))}
      </div>
    </>
  )
}

function Esercizio({ immagine, nome, dettaglio }: { immagine: string; nome: string; dettaglio: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-bordo bg-carta p-1.5 pr-2.5">
      <ImmagineEsercizio src={immagine} nome={nome} className="size-10 rounded-lg" />
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold">{nome}</span>
        <span className="block text-[9.5px] text-muto">{dettaglio}</span>
      </span>
    </div>
  )
}

export function SchermataScheda() {
  return (
    <Telefono>
      <Barra attiva="Scheda" />
      <p className="text-[13px] font-extrabold">A · Petto e tricipiti</p>
      <Esercizio immagine="/esercizi/27_barbell-bench-press.jpg" nome="Panca piana con bilanciere" dettaglio="4 × 12-10-8-6 · recupero 2 min" />
      <Esercizio immagine="/esercizi/6_incline-cable-fly.jpg" nome="Croci ai cavi su panca inclinata" dettaglio="3 × 10-12 · recupero 90 s" />
      <Esercizio immagine="/esercizi/35_push-up.jpg" nome="Piegamenti sulle braccia" dettaglio="3 × 12 · recupero 60 s" />
    </Telefono>
  )
}

function Serie({ numero, kg, rip, fatta }: { numero: number; kg: string; rip: string; fatta: boolean }) {
  const campo = `rounded-xl border border-bordo bg-fondo py-1.5 text-center text-[12px] ${fatta ? 'font-bold text-testo' : 'text-suggerito'}`
  return (
    <div className="grid grid-cols-[1rem_1fr_1fr_1.6rem] items-center gap-1.5">
      <span className="text-[10px] font-bold text-muto">{numero}</span>
      <span className={campo}>{kg}</span>
      <span className={campo}>{rip}</span>
      <span
        className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
          fatta ? 'bg-ok text-fondo' : 'bg-carta-alta text-muto'
        }`}
      >
        ✓
      </span>
    </div>
  )
}

export function SchermataSessione() {
  return (
    <Telefono>
      <div className="flex items-center gap-2">
        <ImmagineEsercizio src="/esercizi/45_lat-pulldown.jpg" nome="Lat Machine avanti" className="size-10 rounded-lg" />
        <span>
          <span className="block text-[13px] font-extrabold">Lat Machine avanti</span>
          <span className="block text-[9.5px] text-muto">Target 4 × 12-10-8-6 · ultima seduta 40 kg</span>
        </span>
      </div>
      <div className="mt-1 grid grid-cols-[1rem_1fr_1fr_1.6rem] gap-1.5 text-[9px] font-semibold text-muto">
        <span />
        <span className="text-center">kg</span>
        <span className="text-center">rip.</span>
        <span />
      </div>
      <Serie numero={1} kg="40" rip="12" fatta />
      <Serie numero={2} kg="42,5" rip="10" fatta />
      <Serie numero={3} kg="45" rip="8" fatta={false} />
      <Serie numero={4} kg="45" rip="6" fatta={false} />
      <p className="rounded-xl bg-ok/10 px-2 py-1 text-[10px] font-semibold text-ok">Prossimo carico consigliato: 45 kg</p>
      <div className="mt-auto flex items-center justify-between rounded-full bg-inchiostro py-1.5 pr-1.5 pl-4 text-su-inchiostro">
        <span>
          <span className="block text-[9px] font-semibold opacity-70">Recupero</span>
          <span className="block text-[18px] leading-none font-extrabold text-accento-chiaro tabular-nums">1:12</span>
        </span>
        <span className="rounded-full bg-su-inchiostro px-3 py-1.5 text-[10px] font-bold text-inchiostro">Salta</span>
      </div>
    </Telefono>
  )
}

export function SchermataComeSiFa() {
  return (
    <Telefono>
      <p className="text-[13px] font-extrabold">Piegamenti sulle braccia</p>
      <div className="flex gap-2">
        <ImmagineEsercizio src="/esercizi/35_push-up.jpg" nome="Piegamenti sulle braccia" className="size-20" />
        <p className="text-[9.5px] text-muto">
          Corpo Libero · muscoli: Pettorali (secondari: Tricipiti, Addome)
        </p>
      </div>
      <p className="text-[11px] font-extrabold">Come si esegue</p>
      <ol className="list-decimal space-y-1 pl-4 text-[10px]">
        <li>Tieni il corpo in linea retta, dai talloni alla testa.</li>
        <li>Abbassati piegando i gomiti finché il petto quasi tocca il pavimento, inspirando.</li>
        <li>Espira e spingi per tornare a braccia distese, contraendo il petto.</li>
      </ol>
      <p className="text-[11px] font-extrabold">Accortezze</p>
      <ul className="list-disc pl-4 text-[10px]">
        <li>Contrai glutei e addominali: la zona lombare non deve cedere.</li>
      </ul>
    </Telefono>
  )
}

const foto = (nome: string) => `/esercizi/${nome}.jpg`

function Miniatura({ nome, file, className = 'size-8' }: { nome: string; file: string; className?: string }) {
  return <ImmagineEsercizio src={foto(file)} nome={nome} className={`${className} rounded-lg`} />
}

// La home: la card scura di oggi con gli esercizi in miniatura, i numeri e l'elenco delle giornate.
export function SchermataHome() {
  return (
    <Telefono>
      <Barra attiva="Home" />
      <div className="relative overflow-hidden rounded-2xl bg-inchiostro p-3 text-su-inchiostro">
        <span className="absolute -top-2 right-1 text-[60px] leading-none font-extrabold text-accento-chiaro/20">A</span>
        <p className="text-[9.5px] opacity-70">Oggi tocca a</p>
        <p className="text-[16px] leading-tight font-extrabold">Petto e tricipiti</p>
        <p className="text-[9.5px] opacity-70">Allenamento A · 6 esercizi</p>
        <span className="relative mt-2 flex items-center gap-1">
          <Miniatura nome="Panca piana con bilanciere" file="27_barbell-bench-press" className="size-8 border-0" />
          <Miniatura nome="Panca inclinata con manubri" file="24_dumbbell-incline-bench-press" className="size-8 border-0" />
          <Miniatura nome="Croci ai cavi su panca inclinata" file="6_incline-cable-fly" className="size-8 border-0" />
          <Miniatura nome="Piegamenti sulle braccia" file="35_push-up" className="size-8 border-0" />
          <span className="pl-0.5 text-[10px] font-bold opacity-80">+2</span>
        </span>
        <span className="relative mt-2 inline-block rounded-full bg-accento-chiaro px-3 py-1 text-[10px] font-extrabold text-inchiostro">▶ Inizia</span>
      </div>
      <div className="flex gap-1.5">
        <div className="w-16 rounded-xl border border-bordo bg-carta p-1.5">
          <p className="text-[20px] leading-none font-extrabold text-accento">42</p>
          <p className="text-[8.5px] font-semibold text-muto">sedute registrate</p>
        </div>
        <div className="min-w-0 flex-1 rounded-xl border border-bordo bg-carta p-1.5">
          <p className="text-[8.5px] font-semibold text-muto">Ultima seduta</p>
          <p className="text-[10px] font-extrabold">Venerdì 6 Novembre 2026</p>
          <p className="text-[8.5px] text-muto">C · Dorso e spalle</p>
        </div>
      </div>
      <p className="text-[11px] font-extrabold">Le tue giornate</p>
      {[
        ['A', 'Petto e tricipiti', '6 esercizi · consigliata', true],
        ['B', 'Gambe e glutei', '7 esercizi', false],
      ].map(([sigla, titolo, dettaglio, attiva]) => (
        <div key={String(sigla)} className="flex items-center gap-2 overflow-hidden rounded-xl border border-bordo bg-carta py-1 pr-2">
          <span className={`h-6 w-1 shrink-0 rounded-r-full ${attiva ? 'bg-accento' : 'bg-bordo'}`} />
          <span className="w-3 text-center text-[13px] font-extrabold">{String(sigla)}</span>
          <span className="min-w-0">
            <span className="block text-[10.5px] font-bold">{String(titolo)}</span>
            <span className="block text-[8.5px] text-muto">{String(dettaglio)}</span>
          </span>
        </div>
      ))}
    </Telefono>
  )
}

// Le giornate: da una a sette, con le linguette A B C D e il "+" per aggiungerne una.
export function SchermataGiornate() {
  return (
    <Telefono>
      <Barra attiva="Scheda" />
      <div className="grid grid-cols-5 gap-0.5 rounded-2xl bg-carta-alta p-0.5 text-center">
        {['A', 'B', 'C', 'D'].map((sigla) => (
          <span key={sigla} className={`rounded-xl py-1 text-[13px] font-extrabold ${sigla === 'B' ? 'bg-carta text-testo shadow-sm' : 'text-muto'}`}>
            {sigla}
          </span>
        ))}
        <span className="rounded-xl py-1 text-[13px] font-extrabold text-muto">+</span>
      </div>
      <div className="flex items-end justify-between">
        <span>
          <span className="block text-[9px] font-semibold text-muto">Allenamento B</span>
          <span className="block text-[15px] leading-tight font-extrabold">Gambe e glutei</span>
        </span>
        <span className="rounded-full border border-bordo bg-carta px-2 py-1 text-[9px] font-semibold">Modifica</span>
      </div>
      <span className="rounded-full bg-accento py-1.5 text-center text-[11px] font-extrabold text-su-accento">▶ Avvia sessione B</span>
      <Esercizio immagine={foto('172_barbell-back-squat')} nome="Squat con bilanciere" dettaglio="4 × 6-8 · recupero 2 min" />
      <Esercizio immagine={foto('163_leg-press')} nome="Pressa 45°" dettaglio="3 × 10-12 · recupero 90 s" />
      <Esercizio immagine={foto('154_barbell-hip-thrust')} nome="Hip Thrust con bilanciere" dettaglio="4 × 10 · recupero 90 s" />
    </Telefono>
  )
}

// Il catalogo: tutti gli esercizi per categoria, con la foto, la ricerca e le linguette.
export function SchermataCatalogo() {
  const voci = [
    ['Hip Thrust con bilanciere', 'Barbell Hip Thrust', '154_barbell-hip-thrust'],
    ['Hip Thrust alla macchina', 'Machine Hip Thrust', '153_machine-hip-thrust'],
    ['Slanci ad ascia al cavo basso', 'Cable Diagonal Glute Kickback', '241_cable-diagonal-glute-kickback'],
    ['Abduttori alla macchina', 'Abductor Machine', '137_abductor-machine'],
  ]
  return (
    <Telefono>
      <Barra attiva="Scheda" />
      <p className="text-[13px] font-extrabold">Catalogo esercizi</p>
      <div className="rounded-xl border border-bordo bg-fondo px-2 py-1.5 text-[10.5px] text-suggerito">Cerca un esercizio</div>
      <div className="flex gap-1 overflow-hidden text-[9px] font-semibold">
        {['Tutte 246', 'Petto 39', 'Dorsali 32', 'Glutei 17'].map((voce) => (
          <span
            key={voce}
            className={`shrink-0 rounded-full border px-2 py-1 ${voce.startsWith('Glutei') ? 'border-accento bg-accento text-su-accento' : 'border-bordo bg-carta'}`}
          >
            {voce}
          </span>
        ))}
      </div>
      <div className="divide-y divide-bordo overflow-hidden rounded-xl border border-bordo">
        {voci.map(([nome, inglese, file]) => (
          <div key={nome} className="flex items-center gap-2 px-1.5 py-1">
            <Miniatura nome={nome} file={file} className="size-9 border-0" />
            <span className="min-w-0">
              <span className="block truncate text-[10.5px] leading-tight font-bold">{nome}</span>
              <span className="block truncate text-[8.5px] text-muto">{inglese}</span>
            </span>
          </div>
        ))}
      </div>
    </Telefono>
  )
}

// Lo storico: una card per seduta, con la data, i numeri e le miniature degli esercizi.
export function SchermataStorico() {
  const sedute = [
    { giorno: '6', mese: 'nov', titolo: 'C · Dorso e spalle', dettaglio: '8 esercizi · 26 serie · 9.329 kg', foto: ['45_lat-pulldown', '58_incline-dumbbell-row', '85_dumbbell-lateral-raise'] },
    { giorno: '4', mese: 'nov', titolo: 'B · Gambe e glutei', dettaglio: '7 esercizi · 24 serie · 19.550 kg', foto: ['172_barbell-back-squat', '163_leg-press', '154_barbell-hip-thrust'] },
    { giorno: '2', mese: 'nov', titolo: 'A · Petto e tricipiti', dettaglio: '7 esercizi · 23 serie · 5.220 kg', foto: ['27_barbell-bench-press', '24_dumbbell-incline-bench-press', '35_push-up'] },
  ]
  return (
    <Telefono>
      <Barra attiva="Storico" />
      <div className="flex items-end justify-between">
        <p className="text-[15px] font-extrabold">Storico</p>
        <p className="text-[9px] font-semibold text-muto">42 sedute</p>
      </div>
      {sedute.map((seduta) => (
        <div key={seduta.giorno} className="flex gap-2 rounded-2xl border border-bordo bg-carta p-1.5">
          <span className="grid w-10 shrink-0 place-content-center rounded-xl bg-carta-alta text-center">
            <span className="text-[15px] leading-none font-extrabold">{seduta.giorno}</span>
            <span className="text-[8px] font-bold text-muto uppercase">{seduta.mese}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10.5px] font-extrabold">{seduta.titolo}</span>
            <span className="block text-[8.5px] text-muto">{seduta.dettaglio}</span>
            <span className="mt-0.5 flex gap-1">
              {seduta.foto.map((file) => (
                <Miniatura key={file} nome={file} file={file} className="size-6" />
              ))}
            </span>
          </span>
        </div>
      ))}
    </Telefono>
  )
}

// Il dettaglio di una seduta: ogni esercizio con le sue serie, e il link all'andamento.
export function SchermataSeduta() {
  const serie = [
    ['1', '52,5', '8'],
    ['2', '52,5', '8'],
    ['3', '55', '6'],
    ['4', '55', '6'],
  ]
  return (
    <Telefono>
      <p className="text-[9.5px] font-semibold text-accento">← Storico</p>
      <p className="text-[14px] leading-tight font-extrabold">Lunedì 2 Novembre 2026</p>
      <p className="text-[9.5px] text-muto">Allenamento A · Petto e tricipiti · 58 min</p>
      <div className="rounded-2xl border border-bordo bg-carta p-2">
        <div className="flex items-center gap-2">
          <Miniatura nome="Panca piana con bilanciere" file="27_barbell-bench-press" className="size-10" />
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] leading-tight font-extrabold">Panca piana con bilanciere</span>
            <span className="block text-[8.5px] text-muto">Barbell Bench Press · Petto</span>
          </span>
          <span className="text-[9px] font-semibold text-accento">Andamento</span>
        </div>
        <div className="mt-1.5 grid grid-cols-3 text-[8.5px] font-semibold text-muto">
          <span>Serie</span>
          <span>Kg</span>
          <span>Rip.</span>
        </div>
        {serie.map(([numero, kg, rip]) => (
          <div key={numero} className="grid grid-cols-3 border-t border-bordo py-1 text-[10.5px] tabular-nums">
            <span className="text-muto">{numero}</span>
            <span className="font-semibold">{kg}</span>
            <span>{rip}</span>
          </div>
        ))}
      </div>
    </Telefono>
  )
}

// Il grafico di un esercizio: il carico massimo seduta per seduta, con l'ultimo valore in evidenza.
export function SchermataAndamento() {
  const carichi = [40, 40, 42.5, 45, 45, 47.5, 50]
  const minimo = 37.5
  const massimo = 52.5
  const punti = carichi.map((kg, i) => [10 + (i * 180) / (carichi.length - 1), 62 - ((kg - minimo) / (massimo - minimo)) * 54] as const)
  return (
    <Telefono>
      <Barra attiva="Progressi" />
      <div className="grid grid-cols-2 gap-0.5 rounded-full bg-carta-alta p-0.5 text-center text-[9.5px] font-bold">
        <span className="rounded-full py-1 text-muto">Panoramica</span>
        <span className="rounded-full bg-carta py-1 shadow-sm">Per esercizio</span>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-bordo bg-fondo px-2 py-1.5 text-[10.5px] font-semibold">
        <span>Lat Machine avanti</span>
        <span className="text-muto">⌄</span>
      </div>
      <div className="rounded-2xl border border-bordo bg-carta p-2">
        <p className="text-[11px] font-extrabold">Carico massimo</p>
        <p className="text-[8.5px] text-muto">Kg più alto tra le serie, seduta per seduta.</p>
        <svg viewBox="0 0 200 74" className="mt-1 w-full" role="presentation">
          {[8, 28, 48, 62].map((y) => (
            <line key={y} x1="10" x2="190" y1={y} y2={y} className="stroke-bordo" strokeWidth="0.6" />
          ))}
          <polyline points={punti.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" className="stroke-grafico" />
          {punti.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === punti.length - 1 ? 3 : 2} className="fill-grafico stroke-carta" strokeWidth="1" />
          ))}
          <text x={punti[punti.length - 1][0] - 6} y={punti[punti.length - 1][1] - 6} textAnchor="end" fontSize="9" fontWeight="700" className="fill-testo">
            50 kg
          </text>
        </svg>
      </div>
      <p className="text-[9px] text-muto">Sotto trovi anche il peso totale e le ripetizioni di ogni seduta.</p>
    </Telefono>
  )
}

// I record: il peso più alto per ogni esercizio, con la data.
export function SchermataRecord() {
  const record = [
    ['Panca piana con bilanciere', '60', '02/11'],
    ['Squat con bilanciere', '90', '04/11'],
    ['Stacco da terra', '110', '04/11'],
    ['Lat Machine avanti', '50', '06/11'],
    ['Alzate laterali con manubri', '8', '06/11'],
  ]
  return (
    <Telefono>
      <Barra attiva="Progressi" />
      <div className="rounded-2xl border border-bordo bg-carta p-2">
        <p className="text-[11px] font-extrabold">Record recenti</p>
        {record.map(([nome, kg, data]) => (
          <div key={nome} className="flex items-baseline justify-between gap-1 border-t border-bordo py-1.5 first:mt-1">
            <span className="min-w-0 text-[10px] leading-tight font-semibold">{nome}</span>
            <span className="shrink-0 tabular-nums">
              <span className="text-[10.5px] font-extrabold text-accento">{kg} kg</span> <span className="text-[8.5px] text-muto">{data}</span>
            </span>
          </div>
        ))}
        <p className="mt-1 text-[9px] font-semibold text-muto">▸ Tutti i record (21)</p>
      </div>
    </Telefono>
  )
}

// Le super serie: esercizi uno dopo l'altro senza pausa. Con 2 esercizi è un superset, con 3 un triset, con 4 o più un gigantset;
// il recupero parte dopo l'ultimo esercizio, a fine giro. La barra a sinistra tiene insieme gli esercizi del gruppo.
export function SchermataSuperSerie() {
  return (
    <Telefono>
      <Barra attiva="Scheda" />
      <p className="text-[13px] font-extrabold">C · Spalle e braccia</p>
      <div className="space-y-0.5">
        <span className="inline-block rounded-full bg-accento/15 px-2 py-0.5 text-[9px] font-extrabold text-accento">Superset · senza pausa</span>
        <div className="flex items-center gap-2 rounded-t-2xl border border-b-0 border-l-4 border-bordo border-l-accento bg-carta p-1.5 pr-2.5">
          <span className="w-4 shrink-0 text-[9px] font-bold text-muto">1/2</span>
          <Miniatura nome="Alzate laterali con manubri" file="85_dumbbell-lateral-raise" className="size-9" />
          <span className="min-w-0">
            <span className="block truncate text-[10.5px] font-bold">Alzate laterali con manubri</span>
            <span className="block text-[9px] text-muto">3 × 12</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-b-2xl border border-l-4 border-bordo border-l-accento bg-carta p-1.5 pr-2.5">
          <span className="w-4 shrink-0 text-[9px] font-bold text-muto">2/2</span>
          <Miniatura nome="Piegamenti sulle braccia" file="35_push-up" className="size-9" />
          <span className="min-w-0">
            <span className="block truncate text-[10.5px] font-bold">Piegamenti sulle braccia</span>
            <span className="block text-[9px] text-muto">3 × 15</span>
            <span className="block text-[9px] font-semibold text-accento">Poi recupero 90 s</span>
          </span>
        </div>
      </div>
      <div className="space-y-0.5">
        <span className="inline-block rounded-full bg-accento/15 px-2 py-0.5 text-[9px] font-extrabold text-accento">Triset · senza pausa</span>
        <div className="flex items-center gap-2 rounded-t-2xl border border-b-0 border-l-4 border-bordo border-l-accento bg-carta p-1 pr-2.5">
          <span className="w-4 shrink-0 text-[9px] font-bold text-muto">1/3</span>
          <span className="truncate text-[10px] font-bold">Curl con bilanciere · 3 × 10</span>
        </div>
        <div className="flex items-center gap-2 border border-b-0 border-l-4 border-bordo border-l-accento bg-carta p-1 pr-2.5">
          <span className="w-4 shrink-0 text-[9px] font-bold text-muto">2/3</span>
          <span className="truncate text-[10px] font-bold">Curl a martello · 3 × 10</span>
        </div>
        <div className="flex items-center gap-2 rounded-b-2xl border border-l-4 border-bordo border-l-accento bg-carta p-1 pr-2.5">
          <span className="w-4 shrink-0 text-[9px] font-bold text-muto">3/3</span>
          <span className="truncate text-[10px] font-bold">Curl ai cavi · 3 × 12</span>
        </div>
      </div>
    </Telefono>
  )
}

// La scheda da un file CSV: si scarica il catalogo, si tengono le righe che servono, si scrive la lettera della giornata e si
// importa. Prima di scrivere l'app fa vedere cosa cambia.
export function SchermataCsv() {
  return (
    <Telefono>
      <Barra attiva="Scheda" />
      <div className="space-y-1.5 rounded-2xl border border-bordo bg-carta p-2.5">
        <p className="text-[12px] font-extrabold">Crea la scheda da un file CSV</p>
        <ol className="list-decimal space-y-0.5 pl-3.5 text-[9px] text-muto">
          <li>Scarica il catalogo completo.</li>
          <li>In Excel cancella gli esercizi che non ti servono.</li>
          <li>Al posto di &lt;A/B/C/D/E/F/G&gt; scrivi la lettera della giornata.</li>
          <li>Importa il file: vedi cosa cambia e confermi.</li>
        </ol>
        <div className="grid grid-cols-2 gap-1.5 text-center text-[9.5px] font-semibold">
          <span className="rounded-full border border-bordo bg-carta py-1">↓ Catalogo</span>
          <span className="rounded-full border border-bordo bg-carta py-1">↓ La mia scheda</span>
        </div>
        <span className="block rounded-full border border-bordo bg-carta py-1 text-center text-[9.5px] font-semibold">↑ Importa un file</span>
      </div>
      <div className="space-y-0.5 rounded-xl bg-carta-alta p-2 text-[9.5px]">
        <p className="font-semibold">Con questo file succede così:</p>
        <p><span className="font-extrabold">A</span> · Petto e tricipiti: giornata nuova con 6 esercizi</p>
        <p><span className="font-extrabold">B</span> · Gambe e glutei: giornata nuova con 7 esercizi</p>
        <span className="mt-1 inline-block rounded-full bg-accento px-2.5 py-0.5 text-[9.5px] font-extrabold text-su-accento">Conferma</span>
      </div>
    </Telefono>
  )
}

function BarraOrizzontale({ nome, kg, quota }: { nome: string; kg: string; quota: number }) {
  return (
    <div>
      <span className="flex justify-between text-[10px] font-bold">
        <span>{nome}</span>
        <span className="tabular-nums">{kg} kg</span>
      </span>
      <span className="mt-0.5 block h-2 rounded-r bg-grafico" style={{ width: `${quota}%` }} />
    </div>
  )
}

export function SchermataProgressi() {
  return (
    <Telefono>
      <Barra attiva="Progressi" />
      <div className="space-y-1.5 rounded-2xl border border-bordo bg-carta p-2.5">
        <p className="text-[11px] font-extrabold">Kg per categoria</p>
        <BarraOrizzontale nome="Petto" kg="4.280" quota={100} />
        <BarraOrizzontale nome="Dorsali" kg="3.940" quota={92} />
        <BarraOrizzontale nome="Gambe" kg="3.100" quota={72} />
        <BarraOrizzontale nome="Spalle" kg="1.250" quota={29} />
      </div>
      <div className="rounded-2xl border border-bordo bg-carta p-2.5">
        <p className="text-[11px] font-extrabold">Carico massimo</p>
        <div className="mt-1.5 flex h-14 items-end gap-1 border-b border-bordo">
          {[5, 6, 6, 7, 8, 8, 9].map((altezza, i) => (
            <span key={i} className="flex-1 rounded-t bg-grafico" style={{ height: `${altezza * 10}%` }} />
          ))}
        </div>
      </div>
    </Telefono>
  )
}
