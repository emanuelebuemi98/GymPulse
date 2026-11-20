// Il segnale di fine di un timer: tre colpi di vibrazione e tre bip. Lo usano il timer della tenuta e il timer di recupero tra una serie
// e l'altra. Funziona dove il telefono lo permette (la vibrazione non c'è su iPhone) e non rompe mai niente: ogni passo è in try/catch.
//
// Il suono ha bisogno di un tocco della persona per partire (le regole dei browser): per questo `preparaSegnale` si chiama dentro il tocco
// che avvia il timer («Avvia» della tenuta, il ✓ che conferma una serie e fa partire il recupero), e `segnala` lo riusa quando il timer
// finisce. Un timer partito senza tocco non suona, ma vibra.

type ContestoAudio = typeof AudioContext

let contesto: AudioContext | null = null

// Da chiamare dentro il gesto che avvia il timer (un tocco).
export function preparaSegnale(): void {
  try {
    const Costruttore: ContestoAudio | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: ContestoAudio }).webkitAudioContext
    if (!Costruttore) return
    contesto ??= new Costruttore()
    if (contesto.state === 'suspended') void contesto.resume()
  } catch {
    // niente suono: resta la vibrazione
  }
}

// Tre bip da un decimo di secondo, a 880 Hz, a volume basso e senza scatti (il volume sale e scende in pochi millisecondi).
function bip(audio: AudioContext): void {
  const inizio = audio.currentTime
  for (let i = 0; i < 3; i++) {
    const da = inizio + i * 0.22
    const oscillatore = audio.createOscillator()
    const volume = audio.createGain()
    oscillatore.type = 'sine'
    oscillatore.frequency.value = 880
    volume.gain.setValueAtTime(0, da)
    volume.gain.linearRampToValueAtTime(0.25, da + 0.01)
    volume.gain.linearRampToValueAtTime(0, da + 0.12)
    oscillatore.connect(volume).connect(audio.destination)
    oscillatore.start(da)
    oscillatore.stop(da + 0.14)
  }
}

export function segnala(): void {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 200])
  } catch {
    // la vibrazione non è disponibile ovunque
  }
  try {
    const audio = contesto
    if (!audio) return
    if (audio.state === 'running') {
      bip(audio)
    } else {
      // Il browser può avere messo in pausa l'audio (scheda in secondo piano, schermo spento): si prova a rimetterlo in moto e a suonare.
      void audio
        .resume()
        .then(() => {
          if (audio.state === 'running') bip(audio)
        })
        .catch(() => {})
    }
  } catch {
    // niente suono
  }
}
