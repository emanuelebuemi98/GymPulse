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
      <Esercizio immagine="/esercizi/27_barbell-bench-press.jpg" nome="Panca piana con bilanciere" dettaglio="4 × 6-8 · recupero 2 min" />
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
          <span className="block text-[9.5px] text-muto">Target 4 × 8-10 · ultima seduta 40 kg</span>
        </span>
      </div>
      <div className="mt-1 grid grid-cols-[1rem_1fr_1fr_1.6rem] gap-1.5 text-[9px] font-semibold text-muto">
        <span />
        <span className="text-center">kg</span>
        <span className="text-center">rip.</span>
        <span />
      </div>
      <Serie numero={1} kg="40" rip="10" fatta />
      <Serie numero={2} kg="40" rip="9" fatta />
      <Serie numero={3} kg="42,5" rip="10" fatta={false} />
      <p className="rounded-xl bg-ok/10 px-2 py-1 text-[10px] font-semibold text-ok">Prossimo carico consigliato: 42,5 kg</p>
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
