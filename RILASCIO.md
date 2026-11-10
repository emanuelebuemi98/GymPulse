# Rilascio di GymPulse: promemoria passo per passo

Per portare una versione nuova online: database su **Neon** e app su **Vercel**.
Scritto per il **Prompt dei comandi** (`cmd`). In PowerShell la sintassi delle variabili è diversa.

**Regole che valgono sempre**
- Le stringhe di connessione di Neon non si incollano mai in chat, nel codice o nel `.env.prod`. Si impostano solo nel terminale, per quella finestra.
- Il database va aggiornato **prima** del codice: il codice nuovo su un database vecchio non funziona.
- Senza un backup che si legge davvero, non si applica nessuna migrazione.
- I backup contengono l'hash della password e l'email: restano in `C:\Backup\gympulse`, fuori dal progetto e da cartelle sincronizzate.

**L'ordine in una riga:** commit e push di `dev` → stringa diretta di Neon → backup → controllo migrazioni → `db:deploy` → `db:catalogo` → merge su `main` → controllo su Vercel.

---

## 0. Prima di cominciare

- [ ] Docker Desktop è acceso (serve per il backup, che usa `pg_dump` versione 18).
- [ ] `git status` non mostra file modificati che non vuoi pubblicare.
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
- [ ] Le migrazioni da applicare sono quelle che ti aspetti (in questo rilascio è **1**: `ruoli_e_palestre`, che aggiunge le colonne `palestra` e `ruolo` a `User` e `modificatoDaId`/`modificatoIl` a `GiornoScheda`. `catalogo_senza_alias` è già stata applicata nel rilascio precedente).

Se il numero è diverso da quello atteso, ci si ferma.

## 5. Applica le migrazioni

Questa migrazione **aggiunge soltanto colonne**: il codice vecchio, ancora online, continua a funzionare sul database nuovo. (Le migrazioni che rinominano colonne o tolgono tabelle, come in passato, possono invece dare errori al sito vecchio per qualche minuto: in quel caso i passi 5, 6, 7 e 9 vanno fatti uno dopo l'altro, senza pause.)

```bat
npm run db:deploy
```

- [ ] Dice che le migrazioni sono state applicate con successo.

## 6. Carica il catalogo, prima in prova

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
- [ ] Gli esercizi collegati al catalogo e il numero di voci nuove sono quelli attesi (nell'ultimo rilascio: 23 collegati, 246 nuovi).

## 7. Carica il catalogo per davvero

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
- [ ] `CODICE_TRAINER`: il codice d'invito per registrarsi come personal trainer, **almeno 12 caratteri**, solo per **Production**. Lo dai tu a chi vuoi come trainer, a voce o in privato; **non va scritto in chat, nel codice o in Git**. Senza, o se è più corto di 12 caratteri, l'opzione «Personal trainer» non compare nella registrazione. Cambiarlo non toglie il ruolo a chi è già trainer. Dopo averlo impostato serve un nuovo deploy.
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
- [ ] **Palestra e trainer**: in Account compare «Palestra e personal trainer» con il menu; la registrazione offre «Utente» e «Personal trainer». Con un account di prova scegli una palestra, entra come trainer di quella palestra e controlla che veda **solo il nome e la scheda**; poi togli la palestra e controlla che la scheda sparisca dall'elenco del trainer.
- [ ] **Recupero password**: arriva davvero l'email col codice? (Da verificare: non so se Gmail consegna da Vercel.)

---

## Se qualcosa va storto

**La build di Vercel fallisce:** niente di grave, il sito resta alla versione precedente. Si legge l'errore nel log del deploy.

**Il sito dà errore dopo il rilascio:** prima si guardano i log del deploy su Vercel. Per tornare alla versione di prima del codice, dal pannello **Deployments** si ripubblica il deploy precedente (Promote to Production / Rollback, i nomi dipendono dal piano).

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
