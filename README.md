# GymPulse

Diario di allenamento in palestra: scheda A/B/C, sessioni con serie da confermare, timer di recupero, storico e progressi. Si usa dal browser del telefono ed è installabile come app (PWA).

> **Stato:** funziona in locale con PostgreSQL in Docker. Non ci sono ancora il login, il collegamento a Supabase e la pubblicazione.

## Funzionalità

- **Home**: l'allenamento consigliato di oggi (A → B → C → A), il numero di sedute, l'ultima seduta e le tre giornate.
- **Scheda** (`/scheda?r=A`): scegli A, B o C, vedi gli esercizi con serie × ripetizioni e l'ultimo carico usato.
- **Personalizza** (`/scheda/modifica?r=A`): cambia titolo, ordine, numero di serie, ripetizioni, recupero e note; aggiungi esercizi dal catalogo o nuovi; togli quelli che non fai più. Le sedute già salvate non cambiano.
- **Sessione** (`/sessione?r=A`): per ogni serie scrivi kg e ripetizioni e la confermi con ✓.
  - I valori in grigio sono suggerimenti dall'ultima volta: contano solo dopo la conferma. Confermando una serie vuota vale il suggerimento.
  - Dopo ogni serie parte il **timer di recupero** della scheda.
  - **Data**, note, durata e peso corporeo sono modificabili; le calorie sono una stima (formula MET).
  - Puoi aggiungere esercizi extra, anche con un nome nuovo, e togliere serie o esercizi.
  - Una **bozza** nel browser conserva la sessione se la pagina si ricarica o l'app si chiude a metà allenamento (valida 12 ore).
- **Suggerimento del carico**: per gli esercizi con "carico a salire" (panca, squat, stacco) propone il carico successivo se hai completato tutte le ripetizioni.
- **Storico** (`/storico`) e dettaglio di ogni seduta, con possibilità di eliminarla.
- **Progressi** (`/progressi`): grafico del carico massimo per seduta di ogni esercizio, volume, record e tabella alternativa.
- **Backup**: esporta tutto in un file JSON e importalo su un altro dispositivo (l'importazione sostituisce i dati).

## Dati iniziali

Le tre sedute caricate dal seed vengono dai tuoi appunti dell'ultima settimana (`src/data/dati-iniziali.ts`). Due cose da sapere:

- **Le ripetizioni non sono state registrate**: negli appunti ci sono solo i kg. Per questo le sedute sono marcate "Dati iniziali" e "Rep da verificare", e il suggerimento del carico non decide da quei dati.
- **Le date sono un'ipotesi** (A = 26/10, B = 28/10, C = 23/10): non erano negli appunti. Se sono sbagliate, correggile nel file e ricarica i dati (vedi sotto).

## Stack tecnologico

| Area | Tecnologia | Versione |
|---|---|---|
| Framework | Next.js (App Router) | 16.4.3 |
| Interfaccia | React | 19.3.1 |
| Linguaggio | TypeScript | 7.0.2 |
| Stile | Tailwind CSS, font Bricolage Grotesque | 4.3.3 |
| Database | PostgreSQL | 17 (Docker in locale) |
| ORM | Prisma | 7.10.1 |
| Driver database | `pg` + `@prisma/adapter-pg` | 8.23.1 / 7.10.1 |
| Validazione | Zod | 4.6.7 |
| Grafici | SVG scritto a mano, senza librerie | — |
| Test | Vitest | 5.0.5 |

Le versioni sono quelle installate nel progetto e fissate in `package.json`.

## Requisiti

- **Node.js** 20.19 o superiore, oppure 22.12 o superiore, oppure 24 (requisito di Prisma 7).
- **npm** (incluso con Node).
- **Docker Desktop** avviato, per il database in locale.

## Installazione e avvio in locale

1. **Dipendenze**: `npm install` (esegue anche `prisma generate`).
2. **File `.env`** nella radice, copiando `.env.example`:

   ```env
   DATABASE_URL="postgresql://gympulse:gympulse@localhost:5432/gympulse"
   ```

   Il file `.env` non va mai committato: è escluso da Git. **Senza questo file l'app non si collega al database.**
3. **Database**: `docker compose up -d` (ascolta solo su `127.0.0.1:5432`).
4. **Tabelle**: `npm run db:migrate`.
5. **Scheda e dati iniziali**: `npm run db:seed`.
6. **Avvio**: `npm run dev`, poi apri http://localhost:3000. Se la porta è occupata Next sceglie la successiva (3001) e lo scrive nel terminale.

### Ricaricare i dati iniziali

Il seed non sovrascrive niente: la scheda viene creata solo se manca e le sedute iniziali solo se non c'è nessuna seduta. Per ripartire da zero, svuota prima le tabelle da Prisma Studio (`npm run db:studio`) o riesporta un backup se vuoi tenere qualcosa, poi riesegui `npm run db:seed`.

## Script disponibili

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Compila l'app per la produzione |
| `npm start` | Avvia la build di produzione |
| `npm run typecheck` | Controlla i tipi TypeScript |
| `npm test` | Esegue i test con Vitest |
| `npm run db:migrate` | Crea e applica le migrazioni di Prisma |
| `npm run db:seed` | Carica esercizi, scheda e sedute iniziali |
| `npm run db:studio` | Apre Prisma Studio per vedere e modificare i dati |

## Struttura delle cartelle

```
GymPulse/
├── prisma/
│   ├── migrations/               # migrazioni SQL generate da Prisma
│   ├── schema.prisma             # modello dei dati
│   └── seed.ts                   # esercizi, scheda e sedute iniziali
├── public/                       # icona e manifest della PWA
├── src/
│   ├── app/                      # pagine e route (Next.js App Router)
│   │   ├── actions.ts            # azioni sul server: salva sessione e scheda, elimina, importa backup
│   │   ├── api/backup/route.ts   # esportazione del backup JSON
│   │   ├── scheda/               # scheda A/B/C e, in modifica/, l'editor
│   │   ├── sessione/             # sessione di allenamento
│   │   ├── storico/              # elenco e dettaglio ([sessioneId])
│   │   ├── progressi/            # grafici, volume e record
│   │   ├── layout.tsx            # intestazione, menu e font
│   │   ├── globals.css           # colori del tema
│   │   └── page.tsx              # home
│   ├── components/               # FormSessione, EditorScheda, GraficoAndamento, TabGiorni, ...
│   ├── data/
│   │   ├── scheda.ts             # scheda predefinita (solo per il seed)
│   │   └── dati-iniziali.ts      # i carichi dei tuoi appunti
│   ├── generated/prisma/         # client Prisma generato (non in Git)
│   └── lib/                      # calcoli, validazioni, accesso ai dati e relativi test
├── docker-compose.yml            # PostgreSQL per lo sviluppo
├── next.config.ts, prisma.config.ts, postcss.config.mjs, tsconfig.json
└── .env.example                  # esempio di variabili d'ambiente
```

## Modello dei dati

Lo schema è in `prisma/schema.prisma`:

- **User**: l'atleta. Per ora c'è solo l'utente locale `atleta-locale`.
- **GiornoScheda**: le giornate A, B, C (titolo, focus).
- **Esercizio**: il catalogo. Quelli aggiunti da te hanno `personalizzato = true`.
- **VoceScheda**: un esercizio dentro una giornata, con ordine e obiettivo (serie × ripetizioni, ripetizioni totali o serie a scelta). È la parte che modifichi da Personalizza.
- **Sessione**: un allenamento in una data, con note, durata, peso corporeo, kcal e il flag `datiIniziali`.
- **SerieEseguita**: una serie registrata (esercizio, ordine, kg, ripetizioni). Il peso è facoltativo per gli esercizi a corpo libero.

La scheda vive nel database: modificarla non tocca le sedute passate, perché le serie puntano agli esercizi e non alle voci della scheda.

## Come sono fatti i calcoli

- **Giornata consigliata**: dopo A viene B, poi C, poi di nuovo A.
- **Carico suggerito**: se tutte le serie hanno raggiunto il massimo del range, peso massimo + incremento (+5 kg panca e squat, +10 kg stacco); altrimenti si resta. Con i dati iniziali non decide, perché le ripetizioni non sono vere.
- **Massimale (1RM)**: formula di Epley, `peso × (1 + ripetizioni / 30)`.
- **Volume**: somma di peso × ripetizioni; le serie senza peso non contano.
- **Calorie**: `MET × peso (kg) × durata (ore)`, con MET 5. È una stima, non una misura.

## Sicurezza

- Il browser non è fidato: ogni azione sul server ricontrolla i dati con Zod (date, pesi, ripetizioni, scheda, backup).
- Il file `.env` è escluso da Git; in Git va solo `.env.example`.
- L'importazione di un backup controlla formato, riferimenti e dimensione (massimo 900.000 caratteri) e sostituisce i dati solo se il file è valido.
- Fino al login tutti i dati appartengono all'utente locale. Non pubblicare l'app prima di aggiungere l'autenticazione.
- Con Supabase: disattivare l'API REST automatica o attivare la Row Level Security, e tenere la stringa di connessione solo in `.env` e nelle variabili di Vercel.

## Roadmap

1. ~~Scheda A/B/C, sessione, storico, progressi, personalizzazione e backup~~ (fatto)
2. Login con Better Auth
3. Peso corporeo e misure nel tempo
4. PWA completa con service worker e funzionamento offline
5. Collegamento a Supabase e pubblicazione (Vercel)

## Test

`npm test` esegue 137 test su calcoli, grafici, validazioni di sessione e scheda, backup, dati iniziali, date, bozza e conversioni tra scheda e database.
