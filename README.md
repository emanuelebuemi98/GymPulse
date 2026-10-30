# GymPulse

Web app per registrare gli allenamenti in palestra: scheda, serie, pesi, ripetizioni, durata e calorie stimate. Si usa dal browser del telefono ed è installabile come app (PWA).

> **Stato:** primo nucleo funzionante. Scheda importata, registrazione delle sessioni, storico, andamento per esercizio e suggerimento del carico. Login, Supabase e pubblicazione non sono ancora fatti.

## Funzionalità

- **Scheda di allenamento**: tre giorni (Petto/dorso/braccia, Gambe/addome, Stacco/dorso/spalle) con 19 esercizi e i tre tipi di addominali del PDF originale.
- **Registrazione**: per ogni esercizio si inseriscono peso e ripetizioni di ogni serie, con possibilità di aggiungere o rimuovere serie.
- **Dati della sessione**: durata in minuti e peso corporeo, da cui viene stimato il consumo calorico.
- **Precompilazione**: alla visita successiva dello stesso giorno, il form riprende i valori dell'ultimo allenamento.
- **Suggerimento del carico**: per gli esercizi con "carico a salire" il form mostra il carico da provare la volta successiva.
- **Giorno suggerito**: la home propone il giorno successivo nell'ordine 1 → 2 → 3 → 1.
- **Storico** (`/storico`): elenco degli allenamenti con serie, volume, durata e kcal stimate.
- **Dettaglio di un allenamento** (`/storico/[id]`): gli esercizi nell'ordine della scheda, con serie, peso e ripetizioni.
- **Andamento per esercizio** (`/esercizi/[id]`): grafico del carico massimo per allenamento, con massimale stimato e la stessa serie in forma di tabella.
- **Validazione**: i dati vengono ricontrollati sul server, perché il browser non è affidabile.

## Stack tecnologico

| Area | Tecnologia | Versione |
|---|---|---|
| Framework | Next.js (App Router) | 16.4.3 |
| Interfaccia | React | 19.3.1 |
| Linguaggio | TypeScript | 7.0.2 |
| Stile | Tailwind CSS | 4.3.3 |
| Database | PostgreSQL | 17 (Docker in locale) |
| ORM | Prisma | 7.10.1 |
| Driver database | `pg` + `@prisma/adapter-pg` | 8.23.1 / 7.10.1 |
| Validazione | Zod | 4.6.7 |
| Grafici | SVG scritto a mano, senza librerie | — |
| Test | Vitest | 5.0.5 |

Le versioni sono quelle installate nel progetto e fissate in `package.json` (`--save-exact`).

## Requisiti

- **Node.js** 20.19 o superiore, oppure 22.12 o superiore, oppure 24 (requisito di Prisma 7; lo sviluppo è stato fatto con Node 24).
- **npm** (incluso con Node).
- **Docker Desktop** avviato, per il database in locale.

## Installazione e avvio in locale

1. **Installa le dipendenze**

   ```bash
   npm install
   ```

   Al termine esegue `prisma generate` (script `postinstall`), che crea il client Prisma in `src/generated/prisma`.

2. **Crea il file `.env`** nella radice del progetto, copiando `.env.example`:

   ```env
   DATABASE_URL="postgresql://gympulse:gympulse@localhost:5432/gympulse"
   ```

   Il file `.env` non va mai committato: è già escluso da Git.

3. **Avvia PostgreSQL**

   ```bash
   docker compose up -d
   ```

   Il database ascolta solo su `127.0.0.1:5432`, quindi non è raggiungibile da altri dispositivi della rete.

4. **Crea le tabelle**

   ```bash
   npm run db:migrate
   ```

5. **Carica la scheda**

   ```bash
   npm run db:seed
   ```

   Il comando si può ripetere senza creare duplicati.

6. **Avvia l'app**

   ```bash
   npm run dev
   ```

   Apri http://localhost:3000. Se la porta è occupata, Next usa la 3001.

## Script disponibili

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Compila l'app per la produzione |
| `npm start` | Avvia la build di produzione |
| `npm run typecheck` | Controlla i tipi TypeScript senza compilare |
| `npm test` | Esegue i test con Vitest |
| `npm run db:migrate` | Crea e applica le migrazioni di Prisma |
| `npm run db:seed` | Carica giorni ed esercizi della scheda |
| `npm run db:studio` | Apre Prisma Studio per vedere e modificare i dati |

## Struttura delle cartelle

```
GymPulse/
├── prisma/
│   ├── migrations/               # migrazioni SQL generate da Prisma
│   ├── schema.prisma             # modello dei dati
│   └── seed.ts                   # carica giorni ed esercizi della scheda
├── public/
│   ├── icon.svg                  # icona dell'app
│   └── manifest.webmanifest      # manifest per l'installazione come PWA
├── src/
│   ├── app/                      # pagine e route (Next.js App Router)
│   │   ├── actions.ts            # server action: salva una sessione
│   │   ├── esercizi/[esercizioId]/
│   │   │   └── page.tsx          # andamento di un esercizio: grafico e tabella
│   │   ├── giorni/[giornoId]/
│   │   │   └── page.tsx          # registrazione di un giorno della scheda
│   │   ├── storico/
│   │   │   ├── [sessioneId]/
│   │   │   │   └── page.tsx      # dettaglio di un allenamento
│   │   │   └── page.tsx          # elenco degli allenamenti
│   │   ├── globals.css           # stili globali (Tailwind)
│   │   ├── layout.tsx            # struttura comune, intestazione e menu
│   │   └── page.tsx              # home: prossimo allenamento
│   ├── components/
│   │   ├── ExerciseCard.tsx      # scheda di un esercizio
│   │   ├── FormSessione.tsx      # form di registrazione dell'allenamento
│   │   └── GraficoAndamento.tsx  # grafico SVG di andamento, con mirino e tooltip
│   ├── data/
│   │   └── scheda.ts             # scheda importata dal PDF (giorni ed esercizi)
│   ├── generated/prisma/         # client Prisma generato (non in Git)
│   └── lib/
│       ├── allenamento.ts        # calcoli: giorno successivo, carico, 1RM, kcal
│       ├── db.ts                 # connessione al database
│       ├── formato.ts            # date e numeri in italiano
│       ├── grafico.ts            # assi, tick e posizioni per i grafici
│       ├── progressi.ts          # volume, massimale e suggerimento del carico
│       ├── sessione-schema.ts    # validazione dei dati inviati dal form
│       ├── sessioni.ts           # letture per il form (ultimo giorno, ultimi valori)
│       ├── storico.ts            # letture per storico, dettaglio e andamento
│       ├── utente.ts             # utente locale, fino al login
│       └── *.test.ts             # test di calcoli, grafici, progressi e validazione
├── AGENTS.md                     # regole per gli assistenti AI, generate da Next.js
├── docker-compose.yml            # PostgreSQL per lo sviluppo in locale
├── next.config.ts                # configurazione Next.js
├── postcss.config.mjs            # plugin PostCSS per Tailwind
├── prisma.config.ts              # configurazione Prisma (schema, migrazioni, seed)
├── tsconfig.json                 # configurazione TypeScript
├── .env.example                  # esempio di variabili d'ambiente
└── package.json                  # dipendenze e script
```

## Modello dei dati

Lo schema è in `prisma/schema.prisma`:

- **User**: l'atleta. Per ora c'è solo l'utente locale `atleta-locale`.
- **GiornoScheda**: i tre giorni della scheda (numero, titolo, focus).
- **Esercizio**: il catalogo degli esercizi (nome, gruppo muscolare).
- **Sessione**: un allenamento svolto in una data, con durata, peso corporeo e kcal stimate.
- **SerieEseguita**: una serie di una sessione (esercizio, ordine, peso, ripetizioni). Il peso è facoltativo per gli esercizi a corpo libero.

Gli id di giorni ed esercizi coincidono con quelli di `src/data/scheda.ts`, quindi la scheda nel codice e quella nel database restano allineate.

## Come sono fatti i calcoli

- **Giorno successivo**: si parte dal giorno 1 e si avanza in ciclo dopo ogni allenamento registrato.
- **Carico suggerito**: se tutte le serie hanno raggiunto il massimo del range di ripetizioni, si propone il peso massimo più l'incremento (+5 kg per panca e squat, +10 kg per lo stacco). Altrimenti si mantiene il carico.
- **Massimale stimato (1RM)**: formula di Epley, `peso × (1 + ripetizioni / 30)`. Si calcola sulla migliore serie dell'esercizio.
- **Volume**: somma di peso × ripetizioni di tutte le serie. Le serie senza peso non contano.
- **Calorie**: stima con la formula MET, `MET × peso (kg) × durata (ore)`, con MET 5 per il sollevamento pesi. È un valore indicativo, non una misura.

## Grafico di andamento

- Sull'asse X ci sono le date degli allenamenti, posizionate in proporzione al tempo.
- Sull'asse Y c'è il carico massimo di ogni allenamento. Per gli esercizi a corpo libero, le ripetizioni totali.
- Il mirino segue il puntatore e mostra il valore del punto più vicino. Con Tab si raggiunge ogni punto da tastiera.
- Le etichette dell'asse X vengono scelte in modo che non si tocchino.
- Sotto il grafico, "Vedi come tabella" mostra gli stessi valori in forma di tabella.

## Tipi di obiettivo nella scheda

- **Serie × ripetizioni** (es. `4 × 6` o `3 × 6-8`): il range indica il numero di ripetizioni da raggiungere.
- **Totale** (addome del giorno 2): 50 ripetizioni da accumulare su più serie.
- **Libero** (addome del giorno 1): 3-4 serie a scelta, senza target di ripetizioni.

## Database: in locale e online

- **In locale**: PostgreSQL 17 in Docker, per sviluppare anche senza internet senza toccare i dati reali.
- **Online**: il piano è usare Supabase (PostgreSQL gestito) per l'app pubblicata. Cambia solo la stringa `DATABASE_URL`.

Quando si passa a Supabase, bisogna disattivare l'API REST automatica sulle tabelle oppure attivare la Row Level Security su ciascuna tabella, perché l'accesso deve passare solo dal backend.

## Sicurezza e dati

- Il file `.env` (con le credenziali) è escluso da Git. In Git va solo `.env.example`.
- Le credenziali di Supabase vanno inserite solo nel `.env` locale e nelle variabili d'ambiente di Vercel, mai nel codice.
- Le sessioni non sono ancora protette da login: fino al login tutti i dati appartengono all'utente locale.

## Roadmap

1. ~~Struttura del progetto e scheda~~ (fatto)
2. ~~Database con Prisma e registrazione delle sessioni~~ (fatto)
3. ~~Storico delle sessioni e dettaglio di ciascuna~~ (fatto)
4. ~~Suggerimento del carico nel form~~ (fatto)
5. Grafici di andamento: fatto per il carico massimo per esercizio. Da fare: grafico del volume e del 1RM nel tempo
6. Login con Better Auth
7. Peso corporeo e misure nel tempo
8. PWA completa con service worker e funzionamento offline
9. Collegamento a Supabase e pubblicazione (Vercel)

## Test

```bash
npm test
```

I test coprono i calcoli (giorno successivo, carico, Epley, kcal), il volume e il massimale, il suggerimento del carico, i grafici (assi, posizioni ed etichette che non si toccano), la validazione dei dati del form e la coerenza della scheda con il PDF (3 giorni, 19 esercizi).
