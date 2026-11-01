# GymPulse

**Il diario di allenamento in palestra.** Ognuno ha il proprio account e la propria scheda A/B/C. In palestra registri ogni serie con kg e ripetizioni, l'app ti suggerisce i valori dell'ultima volta e fa partire il timer di recupero. A casa guardi lo storico e i progressi.

Si usa dal browser del telefono e funziona anche in locale sul PC.

> **Stato:** funziona in locale con PostgreSQL in Docker. Il collegamento a Supabase e la pubblicazione su Vercel non sono ancora fatti.

---

## Cosa può fare l'app

### Già disponibile

| Cosa | Come funziona |
|---|---|
| **Account personali** | Ti registri dall'app con nome e cognome, nome utente, **email** e password: sono tutti obbligatori. L'email si conferma con un codice e l'account nasce solo dopo il codice giusto. Ogni persona vede solo i propri dati. |
| **Recupero della password** | Dalla pagina di accesso ("Password dimenticata?") scrivi il nome utente: arriva un'email con un codice a 6 cifre, valido 10 minuti, e scegli una password nuova. Dalla pagina **Account** l'email si può cambiare (servono la password e un codice di conferma all'indirizzo nuovo) ma **non togliere**, perché serve al recupero. |
| **La tua scheda A/B/C** | Parti con tre giornate vuote e le riempi dall'app: scegli gli esercizi, serie, ripetizioni (anche a range, es. 6-8), recupero, note e il "carico a salire". Puoi cambiare l'ordine, aggiungere e togliere esercizi quando vuoi. |
| **Sessione di allenamento** | Per ogni serie scrivi kg e ripetizioni e la confermi con ✓. Puoi aggiungere o togliere serie, aggiungere esercizi extra e cambiare la data. |
| **Valori dell'ultima volta** | Nei campi vedi in grigio i kg e le ripetizioni dell'ultima seduta. Contano solo dopo la conferma: se confermi una serie vuota vale il suggerimento. |
| **Timer di recupero** | Dopo ogni serie parte il conto alla rovescia del recupero previsto dalla scheda (con vibrazione sui telefoni che la supportano). |
| **Suggerimento del carico** | Per gli esercizi con "carico a salire" (es. panca, squat, stacco) l'app propone il peso successivo quando hai completato tutte le ripetizioni previste. |
| **Giornata consigliata** | La home ti dice cosa tocca oggi. Dentro la settimana segue l'ordine A → B → C: propone la giornata dopo l'ultima registrata. **Ogni lunedì riparte da A**, anche se la settimana prima non hai finito il giro (le settimane vanno da lunedì a domenica, all'ora di Roma). Le altre giornate restano sempre a un tocco, nell'elenco sotto. |
| **Bozza che non si perde** | Se chiudi la pagina o il telefono si spegne a metà allenamento, le serie già confermate restano nel browser per 12 ore. |
| **Storico** | Elenco delle sedute con volume e durata; dettaglio di ogni seduta; puoi eliminarne una. |
| **Progressi: panoramica** | Sedute per settimana e volume per settimana (le settimane senza sedute ci sono, a zero), sedute per giornata A/B/C e gli ultimi record. |
| **Progressi: per esercizio** | Tre grafici per ogni esercizio: carico massimo, massimale stimato e volume per seduta. Ogni grafico ha il suggerimento al passaggio del mouse (o con la tastiera) e la tabella dei numeri. |
| **Volume e massimale stimato** | Volume = kg × ripetizioni. Il massimale (1RM) è stimato con la formula di Epley, `peso × (1 + ripetizioni / 30)`, sulla serie migliore di ogni seduta. Le sedute con ripetizioni non registrate (dati iniziali) non entrano nel massimale e nel volume sono barre più chiare. |
| **Dati dell'orologio** | Per ogni seduta, in modo facoltativo: durata, calorie, battiti medi e massimi. Si scrivono a mano oppure si legge un file **TCX** esportato dall'app dell'orologio: i campi si compilano da soli e restano modificabili. Compaiono nel dettaglio e nell'elenco dello storico. Vedi "Smartwatch" più sotto per cosa funziona e cosa no. |
| **Sedute in CSV** | Esporti le tue sedute in un file che si apre in Excel (una riga per serie, separatore `;`, decimali con la virgola, con anche i dati dell'orologio) e lo reimporti. L'importazione **aggiunge**: le sedute già presenti (stessa data e stessa giornata) si saltano, quindi importare due volte lo stesso file non duplica nulla. Gli esercizi si ritrovano per nome e, se non ci sono, si creano. La scheda non è nel file. |

### In programma

| Cosa | Situazione |
|---|---|
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
| Grafici | Recharts | 3.10.1 | Linee e barre di una sola serie, in un solo colore (blu `#2a78d6`, controllato sul colore della carta) |
| Email | Nodemailer | 10.1.2 | Invio SMTP dei codici. Scelta la 10.1.2 e non la 10.3.1 più recente, uscita da due giorni: un pacchetto che maneggia le credenziali l'ho voluto con almeno due settimane di vita |
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

   **Email (registrazione e recupero della password).** Senza un servizio email configurato la registrazione e il recupero sono spenti, e l'app lo dice. Per provare in locale senza mandare nulla aggiungi al `.env`:

   ```env
   EMAIL_PROVIDER="console"
   ```

   Con questa riga l'email non parte: il messaggio, con il codice, compare nel terminale dove gira `npm run dev` (riga `[email:console]`). **Non si accende su Vercel**, dove la variabile `VERCEL` lo impedisce. Per mandare email vere serve un account di posta con SMTP (vedi "Email vere con Gmail" più sotto).

3. **Database**: `docker compose up -d` (ascolta solo su `127.0.0.1:5432`).

4. **Tabelle**: `npm run db:deploy` applica le migrazioni. Quando modifichi lo schema in sviluppo si usa `npm run db:migrate`.

5. **Il primo account**: apri l'app e scegli *Crea account* (con `EMAIL_PROVIDER="console"` il codice lo leggi nel terminale). In alternativa, da terminale, senza email, aggiungi al `.env` queste tre righe:

   ```env
   NUOVO_NOME="Nome Cognome"
   NUOVO_USERNAME="nomeutente"
   NUOVA_PASSWORD="almeno 10 caratteri"
   ```

   poi lancia `npm run db:utente` e **toglile dal `.env`**: una password in chiaro non deve restare su disco. Se il nome utente esiste già, lo stesso comando ne cambia la password. Un account creato così **non ha un'email**: la si collega dalla pagina Account, e finché non c'è la password non si recupera con il codice.

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
│   │   ├── 20261031100000_tabelle_riordinate/        # id come prima colonna, colonne superflue tolte
│   │   ├── 20261031110000_senza_peso_corporeo/       # via la colonna del peso corporeo
│   │   ├── 20261031120000_dati_orologio/             # battiti medi e massimi e calorie dell'orologio
│   │   ├── 20261031130000_codice_recupero/           # primo tentativo con il cellulare (sostituito dall'email)
│   │   ├── 20261031150000_email_al_posto_del_telefono/ # email dell'utente, codici per email, registrazioni in attesa
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
│   │   ├── actions.ts                                # azioni sul server: salva sessione e scheda, elimina, importa CSV
│   │   ├── api/
│   │   │   └── export/route.ts                       # esportazione delle sedute in CSV
│   │   ├── login/
│   │   │   ├── page.tsx                              # accesso
│   │   │   ├── actions.ts                            # accedi, registrati (con email), recupera la password, esci
│   │   │   ├── registrati/page.tsx                   # creazione dell'account
│   │   │   └── recupera/page.tsx                     # password dimenticata
│   │   ├── account/
│   │   │   ├── page.tsx                              # il tuo account e l'email per il recupero
│   │   │   └── actions.ts                            # collega, conferma e cambia l'email (non si toglie)
│   │   ├── scheda/
│   │   │   ├── page.tsx                              # la scheda: scelta A/B/C e avvio della sessione
│   │   │   └── modifica/page.tsx                     # l'editor della giornata
│   │   ├── sessione/page.tsx                         # sessione di allenamento
│   │   ├── storico/
│   │   │   ├── page.tsx                              # elenco delle sedute
│   │   │   └── [sessioneId]/page.tsx                 # dettaglio di una seduta
│   │   └── progressi/page.tsx                        # panoramica e grafici per esercizio
│   ├── components/
│   │   ├── FormSessione.tsx                          # la sessione: serie, ✓, timer, bozza
│   │   ├── EditorScheda.tsx                          # modifica di una giornata
│   │   ├── GraficoSerie.tsx                          # grafico a linee o a barre (Recharts) con suggerimento e tabella
│   │   ├── DistribuzioneGiornate.tsx                 # barre delle sedute per giornata A/B/C
│   │   ├── SchedeProgressi.tsx                       # scelta tra panoramica e per esercizio
│   │   ├── SelettoreEsercizio.tsx                    # menu per scegliere l'esercizio nei progressi
│   │   ├── TabGiorni.tsx                             # scelta A / B / C
│   │   ├── NavSuperiore.tsx                          # menu in alto
│   │   ├── FormLogin.tsx, FormRegistrazione.tsx      # moduli di accesso e registrazione (a due passi, con il codice per email)
│   │   ├── FormRecupero.tsx, FormEmail.tsx           # recupero della password e email nell'Account
│   │   ├── CsvSedute.tsx                             # esporta e importa le sedute in CSV
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

Dentro `src/lib/` (31 file):

| Gruppo | File |
|---|---|
| Accesso | `accesso.ts` (chi è l'utente della richiesta), `sessione-auth.ts` (cookie firmato), `password.ts` (scrypt), `registrazione.ts` (nome e giornate di partenza), `limite.ts` (limite di tentativi in memoria), `utente.ts` (dati dell'account) |
| Email | `email.ts` (invio SMTP con Nodemailer), `otp.ts` (codici a 6 cifre, HMAC e testo del messaggio), `codici-email.ts` (codici e registrazioni in attesa nel database, con i limiti), `indirizzo-email.ts` (controllo degli indirizzi) |
| Dati | `db.ts` (connessione), `scheda-db.ts` (legge la scheda), `storico.ts` (legge sedute e progressi), `catalogo.ts` (trova o crea un esercizio), `voci.ts` (da riga del database a esercizio) |
| Validazione | `sessione-schema.ts`, `scheda-schema.ts`, `csv.ts` (scrive e legge il CSV delle sedute), `orologio.ts` (limiti di battiti e calorie), `tcx.ts` (legge i file TCX, nel browser), `numeri.ts`, `url.ts` |
| Calcoli | `allenamento.ts` (timer, giornata consigliata, carico successivo), `progressi.ts` (volume, massimale, carico, record), `panoramica.ts` (sedute e volume per settimana, sedute per giornata), `grafico.ts` (assi dei grafici), `formato.ts` (date e numeri in italiano) |
| Tipi e form | `scheda-tipi.ts`, `tipi.ts`, `scheda-form.ts`, `bozza.ts` (la sessione in corso nel browser) |

## Modello dei dati

Lo schema è in `prisma/schema.prisma`:

In ogni tabella l'`id` è la prima colonna.

| Tabella | Colonne, nell'ordine | Id |
|---|---|---|
| `User` | `id`, `fullName` (nome completo), `username`, `passwordHash`, `email` | numero progressivo |
| `GiornoScheda` | `id`, `userId`, `titolo` | sigla (testo), unica per persona |
| `Esercizio` | `id`, `userId`, `nome`, `muscoli` | numero progressivo |
| `VoceScheda` | `id`, `userId`, `giornoId`, `esercizioId`, `ordine`, `tipo`, `serie`, `ripMin`, `ripMax`, `recuperoSec`, `ripTotali`, `serieMin`, `serieMax`, `nota`, `incrementoKg` | testo casuale |
| `Sessione` | `id`, `userId`, `giornoId`, `data`, `note`, `durataMinuti`, `datiIniziali`, `fcMediaBpm`, `fcMassimaBpm`, `kcalOrologio` | numero progressivo |
| `SerieEseguita` | `id`, `userId`, `sessioneId`, `esercizioId`, `ordine`, `pesoKg`, `ripetizioni` | testo casuale |

Due tabelle servono solo ai codici per email e non hanno dati della scheda:

| Tabella | Colonne, nell'ordine | A cosa serve |
|---|---|---|
| `CodiceEmail` | `id`, `userId`, `scopo` (`email` o `recupero`), `email`, `chiave`, `codiceHash`, `tentativi`, `creatoIl`, `scadeIl` | i codici mandati a chi ha già un account |
| `RegistrazioneSospesa` | `id` (uuid), `fullName`, `username`, `passwordHash`, `email`, `chiave`, `codiceHash`, `tentativi`, `creatoIl`, `scadeIl` | una registrazione in attesa del codice: l'account non esiste ancora |

Del codice non si salva mai il numero ma un HMAC calcolato con `AUTH_SECRET`. `chiave` è l'indirizzo ridotto alla casella vera (senza `+qualcosa` e, su Gmail, senza punti) e serve solo ai limiti. Un codice o una registrazione "usati" non si cancellano, scadono: la riga resta perché conta nei limiti. Si cancellano da sole dopo due giorni.

L'ordine delle giornate è quello delle sigle (A, B, C). L'app non registra il peso corporeo e non calcola le calorie: quelle di `kcalOrologio` le porti tu, a mano o da un file dell'orologio.

Giornate, esercizi, voci, sedute e serie portano sempre lo `userId`. Le chiavi esterne sono composte: il database stesso rifiuta di collegare un dato a quello di un'altra persona, anche conoscendone l'id.

Modificare la scheda non tocca le sedute già salvate: le serie puntano agli esercizi e non alle voci della scheda.

## Sicurezza

- **Cookie di accesso** `httpOnly`, `SameSite=Lax`, con `Secure` su https. Contiene solo l'id dell'utente e la scadenza, firmati: non può essere modificato per diventare un altro.
- **Password** salvate come hash scrypt. Lo stesso messaggio d'errore per utente inesistente e password sbagliata, con una breve pausa, così non si scoprono i nomi esistenti.
- **L'utente si ricava sempre dal cookie**, mai da un id mandato dal browser. Il proxy chiude le pagine, e ogni pagina e ogni azione ricontrolla da sola.
- **Dati ricontrollati sul server** con Zod (date, pesi, ripetizioni, scheda, file CSV).
- **CSV**: ognuno scarica solo le proprie sedute. L'importazione controlla ogni riga (data, peso, ripetizioni, durata, note), la dimensione (massimo 900.000 caratteri), e si ferma al primo errore dicendo il numero di riga, senza importare niente a metà. Nel file esportato i testi che iniziano con `=`, `+`, `-` o `@` hanno un apostrofo davanti, così Excel non li esegue come formule; l'importazione lo toglie.
- **File TCX**: si leggono nel browser e al server arrivano solo quattro numeri, che il server ricontrolla (battiti tra 30 e 250, calorie fino a 10.000, massima non sotto la media). I file con definizioni di entità (`<!DOCTYPE`, `<!ENTITY`) si rifiutano, e oltre 25 milioni di caratteri non si leggono.
- **Registrazione aperta a chiunque** conosca l'indirizzo, ma con l'email obbligatoria e confermata con un codice. Ci sono limiti per indirizzo di rete (3 account all'ora, 10 accessi ogni 15 minuti, 5 email di registrazione o di recupero all'ora) tenuti **in memoria**: su Vercel valgono per ogni istanza e rallentano senza bloccare del tutto.
- **Limiti delle email nel database** (valgono per tutti i server e non si azzerano riavviando): 1 email al minuto per scopo, 3 all'ora e 10 al giorno per persona, **3 all'ora per ogni casella di destinazione** (ferma chi vuole riempire di messaggi l'indirizzo di un altro; `nome+1@gmail.com`, `n.ome@gmail.com` e `nome@googlemail.com` contano come la stessa casella) e un **tetto globale di 100 email in 24 ore** (cambia con `EMAIL_LIMITE_GIORNALIERO`). Le email sono gratis, ma il tetto protegge l'account che le spedisce: Google dichiara un massimo di 500 email al giorno e blocca l'invio per 1-24 ore se lo si supera. Se il tetto scatta, registrazione e recupero si fermano.
- **Codici per email**: 6 cifre, valgono 10 minuti, 5 tentativi, uso unico, e un codice nuovo sostituisce il precedente. Nel database c'è solo un HMAC, legato a persona e scopo. Un codice di recupero vale solo se è stato mandato all'indirizzo che l'account ha *in quel momento*: cambiare l'email rende inutili i codici già mandati.
- **Gli indirizzi sono controllati con rigore** (`lib/indirizzo-email.ts`): niente spazi, virgole, virgolette, a capo o più indirizzi. L'indirizzo finisce in un'intestazione del messaggio, quindi un valore con un a capo potrebbe aggiungere destinatari. Un indirizzo insolito ma valido può essere rifiutato: meglio questo che spedire a qualcosa che non si sa leggere.
- **L'email apre la porta all'account**: chi ha accesso alla casella può cambiare la password. Per questo collegarla o cambiarla chiede la password (togliere non si può), e il recupero risponde in modo diverso a "non esiste o senza email" solo per dire subito a chi non ne ha una che da qui non può recuperare nulla.
- **Il messaggio** è solo testo, senza link: non c'è niente da cliccare e niente da falsificare. Il codice non è nell'oggetto, che si vede anche a schermo bloccato.
- **`.env`** escluso da Git; in Git va solo `.env.example`.

## Smartwatch: cosa funziona e cosa no

Un'app web non può leggere i dati dell'orologio da sola: Apple Salute, Google Health Connect e simili sono accessibili solo da app installate sul telefono. Quindi **l'orologio non si collega all'app: i dati si portano dentro con un file o a mano**.

| Strada | Stato |
|---|---|
| **Scrivere a mano** durata, calorie e battiti letti dall'orologio | Funziona con qualunque orologio |
| **File TCX** esportato dall'app dell'orologio | Fatto. Il TCX è un formato pubblico di Garmin (Garmin Connect lo esporta); altre app potrebbero offrirlo, ma **non ho verificato quali**. Si legge la durata, le calorie, i battiti medi e massimi |
| **Apple Watch** | Apple Salute esporta un `export.xml` completo, ma non un TCX del singolo allenamento: per averlo serve un'app di terze parti che converta gli allenamenti. In alternativa, si scrivono i numeri a mano. **Non ho scritto il lettore di `export.xml`**: non ho potuto controllarne il formato su un file reale, e un lettore fatto a memoria rischia di sbagliare in silenzio |
| **Collegamento diretto** (Apple Salute, Health Connect) | Non si può fare da una web app: servirebbe un'app nativa. Non è in programma |

Come si legge un TCX: la durata è la somma dei giri; le calorie la somma delle calorie dei giri; i battiti medi la media dei giri pesata sulla durata (se manca, la media dei punti con battito); i battiti massimi il valore più alto. Un file con più attività si rifiuta, perché non si saprebbe quale scegliere. Se l'allenamento nel file è di un giorno diverso dalla sessione, l'app lo segnala senza cambiare la data.

**Non ancora provato con file veri.** Il lettore è stato provato con file TCX scritti da me seguendo lo schema pubblicato da Garmin, non con file esportati da un orologio reale: è il primo controllo da fare con il tuo.

## Email vere con Gmail

L'invio è in `src/lib/email.ts` e parla con un server SMTP qualunque tramite Nodemailer. Il caso a costo zero è un **account Gmail**; per le email i servizi gratuiti più noti richiedono un dominio proprio (a pagamento), un account Gmail no.

**Usa un account Gmail creato apposta per l'app, non il tuo personale.** La password per le app dà accesso all'account: se si perde, vuoi che sia una casella vuota e non la tua posta vera.

1. Crea l'account Gmail (per esempio `gympulse.app@gmail.com`) e attiva la **verifica in due passaggi**: senza, Google non offre le password per le app.
2. Nelle impostazioni dell'account Google crea una **password per le app**: sono 16 lettere. Google la mostra **una sola volta**; se la perdi se ne crea un'altra, e si revoca quando cambi la password dell'account.
3. Imposta queste variabili. In locale nel `.env`, online **solo nelle variabili di Vercel**:

   ```env
   SMTP_UTENTE="gympulse.app@gmail.com"      # l'indirizzo da cui partono i messaggi
   SMTP_PASSWORD="abcd efgh ijkl mnop"       # la password per le app (gli spazi si possono lasciare); NON la password dell'account
   SMTP_HOST="smtp.gmail.com"                # facoltativa: è già il valore di partenza
   SMTP_PORTA="587"                          # facoltativa: 587 (di partenza) oppure 465
   EMAIL_LIMITE_GIORNALIERO="100"            # facoltativa: tetto alle email in 24 ore, per tutta l'app
   ```

4. Se manca qualcosa, o è scritto male, l'invio resta spento e l'app lo dice (nelle pagine di registrazione, recupero e Account) invece di fallire a metà. Nel log del server compare il motivo, senza mai l'indirizzo né il codice.

**Cosa ho verificato e cosa no.** Le prime due righe vengono dalle pagine di Google lette durante il lavoro:

- *Letto:* il server SMTP di Gmail è `smtp.gmail.com`, porta 587 con TLS, nome utente = l'indirizzo email, autenticazione obbligatoria.
- *Letto:* Google dichiara un massimo di 500 email al giorno per account e, se si supera, blocca l'invio per 1-24 ore. Per questo il tetto dell'app è a 100.
- *Letto:* Google dice che le password per le app "non sono consigliate e non servono nella maggior parte dei casi", ma resta il modo per far inviare a un'app una mail da Gmail con SMTP.
- *Non so:* se il limite di 500 vale allo stesso modo via SMTP (la pagina non lo dice).
- *Non so:* se Google blocchi o limiti un account nuovo che manda codici di accesso ad altri indirizzi, e se i messaggi finiscano nello spam del destinatario. I messaggi sono di solo testo, senza link e col solo codice, per ridurre il rischio, ma la consegna non l'ho potuta controllare.
- *Mai provato con Gmail vero.* L'invio è stato provato con un trasporto finto (configurazione, mittente, destinatario, gestione degli errori) e con la modalità `console`. Non ho spedito nessuna email reale: il primo invio vero è il primo controllo da fare, mandandolo a te.
- *Il segreto.* `SMTP_PASSWORD` non va nel codice né in Git. Se sospetti che sia uscita, revocala dalla pagina delle password per le app di Google e creane un'altra.

**Per provare in locale senza mandare niente**, usa `EMAIL_PROVIDER="console"` come spiegato più su.

## Pubblicazione online (ultimo passo)

1. **Supabase** per il database. Servono due connessioni: quella *transaction pooler* (porta 6543) per l'app e quella diretta o *session pooler* (porta 5432) per le migrazioni. Disattivare l'API REST automatica o attivare la Row Level Security, perché l'accesso passa solo dal backend.
2. **Vercel** per l'app, collegato al ramo `main`. Variabili d'ambiente: `DATABASE_URL`, un `AUTH_SECRET` **nuovo**, diverso da quello locale, e le variabili dell'email (`SMTP_UTENTE`, `SMTP_PASSWORD`). Senza queste la registrazione e il recupero restano spenti.
3. Le credenziali di Supabase vanno solo nelle variabili di Vercel, mai nel codice e mai nel `.env`.

## Roadmap

1. ~~Scheda A/B/C, sessione, storico, progressi e personalizzazione~~ (fatto)
2. ~~Account personali con registrazione dall'app e dati separati per persona~~ (fatto)
3. ~~Grafici con una libreria e panoramica generale dei progressi~~ (fatto)
4. ~~Export e import CSV delle sedute, al posto del backup JSON~~ (fatto)
5. ~~Recupero della password dall'app~~ (fatto, con codice per email; da provare con Gmail vero)
6. ~~Smartwatch: dati a mano e da file TCX~~ (fatto; da provare con un file vero)
7. Collegamento a Supabase e pubblicazione su Vercel
