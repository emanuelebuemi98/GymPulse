# Rilascio di GymPulse: promemoria passo per passo

Per portare una versione nuova online: database su **Neon** e app su **Vercel**.
Scritto per il **Prompt dei comandi** (`cmd`). In PowerShell la sintassi delle variabili è diversa.

**Regole che valgono sempre**
- Le stringhe di connessione di Neon non si incollano mai in chat, nel codice o nel `.env.prod`. Si impostano solo nel terminale, per quella finestra.
- Il database va aggiornato **prima** del codice: il codice nuovo su un database vecchio non funziona.
- Senza un backup che si legge davvero, non si applica nessuna migrazione.
- I backup contengono l'hash della password e l'email: restano in `C:\Backup\gympulse`, fuori dal progetto e da cartelle sincronizzate.

**L'ordine in una riga:** commit e push di `dev` → stringa diretta di Neon → backup → controllo migrazioni → `db:deploy` → `db:catalogo` (solo se il catalogo è cambiato) → merge su `main` → controllo su Vercel.

**In questo rilascio** (personal trainer, palestre, catalogo per categoria, scheda da CSV, note in sessione, eliminazione dell'account): servono **due migrazioni** (solo colonne e un indice), la variabile **`CODICE_TRAINER`** su Vercel e nessun caricamento del catalogo, perché `prisma/dati/catalogo-esercizi.json` e le immagini sono identici a `main` (si controlla con `git diff --stat main..dev -- prisma/dati public`: nessuna riga).

---

## 0. Prima di cominciare

- [ ] Docker Desktop è acceso (serve per il backup, che usa `pg_dump` versione 18).
- [ ] `git status` non mostra file modificati che non vuoi pubblicare, e `git log origin/dev..dev` non elenca commit: tutto quello che vuoi pubblicare è già su GitHub.
- [ ] `npm run typecheck` non dà errori.
- [ ] La cartella `C:\Backup\gympulse` esiste (se no: `mkdir C:\Backup\gympulse`).
- [ ] Hai sotto mano la stringa **diretta** di Neon, quella **senza** `-pooler` nell'indirizzo (dal pannello di Neon o dal tuo `.env.prod`).

## 1. Codice: commit e push di `dev`

Il push su `dev` **non pubblica** niente (il ramo `dev` è spento su Vercel).

```bat
git status
git push origin dev
```

## 2. Neon: imposta la stringa diretta nel terminale

Tutto il blocco Neon (passi 2-8) si fa **nella stessa finestra** del terminale. Le virgolette stanno attorno a tutto, perché la stringa contiene `?` e `&`:

```bat
set "DATABASE_URL=postgresql://UTENTE:PASSWORD@HOST-SENZA-POOLER.neon.tech/neondb?sslmode=require"
```

Sostituisci il valore con la tua stringa. Se chiudi la finestra, la variabile sparisce e va reimpostata.

## 3. Backup del database online

Neon usa **PostgreSQL 18**, mentre il `pg_dump` del tuo contenitore locale è il 17 e si rifiuta ("server version mismatch"). Si usa un contenitore temporaneo `postgres:18`:

```bat
docker run --rm -v C:\Backup\gympulse:/out postgres:18 pg_dump --format=custom --no-owner --file=/out/neon-prima-aggiornamento.dump "%DATABASE_URL%"
dir C:\Backup\gympulse\neon-prima-aggiornamento.dump
docker run --rm -v C:\Backup\gympulse:/out postgres:18 pg_restore --list /out/neon-prima-aggiornamento.dump
```

- [ ] `dir` mostra una dimensione **maggiore di zero** (un file da 0 byte non è un backup: è già successo).
- [ ] `pg_restore --list` elenca le tabelle (`User`, `Esercizio`, `Sessione`, `SerieEseguita`, `VoceScheda`…).

**Se uno dei due non torna, ci si ferma qui.**

## 4. Controlla quali migrazioni mancano

```bat
npx prisma migrate status
```

- [ ] La riga `Datasource "db"` contiene l'indirizzo di Neon (`...neon.tech`), **non** `localhost`.
- [ ] Le migrazioni da applicare sono quelle che ti aspetti. **In questo rilascio sono 2, e solo queste:** `ruoli_e_palestre`, che aggiunge le colonne `palestra` e `ruolo` a `User` e `modificatoDaId`/`modificatoIl` a `GiornoScheda`, e `un_trainer_per_palestra`, che impedisce a due trainer di avere la stessa palestra. `catalogo_senza_alias` è già stata applicata nel rilascio precedente: se invece compare anche lei, nell'elenco ce ne sono 3 e va applicata insieme alle altre, nell'ordine in cui le elenca Prisma).

Se il numero è diverso da quello atteso, ci si ferma.

**Controllo per `un_trainer_per_palestra` — in questo rilascio non serve.** Su Neon non esistono ancora né la colonna `ruolo` né dei trainer, e `db:deploy` applica le due migrazioni una dopo l'altra, quindi l'indice unico nasce su una tabella senza trainer. **Non lanciare questa query adesso**: la colonna `ruolo` non c'è ancora e darebbe errore.

Serve soltanto se `ruoli_e_palestre` fosse già stata applicata da sola e qualcuno si fosse già registrato come trainer prima dell'indice: allora la creazione dell'indice si fermerebbe se due trainer avessero la stessa palestra. In quel caso (non provato su Neon):

```bat
docker run --rm postgres:18 psql "%DATABASE_URL%" -c "SELECT palestra, count(*) FROM \"User\" WHERE ruolo = 'trainer' GROUP BY palestra HAVING count(*) > 1"
```

- [ ] Risponde `(0 rows)`. Se elenca una palestra, si riporta uno dei due trainer a utente (`set NUOVO_RUOLO=utente`, `npm run db:utente`) e si rifà il controllo.

## 5. Applica le migrazioni

Queste migrazioni **aggiungono soltanto colonne e un indice**: il codice vecchio, ancora online, continua a funzionare sul database nuovo (le colonne nuove hanno un valore di partenza e il codice vecchio non le legge). Non c'è quindi una finestra di errori tra la migrazione e la pubblicazione, e per tornare indietro non serve ripristinare il database (vedi «Se qualcosa va storto»). (Le migrazioni che rinominano colonne o tolgono tabelle, come in passato, possono invece dare errori al sito vecchio per qualche minuto: in quel caso i passi 5, 6, 7 e 9 vanno fatti uno dopo l'altro, senza pause.)

```bat
npm run db:deploy
```

- [ ] Dice che le migrazioni sono state applicate con successo (due, nell'ordine: `ruoli_e_palestre`, poi `un_trainer_per_palestra`).

## 6. Carica il catalogo, prima in prova — solo se il catalogo è cambiato

**In questo rilascio si salta (passi 6 e 7)**: il catalogo non è cambiato. Si fa solo quando cambia `prisma/dati/catalogo-esercizi.json`, o quando si aggiungono immagini in `public/esercizi`, o quando una migrazione tocca il catalogo.

`set PROVA=1` si scrive **su una riga da solo**: con `&&` il valore diventerebbe `"1 "` e la prova scriverebbe davvero.

```bat
set PROVA=1
npm run db:catalogo
set PROVA=
```

- [ ] Compare `*** PROVA: non è stato scritto niente ***`.
- [ ] Nessun errore tipo "qualcuno li usa".
- [ ] Immagini trovate: tutte (nell'ultimo rilascio 246 su 246).
- [ ] Gli esercizi personali non riconosciuti sono **0**. Se ne resta qualcuno, ci si ferma: il suo nome non coincide con il nome italiano o inglese di nessuna voce, e va corretto.
- [ ] Gli esercizi collegati al catalogo e il numero di voci nuove sono quelli attesi (la prima volta: 23 collegati e 246 nuovi; a catalogo già caricato e invariato, la prova dice 0 e 0).

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

## 9. Pubblica il codice: merge su `main`

Il push su `main` fa partire la pubblicazione su Vercel.

```bat
git checkout main
git merge dev
git push origin main
git checkout dev
```

## 10. Vercel: cosa controllare

Le impostazioni si fanno una volta sola; a ogni rilascio basta controllare che siano ancora giuste. Pannello del progetto → **Settings**.

**Environment Variables** (solo per **Production**)
- [ ] `DATABASE_URL`: la stringa di Neon **con** pooler (`-pooler` nell'indirizzo).
- [ ] `AUTH_SECRET`: almeno 32 caratteri, **diverso** da quello locale. Cambiarlo chiude tutte le sessioni aperte: non farlo se non serve.
- [ ] `SMTP_UTENTE` e `SMTP_PASSWORD` (la password per le app di Google, 16 lettere, non la password dell'account).
- [ ] Facoltative: `SMTP_HOST`, `SMTP_PORTA`, `EMAIL_LIMITE_GIORNALIERO`.
- [ ] Dopo aver cambiato una variabile serve un nuovo deploy perché abbia effetto.

**Personal trainer (nuovo)**
- [ ] `CODICE_TRAINER` (**nuova, da aggiungere prima del merge**): il codice d'invito per registrarsi come personal trainer, **almeno 12 caratteri**, solo per **Production**. Lo dai tu a chi vuoi come trainer, a voce o in privato; **non va scritto in chat, nel codice o in Git**. Senza, o se è più corto di 12 caratteri, l'opzione «Personal trainer» non compare nella registrazione. Cambiarlo non toglie il ruolo a chi è già trainer. Dopo averlo impostato serve un nuovo deploy: se lo aggiungi **prima** del merge su `main` (passo 9), il deploy del merge lo prende da solo e non ne servono due.
- [ ] **Una palestra, un solo trainer.** Chi si registra per primo con il codice occupa la palestra. Se il codice finisse a una persona sbagliata, potrebbe occupare la palestra di un altro trainer prima di lui: dai il codice solo a chi deve diventare trainer, e cambiarlo su Vercel non toglie il ruolo a chi lo è già. Per liberare una palestra: il trainer elimina il suo account, oppure da terminale `set NUOVO_USERNAME=...` e `set NUOVO_RUOLO=utente`, poi `npm run db:utente`.
- [ ] Il primo trainer: registrati dall'app con il codice, oppure rendi trainer un account esistente da terminale (con le variabili di Neon): `set NUOVO_USERNAME=...` e `set NUOVA_PALESTRA=THE IRON PARADISE`, `set NUOVO_RUOLO=trainer`, poi `npm run db:utente`; la password non cambia se `NUOVA_PASSWORD` è vuota.

**Altre impostazioni**
- [ ] **Git → Production Branch**: `main`.
- [ ] **Build and Deployment → Ignored Build Step**: "Only build production", così `dev` non genera deploy.
- [ ] **Functions → Region**: la più vicina al database (Neon è a Francoforte, quindi `fra1`).

**Dopo il push**
- [ ] **Deployments**: l'ultimo deploy è *Ready*. Se la build fallisce, si apre il log e si legge l'errore.

## 11. Dopo la pubblicazione: controlli

Aprendo l'indirizzo online (meglio anche dal telefono):
- [ ] La pagina iniziale si vede, con le schermate d'esempio e il pulsante sole/luna.
- [ ] `/registrati` si apre (non `/login/registrati`).
- [ ] Accesso con il tuo account: la home mostra le foto degli esercizi di oggi.
- [ ] Scheda, Storico e Progressi si aprono e mostrano i tuoi dati di prima.
- [ ] "Come si fa" apre i passi con l'immagine.
- [ ] Il pulsante sole/luna cambia il tema e dopo il ricaricamento resta.
- [ ] Una sessione di prova: conferma una serie e parte il timer di recupero.
- [ ] "Esci" porta alla presentazione.
- [ ] **Catalogo**: dalla pagina Scheda, «Catalogo degli esercizi» si apre, mostra le nove categorie con le foto e, toccando un esercizio, i passi.
- [ ] **Note in sessione**: apri una sessione e controlla che sotto gli esercizi con una nota compaia «Nota: …».
- [ ] **Scheda da CSV** (non sul tuo account vero: rifà le giornate che compaiono nel file): scarica «La mia scheda» e controlla che il file si apra in Excel con le colonne `giornata;titolo;esercizio;…`. Per provare l'importazione usa un account di prova.
- [ ] **Palestra e trainer**: in Account compare «Palestra e personal trainer» con il menu; la registrazione offre «Utente» e «Personal trainer» (solo se `CODICE_TRAINER` è impostata). Con **due** account di prova: uno utente con una palestra, uno trainer di quella palestra (con il codice). Controlla che il trainer veda **solo il nome e la scheda**, che possa modificarla e che l'utente legga «Modificata da NOME»; poi togli la palestra all'utente e controlla che la scheda sparisca dall'elenco del trainer. Infine prova a registrare un **secondo** trainer per la stessa palestra: deve rispondere «Questa palestra ha già un personal trainer».
- [ ] **Eliminare l'account**: solo con un account di prova creato apposta, mai con il tuo. In Account, «Elimina il mio account» → «Elimina definitivamente» → «Elimina»: torni alla pagina iniziale con «Il tuo account è stato eliminato», e riaccedere con quel nome utente non funziona. Se era il trainer di una palestra, la palestra torna libera.
- [ ] **Pulizia**: elimina gli account di prova creati online (anche loro dall'app, con «Elimina il mio account»).
- [ ] **Recupero password**: arriva davvero l'email col codice? (Da verificare: non so se Gmail consegna da Vercel.)

---

## Se qualcosa va storto

**La build di Vercel fallisce:** niente di grave, il sito resta alla versione precedente. Si legge l'errore nel log del deploy.

**Il sito dà errore dopo il rilascio:** prima si guardano i log del deploy su Vercel. Per tornare alla versione di prima del codice, dal pannello **Deployments** si ripubblica il deploy precedente (Promote to Production / Rollback, i nomi dipendono dal piano).

**Tornare alla versione di prima del codice è sicuro:** le due migrazioni di questo rilascio aggiungono solo colonne e un indice, quindi il codice vecchio funziona anche sul database nuovo e **non serve ripristinare il database**. Basta ripubblicare il deploy precedente da Vercel. I trainer e le palestre già registrati restano nel database, semplicemente la versione vecchia non li usa.

**Riportare il database com'era:** solo in emergenza, perché **cancella tutto quello che è stato scritto dopo il backup**. Provato su una copia locale (migrazioni applicate, poi ripristino: stato identico a prima), **non** provato su Neon. Con `DATABASE_URL` impostata come al passo 2:

```bat
docker run --rm -v C:\Backup\gympulse:/out postgres:18 psql "%DATABASE_URL%" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE" -c "CREATE SCHEMA public"
docker run --rm -v C:\Backup\gympulse:/out postgres:18 pg_restore --no-owner --exit-on-error -d "%DATABASE_URL%" /out/neon-prima-aggiornamento.dump
npx prisma migrate status
```

Dopo il ripristino, `migrate status` deve di nuovo elencare le migrazioni da applicare. Un database ripristinato richiede anche il codice vecchio: si torna alla versione precedente su Vercel, altrimenti il sito non funziona.

---

## Quando non c'è nessuna migrazione

Se il rilascio cambia solo il codice (nessun file nuovo in `prisma/migrations`) e il catalogo non è cambiato, i passi 2-8 si saltano: basta il passo 9 e i controlli del 11. Se è cambiato solo il catalogo (`prisma/dati/catalogo-esercizi.json`), servono i passi 2, 3, 6, 7 e 8.

## Dopo il rilascio

- [ ] Chiudi il terminale (o controlla con `echo %DATABASE_URL%` che sia vuota).
- [ ] Tieni l'ultimo backup finché non sei sicuro che tutto funzioni, poi puoi cancellare i vecchi. Sono in `C:\Backup\gympulse`.
