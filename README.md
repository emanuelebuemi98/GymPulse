# GymPulse

**Il diario di allenamento in palestra.** Ognuno ha il proprio account e la propria scheda A/B/C. In palestra registri ogni serie con kg e ripetizioni, l'app ti suggerisce i valori dell'ultima volta e fa partire il timer di recupero. A casa guardi lo storico e i progressi.

Si usa dal browser del telefono e funziona anche in locale sul PC.

> **Stato:** funziona in locale con PostgreSQL in Docker. Il collegamento a Supabase e la pubblicazione su Vercel non sono ancora fatti.

---

## Cosa può fare l'app

### Già disponibile

| Cosa | Come funziona |
|---|---|
| **Account personali** | Ti registri dall'app con nome e cognome, nome utente e password. Ogni persona vede solo i propri dati. |
| **La tua scheda A/B/C** | Parti con tre giornate vuote e le riempi dall'app: scegli gli esercizi, serie, ripetizioni (anche a range, es. 6-8), recupero, note e il "carico a salire". Puoi cambiare l'ordine, aggiungere e togliere esercizi quando vuoi. |
| **Sessione di allenamento** | Per ogni serie scrivi kg e ripetizioni e la confermi con ✓. Puoi aggiungere o togliere serie, aggiungere esercizi extra e cambiare la data. |
| **Valori dell'ultima volta** | Nei campi vedi in grigio i kg e le ripetizioni dell'ultima seduta. Contano solo dopo la conferma: se confermi una serie vuota vale il suggerimento. |
| **Timer di recupero** | Dopo ogni serie parte il conto alla rovescia del recupero previsto dalla scheda (con vibrazione sui telefoni che la supportano). |
| **Suggerimento del carico** | Per gli esercizi con "carico a salire" (es. panca, squat, stacco) l'app propone il peso successivo quando hai completato tutte le ripetizioni previste. |
| **Giornata consigliata** | La home ti dice cosa tocca oggi, nell'ordine A → B → C → A. |
| **Bozza che non si perde** | Se chiudi la pagina o il telefono si spegne a metà allenamento, le serie già confermate restano nel browser per 12 ore. |
| **Storico** | Elenco delle sedute con volume, durata e calorie; dettaglio di ogni seduta; puoi eliminarne una. |
| **Progressi** | Per ogni esercizio: grafico del carico massimo seduta per seduta (con tooltip e tabella alternativa), volume indicativo e record. |
| **Volume e massimale stimato** | Volume = kg × ripetizioni. Il massimale (1RM) è stimato con la formula di Epley, `peso × (1 + ripetizioni / 30)`, ed è mostrato come nota nella pagina Progressi. |
| **Calorie stimate** | `MET × peso (kg) × durata (ore)`, con MET 5 per il sollevamento pesi. È una stima indicativa, non una misura. |
| **Backup** | Esporti tutti i tuoi dati in un file JSON e li reimporti (anche su un altro dispositivo). L'importazione sostituisce solo i *tuoi* dati. |

### In programma

| Cosa | Situazione |
|---|---|
| **Grafici migliori e panoramica dei progressi** | Oggi i grafici sono disegnati a mano in SVG. Si passa a una libreria (proposta: Recharts) e si aggiunge una panoramica generale dei progressi, non solo per esercizio. |
| **Export CSV** | Al posto del backup JSON: le sedute si esportano e si reimportano in CSV. Da definire cosa fare della scheda, che in un CSV non ci sta. |
| **Recupero della password** | Non c'è una procedura dall'app. Per ora si reimposta da terminale con `npm run db:utente`. |
| **Smartwatch** | Da studiare: dipende dal marchio dell'orologio. |
| **Pubblicazione online** | Ultimo passo: Supabase per il database e Vercel per l'app. |

---

## Stack tecnologico

| Area | Tecnologia | Versione | Note |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.4.3 | Pagine e backend nello stesso progetto; le modifiche ai dati passano da *server action* |
| Interfaccia | React | 19.3.1 | |
| Linguaggio | TypeScript | 7.0.2 | |
| Stile | Tailwind CSS | 4.3.3 | Font Bricolage Grotesque, tema chiaro |
| Database | PostgreSQL | 17 | Docker in locale; Supabase (cloud) previsto per la pubblicazione |
| ORM | Prisma | 7.10.1 | Con driver `pg` 8.23.1 e `@prisma/adapter-pg` 7.10.1 |
| Validazione | Zod | 4.6.7 | I dati arrivati dal browser si ricontrollano sempre sul server |
| Accesso | Scritto nel progetto | — | Cookie firmato (HMAC-SHA256) e password con scrypt, entrambi di Node.js: nessuna libreria in più |
| Grafici | SVG scritto a mano | — | Provvisorio, senza librerie: da sostituire (vedi Roadmap) |
| Strumenti | `tsx` 4.23.15, `dotenv` 18.0.9 | | Per lo script `db:utente` |

---

## Requisiti

- **Node.js** 20.19 o superiore, oppure 22.12 o superiore, oppure 24 (requisito di Prisma 7).
- **npm** (incluso con Node).
- **Docker Desktop** avviato, per il database in locale.

## Ambienti: sviluppo e produzione

| | Sviluppo | Produzione |
|---|---|---|
| Ramo Git | `dev` | `main` |
| Database | PostgreSQL in Docker sul tuo PC | Supabase (cloud) *— da collegare* |
| App | `npm run dev` su http://localhost:3000 | Vercel *— da collegare*; sul PC `npm run build` e `npm start` |
| Variabili d'ambiente | file `.env` | variabili di Vercel, oppure della shell se provi la build sul PC |
| `AUTH_SECRET` | uno locale | **un altro**, diverso, solo in produzione |
| Migrazioni | `npm run db:migrate` (crea) e `npm run db:deploy` (applica) | solo `npm run db:deploy` |

Si lavora su `dev`; quando una modifica è pronta si porta in `main`.

**Come Next.js legge le variabili:** prima quelle della shell, poi `.env.production.local` (solo in produzione), `.env.local`, `.env.production` e infine `.env`. Quelle della shell vincono sempre, ed è su questo che si basano i comandi di produzione qui sotto. Gli strumenti di Prisma (`db:deploy`, `db:studio`, `db:utente`) leggono solo la shell e il file `.env`.

## Sviluppo (ramo `dev`)

```bash
git checkout dev
```

1. **Dipendenze**: `npm install` (esegue anche `prisma generate`). Se installi con `--ignore-scripts`, lancia poi `npx prisma generate`.

2. **File `.env`** nella radice del progetto. Non va mai committato, è escluso da Git.

   ```env
   DATABASE_URL="postgresql://gympulse:gympulse@localhost:5432/gympulse"
   AUTH_SECRET="<almeno 32 caratteri casuali>"
   ```

   `AUTH_SECRET` firma il cookie di accesso. Per generarlo:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

   Senza `AUTH_SECRET` nessuno può accedere: l'accesso resta chiuso.

3. **Database**: `docker compose up -d` (ascolta solo su `127.0.0.1:5432`).

4. **Tabelle**: `npm run db:deploy` applica le migrazioni. Quando modifichi lo schema in sviluppo si usa `npm run db:migrate`.

5. **Il primo account**: apri l'app e scegli *Crea account*. In alternativa, da terminale, aggiungi al `.env` queste tre righe:

   ```env
   NUOVO_NOME="Nome Cognome"
   NUOVO_USERNAME="nomeutente"
   NUOVA_PASSWORD="almeno 10 caratteri"
   ```

   poi lancia `npm run db:utente` e **toglile dal `.env`**: una password in chiaro non deve restare su disco. Se il nome utente esiste già, lo stesso comando ne cambia la password.

6. **Avvio**: `npm run dev`, poi apri http://localhost:3000. Se la porta è occupata, Next sceglie la successiva (3001) e lo scrive nel terminale.

> **Windows PowerShell:** se `npm` dà l'errore "esecuzione di script disabilitata", usa `npm.cmd` (per esempio `npm.cmd run dev`) oppure il Prompt dei comandi.

## Produzione (ramo `main`)

In produzione l'app gira su Vercel, collegato al ramo `main`: a ogni push Vercel compila e pubblica da solo. Le istruzioni qui sotto servono per **provare la build di produzione sul tuo PC** prima di pubblicare, e per sapere cosa configurare online.

**Portare una modifica da `dev` a `main`:**

```bash
git checkout main
git merge dev
git push origin main
git checkout dev
```

**Provare la build di produzione sul PC** (PowerShell; con Prompt dei comandi o Git Bash cambia la sintassi delle variabili):

```powershell
git checkout main
npm install
$env:DATABASE_URL = "<stringa di connessione del database di produzione>"
$env:AUTH_SECRET  = "<il segreto di produzione, diverso da quello locale>"
npm.cmd run db:deploy     # applica le migrazioni al database di produzione
npm.cmd run build         # compila
npm.cmd start             # avvia su http://localhost:3000
```

Le variabili della shell valgono solo per quella finestra e vincono sul file `.env`, quindi la build di produzione non usa per sbaglio il database locale. Chiusa la finestra, spariscono. **Non scrivere le credenziali di produzione nel `.env`.**

**Su Vercel** (quando sarà collegato) si impostano in *Settings → Environment Variables*: `DATABASE_URL` (Supabase, *transaction pooler*) e `AUTH_SECRET`. Le migrazioni non partono da sole: si applicano con `db:deploy` dal PC, con `DATABASE_URL` che punta alla connessione diretta di Supabase, prima di pubblicare una modifica che cambia lo schema.

## Script disponibili

Tutti i comandi si lanciano dalla cartella del progetto. Su PowerShell, se `npm` è bloccato, usa `npm.cmd`.

| Comando | Cosa fa | Ramo `dev` (sviluppo) | Ramo `main` (produzione) |
|---|---|---|---|
| `npm install` | Installa le dipendenze e genera il client Prisma | sì | sì, dopo ogni cambio di ramo |
| `npm run dev` | Server di sviluppo con ricarica automatica, su http://localhost:3000 | **è il comando di lavoro** | non si usa |
| `npm run build` | Compila l'app ottimizzata | per controllare che compili | **serve prima di `npm start`**; su Vercel lo fa da solo |
| `npm start` | Avvia l'app compilata | non serve | avvia la produzione; richiede `npm run build` prima |
| `npm run typecheck` | Controlla i tipi TypeScript, senza compilare | **da lanciare prima di ogni commit** | già fatto dalla build |
| `npm run db:deploy` | Applica al database le migrazioni già scritte | applica al database locale | **l'unico per la produzione**: non crea nulla, applica solo |
| `npm run db:migrate` | Crea una nuova migrazione dallo schema e la applica | **solo qui**, quando modifichi `schema.prisma` | **mai** in produzione |
| `npm run db:utente` | Crea un account o ne cambia la password | per l'account di prova | per recuperare una password in produzione, con le variabili di produzione |
| `npm run db:studio` | Apre Prisma Studio per vedere e modificare le righe | database locale | **con cautela**: modifica dati veri |

Sono tutti i comandi esistenti: gli script in `package.json` sono 9 (`dev`, `build`, `start`, `typecheck`, `postinstall`, `db:migrate`, `db:deploy`, `db:studio`, `db:utente`). `postinstall` parte da solo dopo `npm install` e non va lanciato a mano.

## Struttura delle cartelle

Le cartelle `node_modules/` e `.next/` (build) e il file `tsconfig.tsbuildinfo` sono generati e non sono in Git; non li elenco.

```
GymPulse/
├── prisma/
│   ├── migrations/                                   # migrazioni SQL, una cartella per migrazione, in ordine
│   │   ├── 20261029145346_init/                      # tabelle iniziali
│   │   ├── 20261030125625_diario_abc/                # giornate A/B/C e voci della scheda
│   │   ├── 20261030150000_login_utente/              # nome utente e password
│   │   ├── 20261030160000_dati_per_utente/           # dati separati per persona
│   │   ├── 20261030170000_utente_con_id_numerico/    # id numerici e nome completo
│   │   └── migration_lock.toml
│   ├── schema.prisma                                 # modello dei dati
│   └── utente.ts                                     # script: crea un account o cambia la password
├── public/
│   ├── icon.svg                                      # icona dell'app
│   └── manifest.webmanifest                          # nome e colori dell'app, se la aggiungi alla schermata Home
├── src/
│   ├── proxy.ts                                      # prima porta: senza accesso si vede solo il login
│   ├── app/                                          # pagine e route (Next.js App Router)
│   │   ├── layout.tsx                                # intestazione, menu in alto, font
│   │   ├── globals.css                               # colori del tema
│   │   ├── page.tsx                                  # home
│   │   ├── actions.ts                                # azioni sul server: salva sessione e scheda, elimina, importa backup
│   │   ├── api/
│   │   │   └── backup/route.ts                       # esportazione del backup JSON
│   │   ├── login/
│   │   │   ├── page.tsx                              # accesso
│   │   │   ├── actions.ts                            # accedi, registrati, esci
│   │   │   └── registrati/page.tsx                   # creazione dell'account
│   │   ├── scheda/
│   │   │   ├── page.tsx                              # la scheda: scelta A/B/C e avvio della sessione
│   │   │   └── modifica/page.tsx                     # l'editor della giornata
│   │   ├── sessione/page.tsx                         # sessione di allenamento
│   │   ├── storico/
│   │   │   ├── page.tsx                              # elenco delle sedute
│   │   │   └── [sessioneId]/page.tsx                 # dettaglio di una seduta
│   │   └── progressi/page.tsx                        # grafico, volume e record per esercizio
│   ├── components/
│   │   ├── FormSessione.tsx                          # la sessione: serie, ✓, timer, bozza
│   │   ├── EditorScheda.tsx                          # modifica di una giornata
│   │   ├── GraficoAndamento.tsx                      # grafico SVG con mirino e tooltip
│   │   ├── SelettoreEsercizio.tsx                    # menu per scegliere l'esercizio nei progressi
│   │   ├── TabGiorni.tsx                             # scelta A / B / C
│   │   ├── NavSuperiore.tsx                          # menu in alto
│   │   ├── FormLogin.tsx, FormRegistrazione.tsx      # moduli di accesso e registrazione
│   │   ├── BackupDati.tsx                            # esporta e importa il backup
│   │   ├── EliminaSessione.tsx                       # pulsante per eliminare una seduta
│   │   ├── icone.tsx                                 # icone SVG
│   │   └── stili.ts                                  # classi condivise (carte, campi, pulsanti)
│   ├── lib/                                          # calcoli, validazioni e accesso ai dati (tabella sotto)
│   └── generated/prisma/                             # client Prisma generato: non in Git
├── docker-compose.yml                                # PostgreSQL per lo sviluppo
├── next.config.ts                                    # configurazione di Next.js
├── prisma.config.ts                                  # configurazione di Prisma
├── postcss.config.mjs                                # plugin di Tailwind
├── tsconfig.json                                     # configurazione di TypeScript
├── package.json, package-lock.json                   # dipendenze e script
├── next-env.d.ts                                     # tipi di Next.js, rigenerato a ogni avvio: non in Git
├── AGENTS.md                                         # note per gli assistenti AI, scritte da Next.js
├── .env                                              # le tue variabili, con i segreti: non in Git
└── .gitignore                                        # elenco di file da ignorare durante il push su git
```

Dentro `src/lib/` (23 file):

| Gruppo | File |
|---|---|
| Accesso | `accesso.ts` (chi è l'utente della richiesta), `sessione-auth.ts` (cookie firmato), `password.ts` (scrypt), `registrazione.ts` (nome e giornate di partenza), `limite.ts` (limite di tentativi) |
| Dati | `db.ts` (connessione), `scheda-db.ts` (legge la scheda), `storico.ts` (legge sedute e progressi), `catalogo.ts` (trova o crea un esercizio), `voci.ts` (da riga del database a esercizio) |
| Validazione | `sessione-schema.ts`, `scheda-schema.ts`, `backup.ts`, `numeri.ts`, `url.ts` |
| Calcoli | `allenamento.ts` (kcal, timer, giornata consigliata), `progressi.ts` (volume, massimale, carico, record), `grafico.ts` (assi e posizioni), `formato.ts` (date e numeri in italiano) |
| Tipi e form | `scheda-tipi.ts`, `tipi.ts`, `scheda-form.ts`, `bozza.ts` (la sessione in corso nel browser) |

## Modello dei dati

Lo schema è in `prisma/schema.prisma`:

In ogni tabella l'`id` è la prima colonna.

| Tabella | Colonne, nell'ordine | Id |
|---|---|---|
| `User` | `id`, `fullName` (nome completo), `username`, `passwordHash` | numero progressivo |
| `GiornoScheda` | `id`, `userId`, `titolo` | sigla (testo), unica per persona |
| `Esercizio` | `id`, `userId`, `nome`, `muscoli` | numero progressivo |
| `VoceScheda` | `id`, `userId`, `giornoId`, `esercizioId`, `ordine`, `tipo`, `serie`, `ripMin`, `ripMax`, `recuperoSec`, `ripTotali`, `serieMin`, `serieMax`, `nota`, `incrementoKg` | testo casuale |
| `Sessione` | `id`, `userId`, `giornoId`, `data`, `note`, `pesoCorporeoKg`, `durataMinuti`, `datiIniziali` | numero progressivo |
| `SerieEseguita` | `id`, `userId`, `sessioneId`, `esercizioId`, `ordine`, `pesoKg`, `ripetizioni` | testo casuale |

Le **kcal non si salvano**: si calcolano ogni volta da peso corporeo e durata. L'ordine delle giornate è quello delle sigle (A, B, C).

Giornate, esercizi, voci, sedute e serie portano sempre lo `userId`. Le chiavi esterne sono composte: il database stesso rifiuta di collegare un dato a quello di un'altra persona, anche conoscendone l'id.

Modificare la scheda non tocca le sedute già salvate: le serie puntano agli esercizi e non alle voci della scheda.

## Sicurezza

- **Cookie di accesso** `httpOnly`, `SameSite=Lax`, con `Secure` su https. Contiene solo l'id dell'utente e la scadenza, firmati: non può essere modificato per diventare un altro.
- **Password** salvate come hash scrypt. Lo stesso messaggio d'errore per utente inesistente e password sbagliata, con una breve pausa, così non si scoprono i nomi esistenti.
- **L'utente si ricava sempre dal cookie**, mai da un id mandato dal browser. Il proxy chiude le pagine, e ogni pagina e ogni azione ricontrolla da sola.
- **Dati ricontrollati sul server** con Zod (date, pesi, ripetizioni, scheda, backup).
- **Backup**: ognuno scarica solo i propri dati; l'importazione controlla formato, riferimenti e dimensione (massimo 900.000 caratteri) e dà id nuovi alle sedute.
- **Registrazione aperta a chiunque** conosca l'indirizzo. C'è un limite di 3 account all'ora per indirizzo e di 10 accessi ogni 15 minuti, ma il conteggio è in memoria: su Vercel vale per ogni istanza e rallenta senza bloccare del tutto. Per un blocco rigido servirebbe un archivio condiviso.
- **`.env`** escluso da Git; in Git va solo `.env.example`.

## Pubblicazione online (ultimo passo)

1. **Supabase** per il database. Servono due connessioni: quella *transaction pooler* (porta 6543) per l'app e quella diretta o *session pooler* (porta 5432) per le migrazioni. Disattivare l'API REST automatica o attivare la Row Level Security, perché l'accesso passa solo dal backend.
2. **Vercel** per l'app, collegato al ramo `main`. Variabili d'ambiente: `DATABASE_URL` e un `AUTH_SECRET` **nuovo**, diverso da quello locale.
3. Le credenziali di Supabase vanno solo nelle variabili di Vercel, mai nel codice e mai nel `.env`.

## Roadmap

1. ~~Scheda A/B/C, sessione, storico, progressi, personalizzazione e backup~~ (fatto)
2. ~~Account personali con registrazione dall'app e dati separati per persona~~ (fatto)
3. Grafici con una libreria e panoramica generale dei progressi
4. Export e import CSV delle sedute, al posto del backup JSON
5. Recupero della password dall'app
6. Studio dell'integrazione con lo smartwatch
7. Collegamento a Supabase e pubblicazione su Vercel
