# GymPulse

**Il diario di allenamento in palestra.** Ognuno ha il proprio account e la propria scheda, con da 1 a 7 giornate di allenamento a scelta. In palestra registri ogni serie con kg e ripetizioni, l'app ti suggerisce i valori dell'ultima volta e fa partire il timer di recupero. A casa guardi lo storico e i progressi.

Si usa dal browser del telefono e funziona anche in locale sul PC.

> **Stato:** funziona in locale con PostgreSQL in Docker. Il collegamento a Neon e la pubblicazione su Vercel non sono ancora fatti.

---

## Cosa può fare l'app

### Già disponibile

| Cosa | Come funziona |
|---|---|
| **Account personali** | Ti registri dall'app con nome e cognome, nome utente, **email** e password: sono tutti obbligatori. L'email si conferma con un codice e l'account nasce solo dopo il codice giusto. Ogni persona vede solo i propri dati. |
| **Recupero della password** | Dalla pagina di accesso ("Password dimenticata?") scrivi il nome utente: arriva un'email con un codice a 6 cifre, valido 10 minuti, e scegli una password nuova. Dalla pagina **Account** l'email si può cambiare (servono la password e un codice di conferma all'indirizzo nuovo) ma **non togliere**, perché serve al recupero. |
| **La tua scheda** | Parti con **una sola giornata vuota (A)** e la riempi dall'app, poi aggiungi le altre col **+**: scegli gli esercizi, serie, ripetizioni (anche a range, es. 6-8), recupero, note e il "carico a salire". Puoi cambiare l'ordine, aggiungere e togliere esercizi quando vuoi. La pagina della giornata mostra per ogni esercizio serie × ripetizioni **e il tempo di recupero**  e l'ultimo carico usato. |
| **Catalogo degli esercizi** | Gli esercizi **non si scrivono più a mano**: si scelgono da un catalogo di **240 esercizi**, diviso in otto categorie (**Petto, Dorsali, Spalle, Braccia, Gambe, Addome, Cardio, Riscaldamento**). Nell'elenco si cerca per nome (italiano, inglese o altri nomi, senza badare agli accenti) e si filtra per categoria. Il nome italiano è in evidenza e l'inglese, più piccolo, sta sotto. La categoria è quella del catalogo e non si cambia. Il catalogo è nel database (tabella `CatalogoEsercizio`) e si carica dal file `prisma/dati/catalogo-esercizi.json` con `npm run db:catalogo`: per aggiungere un esercizio si aggiunge una voce al file e si rilancia il comando. |
| **Come si fa** | Sotto ogni esercizio, nella scheda e nella sessione, il pulsante **Come si fa** apre i passi dell'esecuzione e le accortezze da avere. I testi li dà il database a richiesta (non viaggiano con la pagina). Sono scritti in italiano, con parole nostre, a partire da pagine italiane lette, da un dataset pubblico inglese tradotto (free-exercise-db, licenza Unlicense) e, per una parte degli esercizi, dalla sola conoscenza generale perché non si è trovata una fonte leggibile. Tutti i 240 testi sono stati poi riletti e corretti (ortografia, presa «inversa» al posto di «supina», «addome» al posto di «core»), e quelli che erano rimasti di un esercizio sostituito sono stati riscritti. **Non sono consigli di un istruttore**: per i movimenti tecnici e i carichi pesanti c'è sempre l'invito a impararli con un istruttore. Se per l'esercizio c'è un'immagine, compare nel riquadro. |
| **Immagini degli esercizi** | Un'immagine per esercizio, nella cartella `public/esercizi`: JPEG quadrati di **200 × 200** punti con lo sfondo bianco, chiamati con il numero e lo slug dell'esercizio (`35_push-up.jpg`; lo script accetta anche `.png` e `.webp`, e il solo slug o il solo numero). Il numero e lo slug si trovano nel file `prisma/dati/catalogo-esercizi.json`. Per aggiungerne una basta mettere il file nella cartella e rilanciare `npm run db:catalogo`: lo script ritrova i file da solo, segnala i nomi che non corrispondono a nessun esercizio e i doppioni. Nell'app l'immagine compare nel riquadro **Come si fa** e accanto al nome nella scheda, nella sessione, nell'editor della scheda e nello storico, sempre alla sua grandezza o più piccola (mai ingrandita, perché sfocherebbe). **Controlla i diritti**: il repository è pubblico, quindi le immagini vanno tenute nel repository solo se si ha il permesso di usarle. |
| **Quante giornate vuoi** | Il numero di giornate non è fisso: da **1 a 7**, a seconda di quante volte ti alleni a settimana. Dalla pagina Scheda il **+** aggiunge la giornata successiva (B, C, D, …) e "Togli la giornata" la toglie, finché ne resta una. Togliendo una giornata che ha già sedute registrate, le sedute **non si perdono**: restano nello storico, nei progressi e nell'export, e la giornata sparisce solo dalla scheda. |
| **Sessione di allenamento** | Per ogni serie scrivi kg e ripetizioni e la confermi con ✓. Puoi aggiungere o togliere serie, aggiungere esercizi extra e cambiare la data. |
| **Valori dell'ultima volta** | Nei campi vedi in grigio i kg e le ripetizioni dell'ultima seduta. Contano solo dopo la conferma: se confermi una serie vuota vale il suggerimento. |
| **Timer di recupero** | Dopo ogni serie parte il conto alla rovescia del recupero previsto dalla scheda (con vibrazione sui telefoni che la supportano). |
| **Suggerimento del carico** | Per gli esercizi con "carico a salire" (es. panca, squat, stacco) l'app propone il peso successivo quando hai completato tutte le ripetizioni previste. |
| **Giornata consigliata** | La home ti dice cosa tocca oggi. Dentro la settimana segue l'ordine delle giornate (A → B → C → …): propone la giornata dopo l'ultima registrata. **Ogni lunedì riparte dalla prima**, anche se la settimana prima non hai finito il giro (le settimane vanno da lunedì a domenica, all'ora di Roma). Le altre giornate restano sempre a un tocco, nell'elenco sotto. |
| **Bozza che non si perde** | Se chiudi la pagina o il browser, o il telefono si spegne, a metà allenamento, le serie già confermate restano nel browser per 12 ore, **anche se nel frattempo l'accesso è scaduto**. Nella home compare "Riprendi la sessione": tocchi, accedi di nuovo se serve, e ritrovi tutto com'era. Ogni account ha la sua bozza, anche sullo stesso browser. |
| **Sessione di accesso** | Vale **fino alla prossima mezzanotte di Roma**: accedi quando inizi ad allenarti e non vieni buttato fuori a metà, anche se un giorno ti alleni alle 17:30 e il giorno dopo alle 18:30. Chiudere il browser per sbaglio non fa uscire. **Cambiando la password (con il recupero) tutte le sessioni aperte, su qualunque dispositivo, si chiudono** e si accede di nuovo con la password nuova. |
| **Storico** | Elenco delle sedute con volume e durata; dettaglio di ogni seduta; puoi eliminarne una. |
| **Progressi: panoramica** | Sedute per settimana (le settimane senza sedute ci sono, a zero), **kg per categoria** di una settimana, sedute per giornata e gli ultimi record. |
| **Progressi: per esercizio** | Tre grafici per ogni esercizio: carico massimo, peso totale per seduta e ripetizioni totali per seduta (nelle sedute con ripetizioni non registrate un avviso lo dice). Ogni grafico ha il suggerimento al passaggio del mouse (o con la tastiera) e la tabella dei numeri, e quello del peso totale mostra anche la somma. |
| **Kg per gruppo e peso totale** | I kg di ogni serie si **sommano senza moltiplicare per le ripetizioni**. Nella panoramica la somma è per categoria (le otto con kg: Petto, Dorsali, Spalle, Braccia, Gambe, Olimpico, Corpo intero, Altri; Addome e Cardio non ci sono) e si sfoglia una settimana alla volta con le frecce. Passando il mouse su una categoria (con la tastiera: Tab; sul telefono: toccandolo) compaiono i suoi esercizi con il calcolo. Gli esercizi senza categoria (di prima del catalogo) non entrano nelle categorie: i loro kg compaiono a parte, sotto il grafico. |
| **Durata della seduta** | Per ogni seduta puoi scrivere, se vuoi, quanti minuti è durata: compare nel dettaglio e nell'elenco dello storico. Non c'è nessun collegamento con orologi o altre app. |
| **Sedute in CSV** | Esporti le tue sedute in un file che si apre in Excel (una riga per serie, separatore `;`, decimali con la virgola) e lo reimporti. I file esportati quando c'erano ancora i dati dell'orologio si importano lo stesso: le colonne dei battiti e delle calorie vengono ignorate. L'importazione **aggiunge**: le sedute già presenti (stessa data e stessa giornata) si saltano, quindi importare due volte lo stesso file non duplica nulla. Gli esercizi si ritrovano per nome e, se non ci sono, si creano. La scheda non è nel file. |

### In programma

| Cosa | Situazione |
|---|---|
| **Pubblicazione online** | Ultimo passo: Neon per il database e Vercel per l'app. |

---

## Stack tecnologico

| Area | Tecnologia | Versione | Note |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.4.3 | Pagine e backend nello stesso progetto; le modifiche ai dati passano da *server action* |
| Interfaccia | React | 19.3.1 | Libreria per la costruzione dell'interfaccia utente tramite componenti riutilizzabili e gestione dello stato |
| Linguaggio | TypeScript | 7.0.2 | Superset tipizzato di JavaScript; controllo statico dei tipi per un codice più sicuro e manutenibile |
| Stile | Tailwind CSS | 4.3.3 | Font Bricolage Grotesque, tema chiaro |
| Database | PostgreSQL | 17 | Docker in locale; Neon (cloud) previsto per la pubblicazione |
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
| Database | PostgreSQL in Docker sul tuo PC | Neon (cloud) *— da collegare* |
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
   NUOVA_PASSWORD="almeno 8 caratteri"
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

**Su Vercel** (quando sarà collegato) si impostano in *Settings → Environment Variables*: `DATABASE_URL` (Neon, la stringa **con pooler**, quella con `-pooler` nell'indirizzo) e `AUTH_SECRET`. Le migrazioni non partono da sole: si applicano con `db:deploy` dal PC, con `DATABASE_URL` della shell che punta alla stringa **diretta** di Neon (senza `-pooler`), prima di pubblicare una modifica che cambia lo schema.

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
| `npm run db:catalogo` | Carica il catalogo degli esercizi (`prisma/dati/catalogo-esercizi.json`) e collega agli esercizi delle persone quelli con lo stesso nome. Con `PROVA=1` non scrive niente e mostra cosa cambierebbe | dopo ogni migrazione che tocca il catalogo, e quando se ne modifica il file | con le variabili di produzione, dopo il backup |
| `npm run db:studio` | Apre Prisma Studio per vedere e modificare le righe | database locale | **con cautela**: modifica dati veri |

Sono tutti i comandi esistenti: gli script in `package.json` sono 10 (`dev`, `build`, `start`, `typecheck`, `postinstall`, `db:migrate`, `db:deploy`, `db:studio`, `db:utente`, `db:catalogo`). `postinstall` parte da solo dopo `npm install` e non va lanciato a mano.

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
│   │   ├── 20261031120000_dati_orologio/             # battiti medi e massimi e calorie dell'orologio (poi tolti)
│   │   ├── 20261031130000_codice_recupero/           # primo tentativo con il cellulare (sostituito dall'email)
│   │   ├── 20261031150000_email_al_posto_del_telefono/ # email dell'utente, codici per email, registrazioni in attesa
│   │   ├── 20261101100000_giornate_archiviabili/     # una giornata tolta con sedute resta per lo storico
│   │   ├── 20261101120000_muscoli_standard/          # un solo gruppo muscolare per esercizio (poi sostituito dal catalogo)
│   │   ├── 20261103190000_catalogo_esercizi/         # catalogo degli esercizi e dieci categorie al posto dei sette gruppi
│   │   ├── 20261102100000_senza_dati_orologio/       # via i battiti e le calorie dell'orologio
│   │   ├── 20261108120000_categorie_riscaldamento/   # otto categorie: "altri" diventa "riscaldamento", via olimpico e corpo intero
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
│   │   ├── DistribuzioneGiornate.tsx                 # barre delle sedute per giornata
│   │   ├── AggiungiGiornata.tsx, RimuoviGiornata.tsx # il "+" e "Togli la giornata" nella pagina Scheda
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

Dentro `src/lib/` (33 file):

| Gruppo | File |
|---|---|
| Accesso | `accesso.ts` (chi è l'utente della richiesta), `sessione-auth.ts` (cookie firmato), `password.ts` (scrypt), `registrazione.ts` (nome e giornate di partenza), `limite.ts` (limite di tentativi in memoria), `utente.ts` (dati dell'account) |
| Email | `email.ts` (invio SMTP con Nodemailer), `otp.ts` (codici a 6 cifre, HMAC e testo del messaggio), `codici-email.ts` (codici e registrazioni in attesa nel database, con i limiti), `indirizzo-email.ts` (controllo degli indirizzi) |
| Dati | `db.ts` (connessione), `scheda-db.ts` (legge la scheda), `storico.ts` (legge sedute e progressi), `catalogo.ts` (dall'esercizio del catalogo a quello della persona, e ricerca per nome), `voci.ts` (da riga del database a esercizio) |
| Validazione | `sessione-schema.ts`, `scheda-schema.ts`, `csv.ts` (scrive e legge il CSV delle sedute), `numeri.ts`, `url.ts` |
| Calcoli | `allenamento.ts` (timer, giornata consigliata, carico successivo), `progressi.ts` (volume, peso totale, carico, record), `panoramica.ts` (sedute per settimana, sedute per giornata, kg per gruppo muscolare), `grafico.ts` (assi dei grafici), `formato.ts` (date e numeri in italiano) |
| Tipi e form | `scheda-tipi.ts`, `tipi.ts`, `scheda-form.ts`, `giornate.ts` (da 1 a 7 giornate, sigla della prossima), `categorie.ts` (le otto categorie), `bozza.ts` (la sessione in corso nel browser) |

## Modello dei dati

Lo schema è in `prisma/schema.prisma`:

In ogni tabella l'`id` è la prima colonna.

| Tabella | Colonne, nell'ordine | Id |
|---|---|---|
| `User` | `id`, `fullName`, `username`, `passwordHash`, `email` | numero progressivo |
| `GiornoScheda` | `id`, `userId`, `titolo`, `attiva` | chiave primaria composta (id, userId); coppia unica per persona |
| `Esercizio` | `id`, `userId`, `nome`, `categoria` (una delle otto chiavi, es. `petto`, oppure vuota), `catalogoId` (la voce del catalogo, vuoto per gli esercizi personali di prima) | numero progressivo |
| `CatalogoEsercizio` | `id`, `slug`, `nomeIt`, `nomeEn`, `categoria`, `attrezzatura`, `muscoloPrincipale`, `muscoliSecondari`, `tipoMovimento`, `immagine`, `esecuzione`, `accortezze`, `alias` | numero progressivo; uguale per tutti, non modificabile dall'app |
| `VoceScheda` | `id`, `userId`, `giornoId`, `esercizioId`, `ordine`, `tipo`, `serie`, `ripMin`, `ripMax`, `recuperoSec`, `ripTotali`, `serieMin`, `serieMax`, `nota`, `incrementoKg` | testo casuale |
| `Sessione` | `id`, `userId`, `giornoId`, `data`, `note`, `durataMinuti`, `datiIniziali` | numero progressivo |
| `SerieEseguita` | `id`, `userId`, `sessioneId`, `esercizioId`, `ordine`, `pesoKg`, `ripetizioni` | testo casuale |

Due tabelle servono solo ai codici per email e non hanno dati della scheda:

| Tabella | Colonne, nell'ordine | A cosa serve |
|---|---|---|
| `CodiceEmail` | `id`, `userId`, `scopo` (`email` o `recupero`), `email`, `chiave`, `codiceHash`, `tentativi`, `creatoIl`, `scadeIl` | i codici mandati a chi ha già un account |
| `RegistrazioneSospesa` | `id` (uuid), `fullName`, `username`, `passwordHash`, `email`, `chiave`, `codiceHash`, `tentativi`, `creatoIl`, `scadeIl` | una registrazione in attesa del codice: l'account non esiste ancora |

## Sicurezza

- **Cookie di accesso** `httpOnly`, `SameSite=Lax`, con `Secure` su https, valido fino alla prossima mezzanotte di Roma (l'ora si legge dal fuso di Roma e non da quello del server, che su Vercel è UTC; il cambio tra ora legale e solare avviene di notte, tra le 2 e le 3, quindi non sposta mai la mezzanotte). Contiene l'id dell'utente, la scadenza e un'impronta della sua password, firmati: non può essere modificato per diventare un altro. L'impronta è un HMAC calcolato con `AUTH_SECRET` sull'hash della password: non permette di risalire né all'una né all'altro. A ogni richiesta l'app la confronta con la password che la persona ha adesso (una lettura del database per richiesta): se la password è cambiata, il cookie non vale più. La prima porta (`proxy.ts`) controlla solo firma e scadenza, il confronto con il database lo fanno pagine e azioni.
- **Password** salvate come hash scrypt. Lo stesso messaggio d'errore per utente inesistente e password sbagliata, con una breve pausa, così non si scoprono i nomi esistenti.
- **L'utente si ricava sempre dal cookie**, mai da un id mandato dal browser. Il proxy chiude le pagine, e ogni pagina e ogni azione ricontrolla da sola.
- **Più account nello stesso browser.** Un browser ha un solo cookie di accesso per tutte le sue schede: se in una scheda si entra con un altro account, una scheda rimasta aperta sul primo scriverebbe nel secondo (era un difetto vero: la scheda di una persona finiva in quella di un'altra). Ora ogni pagina che scrive manda l'id dell'account per cui è stata disegnata, e il server **rifiuta** se non coincide con quello del cookie. L'id mandato dalla pagina serve solo a rifiutare: l'account su cui si scrive resta sempre quello del cookie. In pratica, in un browser si usa un account alla volta; per due account insieme servono due browser o una finestra in incognito.
- **Dati ricontrollati sul server** con Zod (date, pesi, ripetizioni, scheda, file CSV).
- **CSV**: ognuno scarica solo le proprie sedute. L'importazione controlla ogni riga (data, peso, ripetizioni, durata, note), la dimensione (massimo 900.000 caratteri), e si ferma al primo errore dicendo il numero di riga, senza importare niente a metà. Nel file esportato i testi che iniziano con `=`, `+`, `-` o `@` hanno un apostrofo davanti, così Excel non li esegue come formule; l'importazione lo toglie.
- **Registrazione aperta a chiunque** conosca l'indirizzo, ma con l'email obbligatoria e confermata con un codice. Ci sono limiti per indirizzo di rete (3 account all'ora, 10 accessi ogni 15 minuti, 5 email di registrazione o di recupero all'ora) tenuti **in memoria**: su Vercel valgono per ogni istanza e rallentano senza bloccare del tutto.
- **Limiti delle email nel database** (valgono per tutti i server e non si azzerano riavviando): 1 email al minuto per scopo, 3 all'ora e 10 al giorno per persona, **3 all'ora per ogni casella di destinazione** (ferma chi vuole riempire di messaggi l'indirizzo di un altro; `nome+1@gmail.com`, `n.ome@gmail.com` e `nome@googlemail.com` contano come la stessa casella) e un **tetto globale di 100 email in 24 ore** (cambia con `EMAIL_LIMITE_GIORNALIERO`). Le email sono gratis, ma il tetto protegge l'account che le spedisce: Google dichiara un massimo di 500 email al giorno e blocca l'invio per 1-24 ore se lo si supera. Se il tetto scatta, registrazione e recupero si fermano.
- **Codici per email**: 6 cifre, valgono 10 minuti, 5 tentativi, uso unico, e un codice nuovo sostituisce il precedente. Nel database c'è solo un HMAC, legato a persona e scopo. Un codice di recupero vale solo se è stato mandato all'indirizzo che l'account ha *in quel momento*: cambiare l'email rende inutili i codici già mandati.
- **Gli indirizzi sono controllati con rigore** (`lib/indirizzo-email.ts`): niente spazi, virgole, virgolette, a capo o più indirizzi. L'indirizzo finisce in un'intestazione del messaggio, quindi un valore con un a capo potrebbe aggiungere destinatari. Un indirizzo insolito ma valido può essere rifiutato: meglio questo che spedire a qualcosa che non si sa leggere.
- **L'email apre la porta all'account**: chi ha accesso alla casella può cambiare la password. Per questo collegarla o cambiarla chiede la password (togliere non si può), e il recupero risponde in modo diverso a "non esiste o senza email" solo per dire subito a chi non ne ha una che da qui non può recuperare nulla.
- **Il messaggio** è solo testo, senza link: non c'è niente da cliccare e niente da falsificare. Il codice non è nell'oggetto, che si vede anche a schermo bloccato.
- **`.env`** escluso da Git.

## Email vere con Gmail

L'invio è in `src/lib/email.ts` e parla con un server SMTP qualunque tramite Nodemailer. Il caso a costo zero è un **account Gmail**; per le email i servizi gratuiti più noti richiedono un dominio proprio (a pagamento), un account Gmail no.

Si può usare il **proprio Gmail personale**: non serve crearne uno apposta. Cosa comporta:

- **Chi si registra vede il tuo indirizzo** come mittente (`GymPulse <tuonome@gmail.com>`), e se risponde alla email la risposta arriva a te.
- **Ogni codice mandato finisce nella tua Posta inviata.**
- **La password per le app non è la password dell'account, ma dà accesso alla tua posta** (Google la accetta per leggere e inviare con programmi esterni). Va trattata come un segreto: se esce, la si revoca dalla pagina di Google e se ne crea un'altra.
- **Il limite di Google (500 email al giorno) è lo stesso della tua posta di tutti i giorni**: l'app si ferma a 100 al giorno (`EMAIL_LIMITE_GIORNALIERO`) proprio per non arrivarci.

Se un giorno questi punti ti pesano, basta cambiare le due variabili con quelle di un altro account: il codice non cambia.

1. Nelle impostazioni del tuo account Google attiva la **verifica in due passaggi**: senza, Google non offre le password per le app.
2. Sempre lì crea una **password per le app**: sono 16 lettere. Google la mostra **una sola volta**; se la perdi se ne crea un'altra, e si revoca quando cambi la password dell'account.
3. Imposta queste variabili. In locale nel `.env`, online **solo nelle variabili di Vercel**:

   ```env
   SMTP_UTENTE="tuonome@gmail.com"           # il tuo indirizzo Gmail: da qui partono i messaggi
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
- *Non so:* se Google blocchi o limiti un account che manda codici di accesso ad altri indirizzi, e se i messaggi finiscano nello spam del destinatario. Con il tuo account personale c'è una differenza in più: se i messaggi venissero segnalati come spam, ne risentirebbe anche la tua posta di tutti i giorni. I messaggi sono di solo testo, senza link e col solo codice, per ridurre il rischio, ma la consegna non l'ho potuta controllare.
- *Mai provato con Gmail vero.* L'invio è stato provato con un trasporto finto (configurazione, mittente, destinatario, gestione degli errori) e con la modalità `console`. Non ho spedito nessuna email reale: il primo invio vero è il primo controllo da fare, mandandolo a te.
- *Il segreto.* `SMTP_PASSWORD` non va nel codice né in Git. Se sospetti che sia uscita, revocala dalla pagina delle password per le app di Google e creane un'altra.

**Per provare in locale senza mandare niente**, usa `EMAIL_PROVIDER="console"` come spiegato più su.

## Pubblicazione online (ultimo passo)

**Perché Neon e non Supabase.** L'app usa funzioni di PostgreSQL (blocchi `pg_advisory_xact_lock`, vincoli `CHECK`, chiavi esterne composte), quindi serve un database Postgres. Dalle pagine dei piani gratuiti: Neon dà 1 GB per progetto, si sospende dopo 5 minuti di inattività e riparte alla prima query, senza carta; Supabase dà 500 MB, **mette in pausa il progetto dopo una settimana di inattività** e non include i backup automatici. Non ho verificato i backup di Neon.

1. **Neon** per il database: progetto con Postgres 17 (come il Docker locale) in una regione europea. Servono due stringhe di connessione: quella **con pooler** (`-pooler` nell'indirizzo) per l'app e quella **diretta** per le migrazioni e per portarci i dati.
2. **I dati**: si porta una copia del database locale con solo il proprio account (vedi sotto), non quello di tutti i giorni.
3. **Vercel** per l'app, collegato al ramo `main`, piano Hobby (gratuito, solo uso personale e non commerciale). Variabili d'ambiente **solo per Production**: `DATABASE_URL` (la stringa con pooler), un `AUTH_SECRET` **nuovo**, diverso da quello locale (almeno 32 caratteri), e le variabili dell'email (`SMTP_UTENTE`, `SMTP_PASSWORD`). Senza queste la registrazione e il recupero restano spenti.
4. **Regione delle funzioni**: per i nuovi progetti Vercel usa Washington (`iad1`); su Hobby se ne sceglie una sola, e conviene quella più vicina al database (in *Settings → Functions*, oppure `regions` in `vercel.json`).
5. **Il ramo `dev` resta spento online**: in *Settings → Build and Deployment → Ignored Build Step* si sceglie "Only build production". Una build annullata conta comunque tra i deploy giornalieri (100 su Hobby).
6. Le credenziali di Neon vanno solo nelle variabili di Vercel e nei comandi che lanci tu, mai nel codice e mai nel `.env`.

**Portare online il database con il solo account `emanuele`** (gli account di prova non servono):

1. Backup del database di tutti i giorni (`gympulse`) con `pg_dump`.
2. Copia in un database nuovo, `gympulse_produzione`.
3. Sulla copia si lancia lo script che toglie gli altri account, i codici email e le registrazioni in attesa. Si ferma se l'account non c'è e se lo si lancia per sbaglio su `gympulse`.
4. `pg_dump` della copia e ripristino su Neon con la stringa diretta. Le migrazioni già applicate viaggiano nel dump (la tabella `_prisma_migrations` è una tabella normale), quindi `db:deploy` su Neon deve dire che non c'è niente da applicare.
5. I file di dump contengono l'hash della password e l'email: restano fuori dal repository e si cancellano a fine lavoro.

Provato su una copia: dopo la pulizia restano solo i dati dell'account, nessuna riga di altri account, e il dump si ripristina in un database vuoto. Non provato: la connessione a Neon vera, e il comportamento di `@prisma/adapter-pg` e dei blocchi `pg_advisory_xact_lock` con il pooler di Neon (la pagina di Neon su Prisma non parla di prepared statements né di PgBouncer).
