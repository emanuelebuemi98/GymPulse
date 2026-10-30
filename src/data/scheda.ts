// Scheda predefinita, importata dal PDF "Scheda di Allenamento Palestra 3D".
// Serve solo a inizializzare il database (npm run db:seed): da lì in poi la scheda
// si modifica dall'app (Scheda → Personalizza) e vive nel database.
// Recupero in secondi, carico in kg.

export type Obiettivo =
  | { tipo: 'serie'; serie: number; ripMin: number; ripMax: number; recuperoSec: number }
  | { tipo: 'totale'; ripTotali: number }
  | { tipo: 'libero'; serieMin: number; serieMax: number }

export type Esercizio = {
  id: string
  nome: string
  muscoli: string
  obiettivo: Obiettivo
  nota?: string
  // Incremento proposto quando il range è completato su tutte le serie.
  incrementoKg?: number
}

export type Giorno = {
  id: string // sigla: A, B, C
  numero: number
  titolo: string
  focus: string
  esercizi: Esercizio[]
}

const serieReps = (serie: number, ripMin: number, ripMax: number, recuperoSec: number): Obiettivo => ({
  tipo: 'serie',
  serie,
  ripMin,
  ripMax,
  recuperoSec,
})

const totale = (ripTotali: number): Obiettivo => ({ tipo: 'totale', ripTotali })

const libero = (serieMin: number, serieMax: number): Obiettivo => ({
  tipo: 'libero',
  serieMin,
  serieMax,
})

const giornoA: Giorno = {
  id: 'A',
  numero: 1,
  titolo: 'Petto, dorso, braccia',
  focus: 'Petto, dorso e braccia',
  esercizi: [
    {
      id: 'panca-piana',
      nome: 'Panca piana',
      muscoli: 'Pettorale grande / tricipiti',
      obiettivo: serieReps(4, 6, 6, 120),
      nota: 'Carico a salire (+5 kg)',
      incrementoKg: 5,
    },
    {
      id: 'panca-inclinata-manubri',
      nome: 'Panca inclinata con manubri',
      muscoli: 'Pettorale clavicolare (alto)',
      obiettivo: serieReps(3, 6, 8, 120),
      nota: 'Panca a 30°, target 8 ripetizioni',
    },
    {
      id: 'croci-cavi-30',
      nome: 'Croci ai cavi 30°',
      muscoli: 'Pettorali (isolamento)',
      obiettivo: serieReps(4, 8, 10, 60),
      nota: 'Contrazione di picco di 1 s',
    },
    {
      id: 'lat-presa-inversa',
      nome: 'Lat presa inversa stretta',
      muscoli: 'Gran dorsale (basso) / bicipiti',
      obiettivo: serieReps(3, 6, 8, 90),
      nota: 'Impugnatura supina stretta',
    },
    {
      id: 'curl-ez',
      nome: 'Curl con bilanciere EZ angolato',
      muscoli: 'Bicipiti brachiali',
      obiettivo: serieReps(3, 8, 10, 90),
      nota: 'Senza compensi',
    },
    {
      id: 'curl-manubri',
      nome: 'Curl con manubri',
      muscoli: 'Bicipiti',
      obiettivo: serieReps(3, 8, 8, 90),
    },
    {
      id: 'dip-macchina',
      nome: 'Dip alla macchina',
      muscoli: 'Tricipiti / petto basso',
      obiettivo: serieReps(3, 8, 10, 60),
      nota: 'Busto leggermente inclinato',
    },
    {
      id: 'addome-giorno-1',
      nome: 'Addome a piacere',
      muscoli: 'Addominali',
      obiettivo: libero(3, 4),
      nota: 'Crunch a terra, plank o reverse crunch',
    },
  ],
}

const giornoB: Giorno = {
  id: 'B',
  numero: 2,
  titolo: 'Gambe, addome',
  focus: 'Gambe e polpacci',
  esercizi: [
    {
      id: 'calf-piedi',
      nome: 'Calf in piedi (macchina)',
      muscoli: 'Gastrocnemio / polpacci',
      obiettivo: serieReps(4, 12, 15, 60),
      nota: 'Pausa di 1 s in massima contrazione',
    },
    {
      id: 'squat-bilanciere',
      nome: 'Squat con bilanciere',
      muscoli: 'Quadricipiti / glutei',
      obiettivo: serieReps(4, 6, 6, 120),
      nota: 'Carico a salire (+5 kg)',
      incrementoKg: 5,
    },
    {
      id: 'pressa-45',
      nome: 'Pressa 45°',
      muscoli: 'Quadricipiti / femorali',
      obiettivo: serieReps(3, 10, 12, 120),
      nota: 'Escursione profonda senza staccare il bacino',
    },
    {
      id: 'leg-extension',
      nome: 'Leg extension',
      muscoli: 'Quadricipite (isolamento)',
      obiettivo: serieReps(3, 15, 20, 60),
      nota: 'Spremere in alto per 1 s',
    },
    {
      id: 'leg-curl-sdraiato',
      nome: 'Leg curl sdraiato',
      muscoli: 'Bicipite femorale / ischiocrurali',
      obiettivo: serieReps(4, 8, 10, 90),
      nota: 'Movimento fluido senza strappi',
    },
    {
      id: 'leg-curl-seduto',
      nome: 'Leg curl da seduto',
      muscoli: 'Femorali (allungamento)',
      obiettivo: serieReps(3, 10, 12, 90),
      nota: 'Bloccare bene il cuscinetto sulle cosce',
    },
    {
      id: 'addome-giorno-2',
      nome: 'Addome alla sbarra',
      muscoli: 'Addominali (leg / knee raise)',
      obiettivo: totale(50),
      nota: 'Somma delle ripetizioni su più serie',
    },
  ],
}

const giornoC: Giorno = {
  id: 'C',
  numero: 3,
  titolo: 'Stacco, dorso, spalle',
  focus: 'Stacco, dorso e spalle',
  esercizi: [
    {
      id: 'stacco-terra',
      nome: 'Stacco da terra',
      muscoli: 'Catena posteriore / dorsali',
      obiettivo: serieReps(3, 5, 5, 120),
      nota: 'Carico a salire (+10 kg)',
      incrementoKg: 10,
    },
    {
      id: 'lat-machine-avanti',
      nome: 'Lat machine avanti',
      muscoli: 'Gran dorsale (ampiezza)',
      obiettivo: serieReps(4, 6, 8, 120),
      nota: 'Presa prona larga, petto in fuori',
    },
    {
      id: 'pulley-basso',
      nome: 'Pulley basso',
      muscoli: 'Trapezi / romboidi / spessore',
      obiettivo: serieReps(3, 10, 12, 90),
      nota: 'Triangolo, petto aperto in chiusura',
    },
    {
      id: 'pullover-manubrio',
      nome: 'Pullover con manubrio',
      muscoli: 'Gran dorsale / dentato',
      obiettivo: serieReps(3, 8, 10, 90),
      nota: 'Panca trasversale o piana',
    },
    {
      id: 'rematore-petto-panca',
      nome: 'Rematore petto su panca',
      muscoli: 'Dorsali / deltoide posteriore',
      obiettivo: serieReps(3, 8, 10, 60),
      nota: 'Panca a 30°, manubri o bilanciere',
    },
    {
      id: 'lento-avanti-manubri',
      nome: 'Lento avanti con manubri',
      muscoli: 'Deltoide anteriore e laterale',
      obiettivo: serieReps(3, 6, 8, 120),
      nota: 'Seduto su panca a 80°-90°',
    },
    {
      id: 'alzate-laterali',
      nome: 'Alzate laterali',
      muscoli: 'Deltoide laterale',
      obiettivo: serieReps(3, 8, 10, 90),
      nota: 'Gomiti leggermente flessi',
    },
    {
      id: 'addome-giorno-3',
      nome: 'Addome alla macchina',
      muscoli: 'Addominali (ab crunch)',
      obiettivo: serieReps(4, 15, 20, 60),
    },
  ],
}

export const schedaPredefinita: Giorno[] = [giornoA, giornoB, giornoC]
