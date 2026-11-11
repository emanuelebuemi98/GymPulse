# Deploy di GymPulse: promemoria passo per passo

Per portare una versione nuova online: database su **Neon** e app su **Vercel**.
Scritto per il **Prompt dei comandi** (`cmd`). In PowerShell la sintassi delle variabili è diversa.

**Regole che valgono sempre**
- Le stringhe di connessione di Neon non si incollano mai in chat, nel codice né in nessun file del progetto. Si impostano solo nel terminale, per quella finestra.
- Il database va aggiornato **prima** del codice: il codice nuovo su un database vecchio non funziona.
- Senza un backup che si legge davvero, non si applica nessuna migrazione.
- I backup contengono l'hash della password e l'email: vanno in una cartella **fuori dal progetto** (il repository è pubblico) e fuori da cartelle sincronizzate. Mai in Git.

**L'ordine in una riga:** commit e push di `dev` → cosa cambia → stringa diretta di Neon → backup → controllo migrazioni → `db:deploy` → `db:catalogo` (solo se il catalogo è cambiato) → variabili su Vercel → merge su `main` → controllo su Vercel.

Cosa è già stato pubblicato, deploy per deploy, è in `STORICO_RILASCI.md`. I passi qui sotto sono gli stessi a ogni deploy. **Quello che cambia da un deploy all'altro sta tutto in «Cosa cambia in questo deploy» qui sotto**, e si ricava da Git (passo A): non ci sono altri numeri da aggiornare nel resto del file.

---

## Cosa cambia in questo deploy

*Si riscrive a ogni deploy, dopo aver fatto il passo A. Il resto del file non si tocca. Cosa è già stato pubblicato è in `STORICO_RILASCI.md`.*

**Nessun deploy in preparazione.** Quando ce n'è uno, qui si scrive, in poche righe:
- **Migrazioni:** i nomi, e se aggiungono soltanto colonne o indici (il codice vecchio funziona ancora) oppure rinominano o tolgono qualcosa (passi 5-9 di fila).
- **Catalogo:** cambiato o no (passi 6 e 7).
- **Variabili nuove su Vercel:** i nomi (passo 9).
- **Da provare dopo la pubblicazione:** l'elenco delle prove (passo 11).

---

## A. Cosa cambia: lo dice Git

Prima di tutto si guarda cosa c'è da pubblicare. Sono quattro comandi, da lanciare dalla cartella del progetto. Non cambiano niente.

```bat
git fetch origin
git log --oneline origin/main..dev
git diff --name-only origin/main..dev -- prisma/migrations
git diff --stat origin/main..dev -- prisma/dati public
git diff origin/main..dev -U0 -- src prisma | findstr /C:"env."
```

| Comando | Cosa dice | Cosa fare |
|---|---|---|
| `git log …` | I commit che andranno online. | Controlla che ci sia tutto quello che vuoi pubblicare. |
| `git diff --name-only … prisma/migrations` | Le **migrazioni nuove**, una per riga. | Sono quelle che il passo 4 deve elencare. Se non stampa nulla, **non c'è nessuna migrazione**: si saltano i passi 2, 3, 4, 5 e 8. |
| `git diff --stat … prisma/dati public` | Se il **catalogo** o le **immagini** sono cambiati. | Se non stampa nulla, si saltano i passi 6 e 7. |
| `git diff … findstr "env."` | Le righe di codice che leggono **variabili d'ambiente** (`process.env.NOME`) aggiunte o tolte. | Ogni nome nuovo va aggiunto in Vercel (passo 9). Un nome che compare solo tra le righe tolte (`-`) non serve più. |

Il quarto comando non vede le variabili lette in altri modi (per esempio `env.NOME` dentro una funzione): controlla comunque la lista del passo 9.

Poi **riscrivi il riquadro «Cosa cambia in questo deploy»** con quello che hai trovato: così sai sempre cosa stai portando online, e il prossimo deploy parte da un riquadro pulito.

---

## 0. Prima di cominciare

- [ ] Docker Desktop è acceso (serve per il backup, che usa `pg_dump` versione 18).
- [ ] `git status` non mostra file modificati che non vuoi pubblicare, e `git log origin/dev..dev` non elenca commit: tutto quello che vuoi pubblicare è già su GitHub.
- [ ] `npm run typecheck` non dà errori.
- [ ] Hai scelto la cartella dei backup: fuori dal progetto e da cartelle sincronizzate. La indicherai al passo 2.
- [ ] Hai sotto mano la stringa **diretta** di Neon, quella **senza** `-pooler` nell'indirizzo (dal pannello di Neon).
- [ ] Hai fatto il passo **A** e scritto cosa cambia.

## 1. Codice: commit e push di `dev`

Il push su `dev` **non pubblica** niente (il ramo `dev` è spento su Vercel).

```bat
git status
git push origin dev
```

## 2. Neon: imposta la stringa diretta nel terminale

*(Se non ci sono migrazioni né catalogo da caricare, i passi 2-8 si saltano.)*

Tutto il blocco Neon (passi 2-8) si fa **nella stessa finestra** del terminale. Le virgolette stanno attorno a tutto, perché la stringa contiene `?` e `&`:

```bat
set "DATABASE_URL=postgresql://UTENTE:PASSWORD@HOST-SENZA-POOLER.neon.tech/neondb?sslmode=require"
set "CARTELLA_BACKUP=PERCORSO-DELLA-CARTELLA-DEI-BACKUP"
```

Sostituisci i due valori. La seconda riga è la cartella dove metti i backup (vedi il passo 0); se non esiste, creala con `mkdir "%CARTELLA_BACKUP%"`. Se chiudi la finestra, le variabili spariscono e vanno reimpostate.

## 3. Backup del database online

Neon usa **PostgreSQL 18**, mentre il `pg_dump` del tuo contenitore locale è il 17 e si rifiuta ("server version mismatch"). Si usa un contenitore temporaneo `postgres:18`:

```bat
docker run --rm -v "%CARTELLA_BACKUP%":/out postgres:18 pg_dump --format=custom --no-owner --file=/out/neon-prima-aggiornamento.dump "%DATABASE_URL%"
dir "%CARTELLA_BACKUP%\neon-prima-aggiornamento.dump"
docker run --rm -v "%CARTELLA_BACKUP%":/out postgres:18 pg_restore --list /out/neon-prima-aggiornamento.dump
```

- [ ] `dir` mostra una dimensione **maggiore di zero** (un file da 0 byte non è un backup: è già successo).
- [ ] `pg_restore --list` elenca le tabelle (`User`, `Esercizio`, `Sessione`, `SerieEseguita`, `VoceScheda`…).

**Se uno dei due non torna, ci si ferma qui.**

## 4. Controlla quali migrazioni mancano

```bat
npx prisma migrate status
```

- [ ] La riga `Datasource "db"` contiene l'indirizzo di Neon (`...neon.tech`), **non** `localhost`.
- [ ] L'elenco delle migrazioni da applicare **coincide con quello del passo A** (stesso numero, stessi nomi). Se Prisma ne elenca una in più, vuol dire che una migrazione precedente non era mai stata applicata a Neon: va applicata anch'essa, nell'ordine in cui la elenca Prisma, ma prima capisci perché mancava.

Se i due elenchi non coincidono, ci si ferma.

## 5. Applica le migrazioni

Una migrazione che **aggiunge soltanto colonne o indici** non rompe il codice vecchio, ancora online: tra la migrazione e la pubblicazione non c'è una finestra di errori, e per tornare indietro non serve ripristinare il database. Una che **rinomina colonne o toglie tabelle** può dare errori al sito vecchio per qualche minuto: in quel caso i passi 5, 6, 7 e 9 si fanno uno dopo l'altro, senza pause. Il riquadro «Cosa cambia» dice di che tipo sono quelle di questo deploy.

```bat
npm run db:deploy
```

- [ ] Dice che le migrazioni sono state applicate con successo, nell'ordine del passo A.

## 6. Carica il catalogo, prima in prova — solo se il catalogo è cambiato

Si fa solo se il passo A ha mostrato modifiche a `prisma/dati/catalogo-esercizi.json`, o nuove immagini in `public/esercizi`, o una migrazione che tocca il catalogo. Altrimenti si salta (passi 6 e 7).

`set PROVA=1` si scrive **su una riga da solo**: con `&&` il valore diventerebbe `"1 "` e la prova scriverebbe davvero.

```bat
set PROVA=1
npm run db:catalogo
set PROVA=
```

- [ ] Compare `*** PROVA: non è stato scritto niente ***`.
- [ ] Nessun errore tipo "qualcuno li usa".
- [ ] Immagini trovate: tutte (ora sono 246 su 246).
- [ ] Gli esercizi personali non riconosciuti sono **0**. Se ne resta qualcuno, ci si ferma: il suo nome non coincide con il nome italiano o inglese di nessuna voce, e va corretto.
- [ ] Gli esercizi collegati al catalogo e le voci nuove sono quelli che ti aspetti dalle modifiche del passo A (la prima volta: 23 collegati e 246 nuovi; a catalogo già caricato e invariato, la prova dice 0 e 0).

## 7. Carica il catalogo per davvero — solo se il catalogo è cambiato

Se Neon era "addormentato" la prima richiesta può essere lenta. Se va in timeout non scrive niente e si rilancia.

```bat
npm run db:catalogo
```

## 8. Controllo finale e pulizia del terminale

```bat
npx prisma migrate status
set DATABASE_URL=
```

- [ ] Il primo dice che il database è aggiornato.
- [ ] Il secondo toglie la stringa di Neon dal terminale.

## 9. Vercel: variabili e impostazioni, **prima** del merge

Le impostazioni si fanno una volta sola; a ogni deploy basta controllare che siano ancora giuste e aggiungere le **variabili nuove** emerse dal passo A. Pannello del progetto → **Settings**. Una variabile cambiata ha effetto solo con un nuovo deploy: aggiungerla **prima** del merge (passo 10) evita di farne due.

**Environment Variables** (solo per **Production**)
- [ ] `DATABASE_URL`: la stringa di Neon **con** pooler (`-pooler` nell'indirizzo).
- [ ] `AUTH_SECRET`: almeno 32 caratteri, **diverso** da quello locale. Cambiarlo chiude tutte le sessioni aperte: non farlo se non serve.
- [ ] `SMTP_UTENTE` e `SMTP_PASSWORD` (la password per le app di Google, 16 lettere, non la password dell'account).
- [ ] `CODICE_TRAINER`: il codice d'invito per registrarsi come personal trainer, **almeno 12 caratteri**. Lo dai tu a chi vuoi come trainer, a voce o in privato; **non va scritto in chat, nel codice o in Git**. Senza, o se è più corto, l'opzione «Personal trainer» non compare nella registrazione. Cambiarlo non toglie il ruolo a chi è già trainer.
- [ ] Facoltative: `SMTP_HOST`, `SMTP_PORTA`, `EMAIL_LIMITE_GIORNALIERO`.
- [ ] Le variabili **nuove** del passo A sono tutte qui.

**Altre impostazioni**
- [ ] **Git → Production Branch**: `main`.
- [ ] **Build and Deployment → Ignored Build Step**: "Only build production", così `dev` non genera deploy.
- [ ] **Functions → Region**: la più vicina al database (Neon è a Francoforte, quindi `fra1`).

## 10. Pubblica il codice: merge su `main`

Il push su `main` fa partire la pubblicazione su Vercel.

```bat
git checkout main
git merge dev
git push origin main
git checkout dev
```

**Dopo il push**
- [ ] **Deployments**: l'ultimo deploy è *Ready*. Se la build fallisce, si apre il log e si legge l'errore.

## 11. Dopo la pubblicazione: controlli

**Sempre**, aprendo l'indirizzo online (meglio anche dal telefono):
- [ ] La pagina iniziale si vede, con le schermate d'esempio e il pulsante sole/luna.
- [ ] `/registrati` si apre (non `/login/registrati`).
- [ ] Accesso con il tuo account: la home mostra le foto degli esercizi di oggi.
- [ ] Scheda, Storico e Progressi si aprono e mostrano i tuoi dati di prima.
- [ ] "Come si fa" apre i passi con l'immagine.
- [ ] Il pulsante sole/luna cambia il tema e dopo il ricaricamento resta.
- [ ] Una sessione di prova: conferma una serie e parte il timer di recupero.
- [ ] "Esci" porta alla presentazione.
- [ ] **Recupero password**: arriva davvero l'email col codice? (Da verificare: non so se Gmail consegna da Vercel.)

**Solo per le novità di questo deploy**: una riga per ogni cosa elencata nel riquadro «Cosa cambia», con la prova che la funzione si veda e funzioni. Per le funzioni che scrivono o cancellano dati, **si usa un account di prova creato apposta, mai il tuo**, e a fine controllo si elimina (dall'app, con «Elimina il mio account»).

- [ ] *(Le prove di questo deploy: si scrivono qui, una riga per novità, e si cancellano a fine deploy. Per le funzioni che scrivono o cancellano dati, solo con un account di prova.)*

---

## Se qualcosa va storto

**La build di Vercel fallisce:** niente di grave, il sito resta alla versione precedente. Si legge l'errore nel log del deploy.

**Il sito dà errore dopo il deploy:** prima si guardano i log su Vercel. Per tornare alla versione di prima del codice, dal pannello **Deployments** si ripubblica il deploy precedente (Promote to Production / Rollback, i nomi dipendono dal piano).

**Il database dopo un ritorno indietro:** se le migrazioni del deploy aggiungevano solo colonne o indici (lo dice il riquadro «Cosa cambia»), il codice vecchio funziona anche sul database nuovo e **non serve ripristinare il database**: basta ripubblicare il deploy precedente. I dati nuovi restano nel database, semplicemente la versione vecchia non li usa. Se invece una migrazione rinominava colonne o toglieva tabelle, il codice vecchio non funziona più sul database nuovo, e serve il ripristino qui sotto.

**Riportare il database com'era:** solo in emergenza, perché **cancella tutto quello che è stato scritto dopo il backup**. Provato su una copia locale (migrazioni applicate, poi ripristino: stato identico a prima), **non** provato su Neon. Con `DATABASE_URL` e `CARTELLA_BACKUP` impostate come al passo 2:

```bat
docker run --rm postgres:18 psql "%DATABASE_URL%" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE" -c "CREATE SCHEMA public"
docker run --rm -v "%CARTELLA_BACKUP%":/out postgres:18 pg_restore --no-owner --exit-on-error -d "%DATABASE_URL%" /out/neon-prima-aggiornamento.dump
npx prisma migrate status
```

Dopo il ripristino, `migrate status` deve di nuovo elencare le migrazioni da applicare. Un database ripristinato richiede anche il codice vecchio: si torna alla versione precedente su Vercel, altrimenti il sito non funziona.

---

## Quando non c'è nessuna migrazione

Se il passo A non mostra migrazioni e il catalogo non è cambiato, i passi 2-8 si saltano: bastano il passo 9 (variabili, se ce ne sono di nuove), il 10 e i controlli dell'11. Se è cambiato solo il catalogo (`prisma/dati/catalogo-esercizi.json`), servono i passi 2, 3, 6, 7 e 8.

## Dopo il deploy

- [ ] Chiudi il terminale (o controlla con `echo %DATABASE_URL%` che sia vuota). Se lo tieni aperto, `set DATABASE_URL=` e `set CARTELLA_BACKUP=` le svuotano.
- [ ] **Aggiungi una voce a `STORICO_RILASCI.md`** (come si fa è scritto in fondo a quel file), poi **svuota** il riquadro «Cosa cambia in questo deploy» e l'elenco delle prove di questo file, così è pronto per il prossimo.
- [ ] Tieni l'ultimo backup finché non sei sicuro che tutto funzioni, poi puoi cancellare i vecchi (nella cartella dei backup).
