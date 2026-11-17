# Storico dei rilasci di GymPulse

Qui c'è **cosa è stato pubblicato, quando e con quali passi**, rilascio per rilascio. La procedura da seguire è in `DEPLOY.md`; questo file è il registro di quello che è già successo. A ogni rilascio si aggiunge una voce (vedi «Come aggiungere una voce», in fondo).

**Da dove vengono i dati.** Date, commit, migrazioni e catalogo vengono dalla cronologia di Git. Gli esiti dei deploy vengono dagli stati che Vercel scrive su GitHub; sono dati da Vercel in UTC e qui sono convertiti in **ora italiana** (un'ora avanti). Quello che Git non può dire, per esempio cosa è stato eseguito su Neon, c'è solo se è stato detto durante il lavoro e in quel caso è segnato come tale. Dove non si sa, c'è scritto «non registrato».

---

## In breve

| N. | Data | Commit su `main` | Cosa è andato online | Migrazioni su Neon | Deploy su Vercel |
|---|---|---|---|---|---|
| 1 | 2 nov 2026 | `36439bd` | Primo collegamento di Vercel (una prova) | nessuna | 2 falliti, poi riuscito |
| 2 | 8 nov 2026 | `17eda64` | **Primo rilascio vero**: catalogo di 246 esercizi, tema chiaro e scuro, presentazione, registrazione in un passo | 4 | riuscito (e un nuovo deploy il 9 nov) |
| 3 | 10 nov 2026 | `b62c6a5` | Email di qualunque fornitore, catalogo per categoria, scheda da file CSV | 1 | riuscito (e un nuovo deploy l'11 nov) |
| 4 | 11 nov 2026 | `1e6cce2` | **Personal trainer e palestre**, un solo trainer per palestra, eliminazione dell'account, note in sessione | 2 | riuscito |
| 5 | 12 nov 2026 | `f8374da` | **Password visibile**, **cronometro con la durata in secondi**, **scelta della giornata** da fare | 1 | riuscito |
| 6 | 12 nov 2026 | `198e206` | **Salvataggio automatico della scheda**, **serie fisse e serie piramidale**, **superset, triset e gigantset**, un solo tipo di obiettivo | 2 | riuscito |
| 7 | 13 nov 2026 | `41a7179` | **Passaggio a personal trainer dalla pagina Account**, tre esercizi del catalogo sostituiti, stacchi tra le gambe | nessuna | riuscito |
| 8 | 14 nov 2026 | `d621cab` | **Catalogo di 379 esercizi** (133 nuovi), **braccia divise in bicipiti, tricipiti e avambracci** | 1 | riuscito |
| 9 | 15 nov 2026 | `bed8584` | **Numeri del catalogo senza buchi** (le voci 366-380 diventano 365-379) | nessuna | riuscito |
| 10 | 15 nov 2026 | `8312b22` | **Dieci voci del catalogo sistemate** (adduttori e abduttori alla macchina, slanci a quattro zampe, hip thrust con manubrio, stacchi sumo tra le gambe) e `main` e `dev` riallineati | nessuna | riuscito (sei deploy in giornata) |
| 11 | 16 nov 2026 | `854a3b9` | **Catalogo di 451 esercizi** (72 nuovi), **animazioni** nel «Come si fa», **categoria Isometria** | 1 | riuscito |
| 12 | 17 nov 2026 | `018a23e` | **Esercizi a tempo** (isometria con serie e durata, timer con avvio manuale), super serie senza isometria, cardio e riscaldamento, tre schede in più nella pagina iniziale | 1 | riuscito |
| 13 | 17 nov 2026 | `2d0612a` | **Cardio a tratti** (minuti, velocità e pendenza; km e kcal calcolati; peso a ogni seduta) e **quattro voci del catalogo** (182, 185, 190, 193) | 1 | riuscito |

Nei rilasci 2, 3, 4, 5 e 6 il database online (Neon) è stato aggiornato a mano con `db:deploy` (e, solo nel 2, con `db:catalogo`). Il primo caricamento dei dati su Neon non è in Git: si deduce che sia avvenuto tra il 2 e l'8 novembre, perché l'8 Neon aveva già le migrazioni fino a `senza_dati_orologio`. La data non è registrata. Dal rilascio 7 il catalogo cambia a ogni rilascio (tranne il 12) e si carica a mano con `db:catalogo`, ma l'esito di quel passo è registrato solo in parte: per il 7 e l'8 si deduce da una prova su Neon, per il 10 si sa solo che il primo tentativo si è fermato, per il 9, l'11 e il 13 non è registrato. Dei rilasci 7, 9 e 10 non ci sono migrazioni; quella del rilascio 8 risulta applicata dalla stessa prova; per le migrazioni dei rilasci 11, 12 e 13 non è registrato se siano state applicate (per l'11 si deduce di sì dal «funziona tutto»; vedi le singole voci).

---

## Prima della produzione (30 ottobre – 2 novembre)

Versioni portate su `main` quando ancora **non c'erano né Neon né Vercel**: il README di allora dice che la pubblicazione non era fatta e Vercel non registra nessun deploy per questi commit. Servono a capire come è nata l'app e quando sono comparse le migrazioni.

| Data | Commit | Commit nel gruppo | Cosa conteneva | Migrazioni |
|---|---|---|---|---|
| 30 ott | `368cfd2` | 1 | Prima versione | `init` |
| 30 ott | `904eff3` | 1 | Diario A/B/C con sessione, scheda modificabile e backup | `diario_abc` |
| 31 ott | `a7d94f7` | 11 | Account con nome utente e password, dati separati per persona, id numerici, registrazione aperta con limite di tentativi | `login_utente`, `dati_per_utente`, `utente_con_id_numerico`, `tabelle_riordinate` |
| 31 ott | `dbb9a6e` | 7 | Grafici (Recharts) nei progressi, esportazione e importazione delle sedute in CSV, via peso corporeo e calorie | `senza_peso_corporeo` |
| 1 nov | `bf397f0` | 14 | Email dell'utente con codici di conferma e recupero della password, sessione fino a mezzanotte, ripresa dell'allenamento, da 1 a 7 giornate, giornata consigliata che riparte il lunedì, dati dell'orologio (poi tolti) | `dati_orologio`, `codice_recupero`, `email_al_posto_del_telefono`, `giornate_archiviabili` |
| 1 nov | `99d4b77` | 10 | Gruppi muscolari, kg per gruppo e peso totale, recupero nella scheda, rifiuto di salvare nell'account sbagliato con più account nello stesso browser | `muscoli_standard` |
| 2 nov | `b25138b` | 7 | Tolto il collegamento con lo smartwatch, documentazione | `senza_dati_orologio` |
| 2 nov | `d394ef3`, `baf063d`, `36439bd` | 3 | Preparazione di Neon e Vercel, ignorati i file di backup | nessuna |

---

## Rilascio 1 — 2 novembre 2026: primo collegamento di Vercel

- **Commit:** `36439bd`. Il codice è lo stesso del gruppo del 2 novembre qui sopra.
- **Vercel** (ora italiana): 19:47 deploy **fallito**, 19:52 deploy **fallito**, 20:03 deploy **riuscito**. Il motivo dei due fallimenti non è registrato.
- **Neon:** il README dello stesso commit dice che il collegamento a Neon e la pubblicazione non erano ancora fatti. Quindi questo è probabilmente solo un collegamento di prova, senza database online. *Da confermare.*

---

## Rilascio 2 — 8 novembre 2026: primo rilascio vero

- **Commit:** `17eda64` (33 commit dal rilascio 1).
- **Cosa conteneva:**
  - catalogo di **246 esercizi in nove categorie**, con ricerca, filtro e istruzioni «Come si fa»; testi riletti e corretti;
  - **immagini** di tutti gli esercizi (246 file, 200 × 200);
  - **tema chiaro e scuro**, logo e icone, piè di pagina con il nome dell'autore;
  - **pagina iniziale** con le schermate da toccare (dodici), pagina `/registrati`;
  - **registrazione in un solo passo**, senza codice per email;
  - categoria Glutei separata da Gambe; «Come si fa» come pulsante con l'omino; card più ricche in Home, Storico e Scheda;
  - il promemoria dei passi (oggi `DEPLOY.md`).
- **Migrazioni (4):** `catalogo_esercizi`, `categorie_riscaldamento`, `registrazione_senza_codice`, `categoria_glutei`.
- **Catalogo:** caricato con `db:catalogo`. Il promemoria di allora si aspettava **23 esercizi personali collegati e 246 voci nuove**, con 246 immagini trovate su 246.
- **Variabili su Vercel** (solo Production), come da promemoria: `DATABASE_URL` (con pooler), `AUTH_SECRET` diverso da quello locale, `SMTP_UTENTE` e `SMTP_PASSWORD`.
- **Passi eseguiti:** commit e push di `dev`, stringa diretta di Neon, backup, `migrate status`, `db:deploy`, `db:catalogo` (prima in prova), merge su `main`. Dichiarato eseguito durante il lavoro; gli esiti dei singoli passi non sono in Git.
- **Vercel** (ora italiana):
  - 8 nov 20:59, push di `dev`: build **fallita**. Era attesa: la variabile `DATABASE_URL` non era impostata per quell'ambiente.
  - 8 nov 21:06, merge su `main`: deploy **riuscito**.
  - 9 nov 14:15: nuovo deploy **riuscito**. Il motivo non è registrato; è probabile che sia seguito al cambio di regione delle funzioni da Washington a Francoforte (`fra1`). *Da confermare.*
- **Problemi incontrati e come si sono risolti:**
  - **Backup da 0 byte.** Il `pg_dump` del contenitore locale è la versione 17, Neon è la 18: "server version mismatch". Si usa un contenitore `postgres:18` (ora è nel passo 3 di `DEPLOY.md`).
  - **Comandi del promemoria in PowerShell.** Il promemoria è scritto per il Prompt dei comandi (`cmd`): la sintassi di `set` è diversa in PowerShell e dava «La sintassi del nome del file… non è corretta».
  - **Build di `dev` fallita su Vercel.** Si è impostato *Build and Deployment → Ignored Build Step → Only build production*: da allora `dev` non genera build (compare «Canceled by Ignored Build Step»).
- **Non verificato:** l'arrivo del codice di recupero password via email da Vercel (consegna da Gmail).

---

## Rilascio 3 — 10 novembre 2026

- **Commit:** `b62c6a5` (5 commit dal rilascio 2).
- **Cosa conteneva:**
  - registrazione con **email di qualunque fornitore** (iCloud, Outlook, Libero…), non solo Gmail;
  - **catalogo completo per categoria** (`/catalogo`) con foto, e miniature nell'elenco «Aggiungi esercizio»;
  - **scheda da file CSV**: si scarica il catalogo, si tengono le righe che servono, si scrive la lettera della giornata e si importa con un'anteprima;
  - **tolta** l'esportazione e l'importazione delle sedute in CSV;
  - tolta la colonna `alias` del catalogo; pagina iniziale aggiornata.
- **Migrazione (1):** `catalogo_senza_alias`.
- **Catalogo:** sempre 246 voci; il file cambia solo perché si tolgono gli alias di 31 voci. Immagini invariate.
- **Variabili su Vercel:** nessuna nuova.
- **Passi eseguiti:** quelli del promemoria (A–H nella guida del giorno), dichiarati eseguiti. Gli esiti sono nel solo racconto del lavoro.
- **Vercel** (ora italiana):
  - 10 nov 17:00, push di `dev`: **annullata** («Canceled by Ignored Build Step»), com'è voluto;
  - 10 nov 17:08, merge su `main`: deploy **riuscito**;
  - 11 nov 10:49: nuovo deploy **riuscito**, motivo non registrato.
- **Controlli fatti dopo la pubblicazione** (dall'esterno, senza accesso): la pagina iniziale online mostra «La scheda in Excel» e non più «Le sedute in Excel»; `/catalogo` senza accesso porta al login; `/api/scheda-csv` senza accesso risponde 401.
- **Da verificare:** lo stato di Neon rispetto a `catalogo_senza_alias` (dichiarata applicata, ma Git non lo può dire). Al prossimo `npx prisma migrate status`, se questa migrazione compare ancora tra quelle da applicare, va applicata insieme alle altre.

---

## Rilascio 4 — 11 novembre 2026: personal trainer e palestre

- **Commit:** `1e6cce2` (14 commit dal rilascio 3). Il merge è stato un avanzamento semplice: `main` e `dev` sono finiti sullo stesso commit, senza un commit di merge.
- **Cosa conteneva:**
  - **personal trainer e palestre**: registrazione come utente o come trainer con un codice d'invito; l'utente sceglie, se vuole, la palestra e quella scelta è il consenso a far vedere la scheda al trainer; il trainer vede solo il nome e la scheda e la può modificare; «Modificata da NOME, il giorno» sulla giornata cambiata;
  - **un solo trainer per palestra**, anche se due persone si registrano nello stesso istante (indice unico nel database);
  - **eliminazione dell'account** con tutto ciò che contiene (scheda, sedute, serie, storico e progressi), con una finestra di conferma nei colori dell'app;
  - **nota della scheda** visibile sotto ogni esercizio nella sessione di allenamento;
  - pagina Account con profilo, palestra ed email;
  - la pagina iniziale con otto funzioni, e il promemoria dei passi (`DEPLOY.md`) riorganizzato con un riquadro «Cosa cambia».
- **Migrazioni (2):** `ruoli_e_palestre` (colonne `palestra` e `ruolo` su `User`, `modificatoDaId` e `modificatoIl` su `GiornoScheda`) e `un_trainer_per_palestra` (indice unico). Aggiungono solo colonne e un indice: il codice vecchio funziona anche sul database nuovo.
- **Catalogo e immagini:** invariati (passi 6 e 7 saltati).
- **Variabile nuova su Vercel:** `CODICE_TRAINER` (almeno 12 caratteri, solo Production).
- **Passi eseguiti** (dichiarati eseguiti, nessun problema segnalato): backup di Neon con `pg_dump` 18 (file di 88.563 byte, con i dati di tutte e nove le tabelle; salvato alle 11:58), `migrate status`, `db:deploy` con le 2 migrazioni, catalogo saltato, `CODICE_TRAINER` aggiunta su Vercel **prima** del merge, merge su `main`. L'esito scritto di `migrate status` e di `db:deploy` non è registrato.
- **Provato prima del rilascio, in locale e su copie del database:** permessi e privacy del trainer, codice d'invito e limite di tentativi, consenso ritirato con la pagina rimasta aperta, salvataggi simultanei, due registrazioni di trainer insieme per la stessa palestra, eliminazione dell'account (nessuna riga rimasta, gli altri account identici), migrazioni sulle copie. Su Neon sono state applicate per la prima volta in questo rilascio.
- **Vercel** (ora italiana):
  - 11 nov 11:46, push di `dev`: **annullata** («Canceled by Ignored Build Step»), com'è voluto;
  - 11 nov 12:06, merge su `main`: deploy **riuscito** (partito alle 12:06:22, finito alle 12:06:52).
- **Problemi incontrati:** nessuno segnalato.
- **Controlli online del passo 11** (catalogo, note in sessione, trainer e palestre, secondo trainer respinto con «Questa palestra ha già un personal trainer», eliminazione dell'account di prova, scheda da CSV): esito non registrato.

---

## Rilascio 5 — 12 novembre 2026: password visibile, durata e scelta della giornata

- **Commit:** `f8374da` (5 commit dal rilascio 4). Il merge è stato un avanzamento semplice: `main` e `dev` sono finiti sullo stesso commit, senza un commit di merge.
- **Cosa conteneva:**
  - **password visibile**: su accesso, registrazione (password e conferma), recupero, email e codice d'invito del trainer, un pulsante con l'occhio per vedere quello che si scrive; al tocco il campo resta attivo e il testo non si perde;
  - **cronometro della sessione e durata in secondi**: a ogni sessione parte un cronometro, che si vede nella sezione «Durata» in fondo; salvando la seduta la durata si registra da sola, in secondi, e lo storico la mostra in ore, minuti e secondi («1 h 5 min 12 s»). Il campo dei minuti scritti a mano è stato tolto. Non si registra se la seduta è di un altro giorno o se è durata oltre 10 ore;
  - **scelta della giornata**: la home propone la prima giornata non ancora fatta nella settimana; il pulsante «Cambia» nella card «Oggi tocca a» apre l'elenco delle giornate e la card si aggiorna subito, con «consigliata» e «fatta» accanto a ciascuna. Una giornata saltata si lascia semplicemente non fatta; lunedì si riparte dalla prima.
- **Migrazione (1):** `durata_in_secondi`. Aggiunge la colonna `durataSecondi` e riporta in secondi le durate già salvate (minuti × 60). La colonna `durataMinuti` resta dov'è e non viene più scritta: si potrà togliere con una migrazione successiva. Aggiunge soltanto una colonna: il codice vecchio funziona anche sul database nuovo.
- **Catalogo e immagini:** invariati (passi 6 e 7 saltati).
- **Variabili su Vercel:** nessuna nuova.
- **Passi eseguiti** (dichiarati eseguiti, nessun problema segnalato): backup di Neon con `pg_dump` 18 (`neon-prima-durata.dump`), `migrate status`, `db:deploy` con la migrazione, catalogo saltato, merge su `main`. L'esito scritto di `migrate status` e di `db:deploy` non è registrato.
- **Provato prima del rilascio, in locale e su copie del database:** l'occhio con un tocco vero del dito, in chiaro e scuro (il campo resta attivo e il testo non si perde); il cronometro che riparte da dove era dopo un ricaricamento; i secondi che arrivano nel database e nello storico (1 h 5 min 12 s, 48 s); i casi senza durata (più di 10 ore, data passata); la scelta della giornata con sedute della settimana inserite a mano; la migrazione su una copia con durate di 60, 45 e 1 minuto, riportate giuste in secondi.
- **Vercel** (ora italiana):
  - 12 nov 10:37, push di `dev`: **annullata** («Canceled by Ignored Build Step»), com'è voluto;
  - 12 nov 10:49, merge su `main`: deploy **riuscito** (partito alle 10:49:18, finito alle 10:49:38).
- **Problemi incontrati:** nessuno segnalato.
- **Controlli online del passo 11:** dichiarati andati bene ("tutto su"); i singoli esiti non sono registrati.

---

## Rilascio 6 — 12 novembre 2026: scheda salvata da sola, serie piramidale e super serie

- **Commit:** `198e206` (6 commit dal rilascio 5). Il merge è stato un avanzamento semplice: `main` e `dev` sono finiti sullo stesso commit, senza un commit di merge.
- **Cosa conteneva:**
  - **scheda salvata da sola**: mentre si modifica una giornata, le modifiche si salvano nel browser (24 ore); uscendo per sbaglio si ritrovano con l'avviso «Ho ripreso le modifiche che non avevi salvato». «Annulla» chiede conferma se ci sono modifiche, e se la giornata è cambiata nel frattempo (per esempio dal personal trainer) si sceglie tra la scheda attuale e le proprie modifiche;
  - **serie fisse e serie piramidale**: sotto «Ripetizioni» due tasti, all'inizio spenti. **SERIE FISSE**: un minimo e un massimo uguali per tutte le serie. **SERIE PIRAMIDALE**: una ripetizione per ogni serie, a scendere o a salire (12-10-8-6). La scheda mostra «4 × 12-10-8-6», in sessione ogni riga ha le ripetizioni della sua serie e il carico a salire aumenta quando ogni serie ha raggiunto le sue;
  - **superset, triset e gigantset**: il pannello «Super Serie» (in alto, prima dell'elenco) mette insieme da 2 a 10 esercizi da fare senza pausa tra uno e l'altro, con un recupero del gruppo che parte a fine giro. Il nome si ricava dal numero di esercizi (2, 3, 4 o più). In sessione il timer non parte tra un esercizio e l'altro. Funziona anche per il personal trainer sulla scheda dell'allievo, e nel file Excel;
  - **un solo tipo di obiettivo**: «ripetizioni totali» e «serie a scelta» sono tolti; il file Excel li accetta ancora e li legge come 3 × 8-10;
  - il file Excel ha tre colonne in coda (`rip_per_serie`, `gruppo`, `recupero_gruppo_sec`); la pagina iniziale ha una schermata e una funzione nuove.
- **Migrazioni (2):**
  - `ripetizioni_per_serie_e_super_serie`: aggiunge le colonne `ripSerie`, `gruppo` e `recuperoGruppoSec` a `VoceScheda` e due controlli (`VoceScheda_ripSerie`, `VoceScheda_gruppo`). Solo colonne e controlli: il codice vecchio funziona anche sul database nuovo;
  - `un_solo_tipo_di_obiettivo`: **cambia dei valori**. Gli esercizi con i due tipi tolti diventano «serie × ripetizioni» da 3 serie, 8-10 ripetizioni e 90 secondi di recupero (nel database locale erano Jackknife e Sollevamento gambe alla sbarra), e aggiunge il controllo `VoceScheda_tipo` (solo «serie»). Le colonne `ripTotali`, `serieMin` e `serieMax` restano, vuote.
- **Catalogo e immagini:** invariati (passi 6 e 7 saltati).
- **Variabili su Vercel:** nessuna nuova.
- **Passi eseguiti** (dichiarati eseguiti, nessun problema segnalato): backup di Neon con `pg_dump` 18 (`neon-prima-serie.dump`), `migrate status`, `db:deploy` con le 2 migrazioni, catalogo saltato, merge su `main`. L'esito scritto di `migrate status` e di `db:deploy`, e quanti esercizi su Neon avevano i tipi tolti, non sono registrati.
- **Provato prima del rilascio, in locale e su copie del database:** i due tasti spenti all'inizio, che aprono e richiudono i campi; la serie piramidale (campi che seguono il numero di serie, valori che restano, passaggio da un tasto all'altro); superset, triset e gigantset (creazione, sposta il blocco intero o un esercizio dentro il gruppo, scioglimento); il timer che parte solo a giro completo, anche confermando fuori ordine; il personal trainer sulla scheda dell'allievo; la bozza che ritrova i gruppi; un file Excel esportato e reimportato, e uno scritto con i vecchi tipi; la migrazione che converte i due tipi su una copia (e il database che rifiuta un tipo diverso da «serie»).
- **Vercel** (ora italiana):
  - 12 nov 18:16, push di `dev`: **annullata** («Canceled by Ignored Build Step»), com'è voluto;
  - 12 nov 18:24, merge su `main`: deploy **riuscito** (partito alle 18:24:57, finito alle 18:25:18).
- **Problemi incontrati:** nessuno segnalato.
- **Controlli online del passo 11:** dichiarati andati bene ("tutto in prod"); i singoli esiti non sono registrati.

---

## Rilascio 7 — 13 novembre 2026: passaggio a personal trainer dall'Account e catalogo ritoccato

- **Commit:** `41a7179` (4 commit dal rilascio 6). Il merge è stato un avanzamento semplice, senza un commit di merge. Uno dei quattro è la registrazione del rilascio 6 in questo file.
- **Cosa conteneva:**
  - **passaggio da utente a personal trainer** dalla pagina Account: un riquadro «Sei un personal trainer?» (compare solo se `CODICE_TRAINER` è valido) con palestra, codice d'invito e una finestra di conferma che ricorda le conseguenze. Valgono le regole della registrazione come trainer: codice confrontato a tempo costante, una palestra con un solo trainer (il messaggio «già un personal trainer» si vede solo dopo il codice giusto), cinque codici sbagliati all'ora. Il limite ora è condiviso con la registrazione (per indirizzo, e in Account anche per persona). Dal trainer a utente non si torna dall'app, solo da terminale (`NUOVO_RUOLO=utente`);
  - **catalogo**: tre esercizi sostituiti sullo stesso numero (16 «Croci a terra con landmine», 40 «Lat Machine a braccia tese», 95 «Alzate a 90 gradi a un braccio ai cavi»), la foto del 59 aggiornata e i cinque stacchi (64-68) spostati da Dorsali a Gambe, quindi Dorsali 32 e Gambe 39. I kg degli stacchi già fatti passano a Gambe nel grafico per categoria anche per le settimane passate, perché la categoria si legge dall'esercizio;
  - la schermata del catalogo nella pagina iniziale dice «Dorsali 32» (era 37).
- **Migrazioni:** nessuna.
- **Catalogo e immagini:** cambiati (29 righe del file; foto: 3 aggiunte, 3 cancellate, 1 modificata). Serviva `db:catalogo`.
- **Variabili su Vercel:** nessuna nuova (`CODICE_TRAINER` c'era già; ora serve anche in Account).
- **Passi eseguiti:** non dichiarati uno per uno. Dalla prova su Neon fatta per il rilascio 8 si deduce che `db:catalogo` fosse già stato lanciato: quella prova elencava una sola voce da sostituire (la 111) e non le 16, 40 e 95. Backup, esito della prova e del passo: non registrati.
- **Provato prima del rilascio, in locale e su copie del database:** il passaggio a trainer (46 controlli con il codice configurato e 6 senza: un codice sbagliato o una palestra occupata non cambiano niente, il blocco dopo cinque errori vale anche per la registrazione, senza codice il riquadro non c'è); lo script del catalogo con le tre sostituzioni e lo spostamento degli stacchi (lo «Stacco da terra» della copia del database locale, con le sue 6 serie, resta agganciato); typecheck e build.
- **Vercel** (ora italiana):
  - 13 nov 22:53 e 22:57, push di `dev`: **annullate** («Canceled by Ignored Build Step»), com'è voluto;
  - 13 nov 23:14, merge su `main`: deploy **riuscito** (partito alle 23:14:10, finito alle 23:14:34).
- **Problemi incontrati:** nessuno segnalato.
- **Controlli online del passo 11:** non registrati.

---

## Rilascio 8 — 14 novembre 2026: catalogo di 379 esercizi e braccia in tre categorie

- **Commit:** `d621cab` (4 commit dal rilascio 7). Avanzamento semplice.
- **Cosa conteneva:**
  - **133 esercizi nuovi** (numeri 247-380: il 365 mancava, vedi il rilascio 9), con nome, attrezzatura, muscoli, tipo di movimento, «Come si esegue» e accortezze scritti guardando ogni foto. Il catalogo passa da 246 a 379 voci. Per categoria: Petto 59, Dorsali 47, Spalle 72, Bicipiti 36, Tricipiti 41, Avambracci 11, Gambe 39, Glutei 17, Addome 36, Cardio 7, Riscaldamento 14;
  - **«Braccia» divisa in Bicipiti, Tricipiti e Avambracci**: le categorie salgono da nove a undici. Gli avambracci sono le voci 120, 124, 125 e 127 più sette nuove;
  - tre voci già esistenti riscritte sul loro numero: 101 «Curl a martello con manubri da seduto» (nuovo slug, stessa foto), 111 «Curl ai cavi da sdraiati su panca piana» e 131 «Distensione con manubrio a presa stretta», le ultime due con foto e testi diversi da prima;
  - `db:catalogo` ha l'opzione `SOSTITUISCI_IN_USO=1`: se una voce sostituita è usata da qualcuno lo script si ferma senza cambiare niente; con l'opzione la voce cambia sul posto e chi la usa la segue (serie, scheda e storico restano agganciati, cambiano nome e categoria);
  - pagina iniziale e README: 379 esercizi in undici categorie.
- **Migrazioni (1):** `bicipiti_tricipiti_avambracci`: cambia dei valori e i due controlli sulla categoria, non la struttura. Le voci di «braccia» si distribuiscono in base al numero (100-115 bicipiti, 116-135 tricipiti tranne 120, 124, 125 e 127, che sono avambracci); gli esercizi delle persone prendono la categoria della loro voce, e quelli personali che erano «braccia» e non erano collegati restano senza categoria. Il codice di prima non conosce le tre chiavi nuove: tra la migrazione e il deploy gli esercizi delle braccia non sarebbero comparsi sotto nessuna categoria, senza errori (atteso dalle prove, non osservato online).
- **Catalogo e immagini:** cambiati (133 voci nuove, 33 che cambiano solo categoria, 3 riscritte; foto: 134 aggiunte, 1 cancellata, 2 rinominate).
- **Variabili su Vercel:** nessuna nuova (`SOSTITUISCI_IN_USO` è una variabile dello script, sul PC).
- **Passi eseguiti:** dichiarata solo la prova di `db:catalogo` su Neon (output incollato in chat): nessun errore, una sola voce da sostituire (la 111), 379 immagini su 379, 246 voci nel database e 133 nuove, nessun esercizio personale non riconosciuto; due persone avevano la voce 131 e il loro esercizio prendeva il nome nuovo. Dalla prova si deduce che la migrazione fosse già applicata (senza, i valori «bicipiti» e «tricipiti» avrebbero violato i controlli del database). Backup, `migrate status`, `db:deploy`, il passo 7 e i controlli online: non registrati.
- **Provato prima del rilascio, in locale e su copie del database:** migrazione e catalogo uno dopo l'altro (gli esercizi collegati prendono la categoria nuova, serie e scheda restano agganciate, una seconda esecuzione non cambia niente; lo script si ferma se una voce sostituita è usata e passa con `SOSTITUISCI_IN_USO=1`); l'app a 393 punti in chiaro e scuro (56 controlli su 57; l'unico fallito era un falso allarme su un «246» nell'HTML), con le 12 linguette del catalogo, il filtro dell'editor, il grafico dei kg, il file Excel di 379 righe e le 379 foto raggiungibili.
- **Vercel** (ora italiana):
  - 14 nov 18:32, push di `dev`: **annullata**, com'è voluto;
  - 14 nov 18:42, merge su `main`: deploy **riuscito** (partito alle 18:42:49, finito alle 18:43:17).
- **Problemi incontrati:** nessuno segnalato. Un dubbio emerso dopo: l'app mostrava 379 esercizi mentre i numeri arrivavano a 380. Il numero 365 non esisteva (nel primo elenco dei tricipiti si passava dal 364 al 366): è stato chiuso nel rilascio 9.
- **Controlli online del passo 11:** non registrati.

---

## Rilascio 9 — 15 novembre 2026: numeri del catalogo senza buchi

- **Commit:** `bed8584` (1 commit dal rilascio 8). Avanzamento semplice.
- **Cosa conteneva:** le voci 366-380 diventano 365-379 e le loro 15 foto cambiano nome di conseguenza (da `365_…` a `379_…`). I numeri del catalogo vanno ora da 1 a 379 senza salti. Per chi usa l'app non cambia niente di visibile: stesse voci, stessi testi, e gli esercizi delle persone restano agganciati alla stessa voce (il numero si aggiorna a cascata).
- **Migrazioni:** nessuna.
- **Catalogo e immagini:** cambiati (15 numeri nel file, 15 foto rinominate senza altre modifiche).
- **Variabili su Vercel:** nessuna.
- **Passi eseguiti:** non registrati. In particolare **non risulta se `db:catalogo` sia stato lanciato su Neon dopo questo rilascio**: Git non lo dice e nessuno l'ha dichiarato.
- **Provato prima del rilascio, su una copia del database:** partendo dal catalogo vecchio (com'era online) lo script cambia 15 numeri e basta; tre esercizi collegati alle voci 366, 374 e 380 passano a 365, 373 e 379 senza perdere il collegamento; non restano buchi né voci senza foto; una seconda esecuzione non cambia niente. Una serie registrata non è stata provata (l'inserimento di prova falliva): il collegamento si aggiorna a cascata sul numero, come già successo con i numeri spostati nei rilasci precedenti.
- **Vercel** (ora italiana):
  - 15 nov 11:47, push di `dev`: **annullata**, com'è voluto;
  - 15 nov 11:48, merge su `main`: deploy **riuscito** (partito alle 11:48:05, finito alle 11:48:24).
- **Problemi incontrati:** nessuno segnalato.
- **Da verificare:** se Neon ha già i numeri nuovi. Dopo il deploy i file delle foto hanno i numeri nuovi; se `db:catalogo` non è stato lanciato, il database ha ancora quelli vecchi e le 15 voci (otto di tricipiti e sette di avambracci) puntano a file che non esistono più: la loro foto non si vede. Si controlla con la stringa diretta di Neon: `PROVA=1 npm run db:catalogo` (in `cmd`, con `set PROVA=1` su una riga da solo). «Numeri (id) cambiati: 0» vuol dire che c'è già; «15» che `db:catalogo` va ancora lanciato.
- **Controlli online del passo 11:** non registrati.

---

## Rilascio 10 — 15 novembre 2026: dieci voci del catalogo sistemate e rami riallineati

- **Commit:** `8312b22` (15 commit dal rilascio 9, di cui 4 di merge). Quel giorno i deploy riusciti sono stati sei (vedi sotto): `8312b22` è l'ultimo e quello con cui `main` e `dev` sono tornati uguali.
- **Cosa conteneva:**
  - **dieci voci del catalogo** cambiate (103, 137, 148, 162, 177, 178, 241, 242, 243, 244), nessuna nuova: il catalogo resta di 379 voci;
    - 103 «Curl ai cavi alti da alzato» e 148 «Camminata laterale con elastico»: cambia solo il nome italiano;
    - 137 «Abduttori alla macchina»: nuovo slug (`hip-abduction-machine`), nome inglese e foto (quella di prima era in realtà dell'adduzione);
    - 162: «Slanci indietro a quattro zampe su panca» è sostituita da **«Adduttori alla macchina»** (attrezzatura, foto, muscoli e testi nuovi); resta tra i Glutei;
    - 177 e 178 (stacchi sumo): da Glutei a Gambe, quindi Glutei 15 e Gambe 41;
    - 241 «Slanci all'indietro al cavo basso», 242 «Slanci laterali a quattro zampe», 243 e 244 **«Hip Thrust con manubrio»** (era «Frog Pump a terra»): slug, nomi, testi e foto rinominate. Le foto di 242 e 243 erano scambiate e sono state riallineate più volte nella giornata; la scelta definitiva è nel rilascio 11;
  - la foto della voce 171 è cambiata;
  - **`main` e `dev` riallineati:** alle 17:30 circa tre pull request su GitHub (#1 e #3 da `dev`, la #2 da `main`) e un merge finale (`8312b22`) li riportano sullo stesso commit. Il ramo locale `backup-main-prima-del-riallineamento` punta a `787b7e3`. Il motivo del riallineamento non è registrato.
- **Migrazioni:** nessuna.
- **Catalogo e immagini:** cambiati (10 voci nel file; foto: 1 aggiunta, 1 modificata, 7 rinominate, 1 tolta). Serviva `db:catalogo`.
- **Variabili su Vercel:** nessuna.
- **Passi eseguiti:** non registrati nel dettaglio. Dalla conversazione si sa che, dopo il deploy delle 14:30, **online le foto delle voci 137, 162, 241, 242, 243 e 244 non si vedevano** (le vecchie rispondevano 404): Neon aveva ancora i vecchi nomi di file nella colonna `immagine` e i vecchi slug. Il primo `db:catalogo` su Neon (15:02 circa) **si è fermato senza scrivere niente**, com'è voluto: «Questi esercizi non sono più nel file ma qualcuno li usa: Abduttori alla macchina» (la voce 137, collegata a due persone). L'opzione indicata era `SOSTITUISCI_IN_USO=1`; l'esito finale su Neon non è registrato.
- **Provato prima del rilascio:** le voci 137 e 162, su una copia del database. Per le altre modifiche della giornata non c'è una prova registrata.
- **Vercel** (ora italiana), sei deploy riusciti: 14:30 (`25ab224`), 16:24 (`79e69b0`), 16:59 (`e371b65`), 17:31 (pull request #1), 17:32 (pull request #3) e 17:44 (`8312b22`, durato 18 secondi). I push e i merge su `dev` sono stati **annullati** («Canceled by Ignored Build Step»), com'è voluto.
- **Problemi incontrati:**
  - **Foto che non si vedevano in produzione** e glutei 15 invece di 14: il codice era già online, il database di Neon no (vedi «Passi eseguiti»). Le modifiche fatte a mano su Neon con DBeaver (lo slug della 241, la categoria della 162) non erano nel file del catalogo.
  - **Le voci 161 e 174 sono rimaste senza foto** dal 15 novembre alle 17:44 al rilascio 11: le foto erano state rinominate (`161_pistol-squat-to-box.jpg`, `174_ball-wall-squat.jpg`) ma il catalogo aveva ancora i vecchi slug (`pistol-squat`, `wall-sit`). Lo dice il confronto tra il file del catalogo e la cartella delle foto a quel commit; si è chiuso con il rilascio 11.
- **Controlli online del passo 11:** non registrati.

---

## Rilascio 11 — 16 novembre 2026: catalogo di 451 esercizi, animazioni e categoria Isometria

- **Commit:** `854a3b9` (6 commit dal rilascio 10). Avanzamento semplice, senza un commit di merge.
- **Cosa conteneva:**
  - **72 esercizi nuovi** (380-451): 42 di Gambe, 21 di Glutei e 9 di Isometria. Il catalogo passa da 379 a **451 voci**;
  - **categoria «Isometria»**, la dodicesima, con 16 voci: 9 nuove (443-451) e 7 spostate (198 Plank, 199, 200, 201, 212 e 216 da Addome; 229 Corde navali da Riscaldamento). Per categoria: Petto 59, Dorsali 47, Spalle 72, Bicipiti 36, Tricipiti 41, Avambracci 11, Gambe 83, Glutei 36, Addome 30, Isometria 16, Cardio 7, Riscaldamento 13;
  - **animazioni:** colonna `gif` nel catalogo e 405 gif (180 × 180) in `public/gif-esercizi`. Nel «Come si fa» si vede l'animazione al posto della foto; con «riduci animazioni» attivo, o se la gif non si carica, si vede la foto ferma. Le 46 voci senza gif mostrano la foto. `db:catalogo` carica anche le gif;
  - **voci riscritte sullo stesso numero:** 16 «Landmine Press a una mano» (era «Croci a terra con landmine»), 161 «Pistol squat su box», 174 «Squat a muro con palla» (era «Squat isometrico a muro»), 200 «Plank con sollevamento di braccio e gamba» (era «Plank Jacks»). 242 «Slanci indietro a quattro zampe» e 243 «Slanci laterali a quattro zampe» tornano come le foto li mostrano (i dati si scambiano rispetto al rilascio 10);
  - le voci nuove e quelle riscritte sono state controllate contro le animazioni: 84 voci guardate, **6 correzioni su 5 voci** (16, 161, 200, 383 e 399);
  - pagina iniziale, README e `DEPLOY.md` aggiornati a 451 esercizi, dodici categorie e animazioni.
- **Migrazioni (1):** `gif_e_categoria_isometria`. Aggiunge la colonna `gif` al catalogo e ricrea i due controlli sulla categoria con una chiave in più (dodici). Solo colonna e controlli: il codice di prima funziona anche sul database nuovo (non la legge); finché non si pubblica il codice nuovo, le voci di Isometria non compaiono sotto nessuna categoria nel catalogo, senza errori.
- **Catalogo e immagini:** cambiati (72 voci nuove e 12 cambiate; foto: 72 aggiunte, 2 modificate, 4 rinominate; 405 gif aggiunte). Serviva `db:catalogo`, anche per portare le nuove categorie sugli esercizi delle persone.
- **Variabili su Vercel:** nessuna.
- **Passi eseguiti:** non registrati. Dichiarato a deploy fatto, il 16 novembre alle 17:51: «il deploy fatto funziona tutto». Siccome il «Come si fa» legge la colonna `gif` a ogni apertura, **si deduce** che la migrazione fosse già su Neon; l'esito scritto di `migrate status`, `db:deploy` e `db:catalogo` non è registrato.
- **Provato prima del rilascio, su una copia del database:** nell'app a 393 punti, in chiaro e scuro, 23 controlli su 23: le tredici linguette con i numeri del file e «Isometria» con 16 voci, la gif nel «Come si fa» (180 punti, mai più larga), la voce senza gif con la foto, la gif che non si carica con il ripiego sulla foto, «riduci animazioni», il filtro per categoria nell'editor (13 opzioni), il file Excel del catalogo (451 righe) e tutte le foto che rispondono 200.
- **Vercel** (ora italiana):
  - 16 nov 17:47, push di `dev`: **annullata** («Canceled by Ignored Build Step»), com'è voluto;
  - 16 nov 17:49, merge su `main`: deploy **riuscito** (partito alle 17:49:40, finito alle 17:50:02).
- **Problemi incontrati:** `db:catalogo` si è fermato più volte, prima di scrivere, perché in `public/esercizi` c'erano due file per lo stesso slug («Ci sono due file per lo stesso esercizio, tienine uno solo»: 303, 242 e 243). Si è tenuto un file solo. Le foto di 242 e 243 sono state scambiate più volte prima di fissare «242 indietro, 243 laterale».
- **Controlli online del passo 11:** dichiarati andati bene («funziona tutto»); i singoli esiti non sono registrati.

---

## Rilascio 12 — 17 novembre 2026: esercizi a tempo e timer

- **Commit:** `018a23e` (6 commit dal rilascio 11). Avanzamento semplice, senza un commit di merge.
- **Cosa conteneva:**
  - **esercizi a tempo (Isometria):** nella scheda hanno «Tenuta» con serie, durata (la stessa per tutte le serie) e recupero, senza ripetizioni, carico a salire né super serie. Una voce nuova parte da 3 × 30 s con recupero 60 s; una voce di isometria salvata prima (con le ripetizioni) si legge «3 × 30 s» finché non si salva di nuovo;
  - **timer in sessione:** «Avvia · 45 s» fa partire il conto alla rovescia (uno alla volta; lo schermo resta acceso dove il telefono lo permette). A zero suona e vibra, la serie si conferma da sola e parte il recupero. «Ferma» registra i secondi tenuti; il ✓ conferma la durata intera senza timer;
  - **fuori dalle super serie:** isometria, cardio e riscaldamento non compaiono nel pannello «Super Serie»; il server e l'importazione da Excel li rifiutano, e una scheda di prima che li aveva in un gruppo li legge come singoli;
  - **storico e progressi:** la tabella ha la colonna «Tenuta» (in secondi) e i grafici sono «Tenuta più lunga» e «Tempo totale per seduta»; la stima dei minuti di una giornata conta la durata delle tenute;
  - **Excel:** colonna `durata_sec` in coda (18 colonne). Le voci di Isometria del catalogo hanno 3 serie da 30 s e recupero 60, senza ripetizioni; una durata su un esercizio che non è di isometria è un errore chiaro; i file a 17 colonne si importano ancora;
  - **pagina iniziale:** tre schede in più («Esercizi a tempo», «Il timer della tenuta», «Per i personal trainer»), sedici in tutto in righe da quattro, e la voce «Esercizi a tempo» in «Tutto quello che fa» (dieci voci, due per riga).
- **Migrazioni (1):** `isometria_a_tempo`. Aggiunge la colonna `durataSec` a `VoceScheda` e a `SerieEseguita` (vuote) e due controlli: `VoceScheda_durataSec` (da 1 a 3600 secondi, e mai dentro una super serie) e `SerieEseguita_durataSec` (da 1 a 3600, senza peso e con 1 ripetizione). Solo colonne e controlli: nessun dato cambia e il codice di prima funziona anche sul database nuovo.
- **Catalogo e immagini:** invariati (451 voci; nessun file in `prisma/dati` né in `public` è cambiato: passi 6 e 7 saltati).
- **Variabili su Vercel:** nessuna.
- **Passi eseguiti:** non registrati. `db:deploy` andava lanciato su Neon **prima** del merge; Git non dice se è stato fatto.
- **Provato prima del rilascio, su una copia del database:** 48 controlli sulle funzioni pure (validazione di scheda e sessione, lettura delle voci di prima, giro del file Excel); 71 nell'app a 393 punti, in chiaro e scuro (editor, super serie, timer con «Avvia», «Ferma» e ✓, bozza dopo il ricaricamento, salvataggio, storico, progressi, file Excel); 21 sull'importazione da Excel (durata su un esercizio normale rifiutata, isometria e cardio in un superset rifiutati, file a 17 colonne importabile); 25 sulla pagina iniziale. Sulla copia la migrazione ha rifiutato cinque scritture sbagliate (durata 0 e 3601, peso o 8 ripetizioni con una durata, una durata dentro un gruppo). **Non provati:** suono, vibrazione e schermo acceso su un telefono vero (la prova usava Edge senza finestra).
- **Vercel** (ora italiana):
  - 17 nov 11:21, push di `dev`: **annullata** («Canceled by Ignored Build Step»), com'è voluto;
  - 17 nov 11:24, merge su `main`: deploy **riuscito** (partito alle 11:24:26, finito alle 11:24:50).
- **Problemi incontrati:** nessuno segnalato.
- **Controlli online del passo 11:** fatto dall'esterno, senza accesso, il 17 novembre: la pagina iniziale online mostra le sedici schede (comprese «Esercizi a tempo», «Il timer della tenuta» e «Per i personal trainer») e «Catalogo di 451 esercizi». Le prove con l'accesso (scheda, timer, storico, Excel) non sono registrate.
- **Da verificare:** che `isometria_a_tempo` sia applicata a Neon (`npx prisma migrate status` con la stringa diretta). Se mancasse, la scheda online darebbe errore: il codice legge `durataSec` a ogni apertura.

---

## Rilascio 13 — 17 novembre 2026: cardio a tratti con km e calorie, e quattro voci del catalogo

- **Commit:** `2d0612a` (7 commit dal rilascio 12, nessuno di merge). Avanzamento semplice: `main` e `dev` sono finiti sullo stesso commit. Due dei sette sono documentazione (`1de2f32` e `1321f8f`: il secondo registra i rilasci 10, 11 e 12).
- **Cosa conteneva:**
  - **cardio a tratti:** tapis roulant, camminata inclinata, corsa all'aperto, cyclette, ellittica, air bike e stair master non hanno più kg e ripetizioni. In scheda hanno **Tratti** e **Minuti per tratto** e, per le macchine con la velocità, **Velocità (km/h)** e **Pendenza (%)** (la corsa all'aperto non ha la pendenza); niente recupero, carico a salire o super serie. Una voce di cardio salvata prima (3 × 8-10) si legge come 1 tratto da 20 minuti, senza toccare il database;
  - **in sessione:** ogni tratto ha la sua carta con minuti, km/h e pendenza (partono dalla scheda e si cambiano), i battiti medi facoltativi e il suo timer (lo stesso conto alla rovescia delle tenute: a zero suona e il tratto si conferma da solo; «Ferma» registra i minuti fatti). Mentre si scrive si vede «circa X km · Y kcal», e in fondo il totale dei tratti fatti;
  - **km e calorie:** i km sono velocità × minuti ÷ 60. Le calorie sono una **stima** con le equazioni dell'ACSM (sotto i 7 km/h camminata, da 7 in su corsa, con la pendenza), calorie lorde: 80 kg a 10 km/h per 30 minuti fanno 5 km e circa 442 kcal. Il server **ricalcola** km e calorie prima di salvare. Sulle macchine senza velocità si scrivono i km e le kcal del display, facoltativi;
  - **peso a ogni seduta:** il riquadro «Peso di oggi» compare solo se la giornata ha un cardio con la velocità, parte dall'ultimo peso salvato e si salva con la seduta (`Sessione.pesoCorporeoKg`, la colonna tolta a ottobre). Non sta nel profilo e il personal trainer non lo vede. Senza peso si vedono i km ma non le calorie;
  - **storico, progressi, Excel:** il dettaglio ha la tabella Tratto | Durata | Km/h | Km | Kcal con il totale e il peso della seduta, e la card dello storico i km e le kcal totali; nei progressi ci sono «Km per seduta», «Kcal per seduta» e «Tempo totale per seduta». Il file Excel ha 20 colonne (in coda `velocita_kmh` e `inclinazione_pct`) e i file di prima si importano ancora; nel catalogo ogni voce di cardio è 1 tratto da 20 minuti;
  - **catalogo, quattro voci:** la 182 «Camminata a valigia» è sostituita da **«Crunch ai cavi in piedi»**, la 185 «Crunch ai cavi con corda» è rinominata **«Crunch ai cavi in ginocchio»** (stessi testi e stessa foto), la 190 «Deadbug» è sostituita da **«Addominali avanti con disco»** e la 193 **«Hollow Body Hold» passa da Addome a Isometria** (Isometria 17, Addome 29). Due gif sono state sostituite (la 176 e la 212);
  - pagina iniziale, README e `DEPLOY.md` aggiornati con il cardio.
- **Migrazioni (1):** `cardio_a_tratti`. Aggiunge soltanto colonne e controlli: `velocitaKmh` e `inclinazionePct` su `VoceScheda`; `velocitaKmh`, `inclinazionePct`, `km`, `kcal` e `bpm` su `SerieEseguita`; `pesoCorporeoKg` su `Sessione`; i controlli `VoceScheda_velocita`, `SerieEseguita_tratto` e `Sessione_pesoCorporeoKg`. Nessun dato esistente cambia e il codice di prima funziona anche sul database nuovo (non le legge).
- **Catalogo e immagini:** cambiati (4 voci nel file: 182, 185, 190 e 193; foto: 2 aggiunte, 1 rinominata, 2 tolte; gif: 2 sostituite). Serviva `db:catalogo`. Online le tre foto con il nome nuovo (182, 185, 190) si vedono, e quelle con il nome vecchio rispondono 404: se Neon non è stato aggiornato, quelle tre voci restano senza foto.
- **Variabili su Vercel:** nessuna.
- **Passi eseguiti:** non registrati. In particolare **non risulta** se `db:deploy` (la migrazione `cardio_a_tratti`) e `db:catalogo` siano stati lanciati su Neon: Git non lo dice e per questo rilascio nessuno l'ha dichiarato.
- **Provato prima del rilascio, su una copia del database:** 74 controlli sulle funzioni (km e calorie con valori calcolati a mano, validazione di scheda e sessione, lettura delle voci di prima, giro del file Excel); la migrazione applicata alla copia con 29 scritture di prova sui controlli (ogni valore fuori limite rifiutato, ogni valore giusto accettato); 99 controlli nell'app a 393 punti, in chiaro e scuro (editor, sessione con tratti, timer e peso, bozza dopo il ricaricamento, salvataggio, storico, progressi, file Excel, voce di cardio di prima); `db:catalogo` sulla copia con le quattro voci, anche con una persona di prova che aveva la 193 in scheda (il suo esercizio passa a Isometria, la scheda e le serie già fatte restano come erano) e una seconda esecuzione che non cambia niente. **Non provati:** suono, vibrazione e schermo acceso su un telefono vero (la prova usava Edge senza finestra).
- **Vercel** (ora italiana):
  - 17 nov 13:02 e 15:33, push di `dev`: **annullate** («Canceled by Ignored Build Step»), com'è voluto;
  - 17 nov 15:37, merge su `main`: deploy **riuscito** (partito alle 15:37:41, finito alle 15:38:06).
- **Problemi incontrati:** nessuno segnalato.
- **Controlli online del passo 11:** fatti dall'esterno, senza accesso, il 17 novembre: la pagina iniziale online ha «Esercizi a tempo e cardio» e le sedici schede; le tre foto nuove (182, 185, 190) rispondono 200 e le tre vecchie 404. Le prove con l'accesso (scheda, sessione con timer e peso, storico, progressi, Excel) non sono registrate.
- **Da verificare:**
  - che `cardio_a_tratti` sia applicata a Neon (`npx prisma migrate status` con la stringa diretta): se mancasse, la scheda, la sessione e lo storico online darebbero errore, perché il codice legge le colonne nuove a ogni apertura;
  - che `db:catalogo` sia stato lanciato su Neon: senza, le voci 182, 185 e 190 online hanno ancora nome, testi e foto di prima (la foto non si vede) e la 193 è ancora in Addome;
  - la rinomina della voce 213, «Toes to Bar» → «Sollevamento punte dei piedi alla sbarra», è nel commit `568f223` su `dev`, **non ancora pubblicato** (non fa parte del rilascio 13): il database locale (verificato) e Neon (dichiarato) sono già allineati a mano con DBeaver.

---

## Problemi che si ripresentano

- **Backup di Neon:** serve `pg_dump` 18, non quello del Docker locale. Un file da 0 byte non è un backup. La cartella dei backup si indica con la variabile `CARTELLA_BACKUP` (passo 2 di `DEPLOY.md`), e il nome del file con la data in `NOME_BACKUP`: con un nome già usato il backup nuovo sovrascrive quello vecchio.
- **Prompt dei comandi, non PowerShell:** i comandi di `DEPLOY.md` usano la sintassi di `cmd`.
- **`dev` non va compilato su Vercel:** vale l'«Ignored Build Step»; se un giorno compare una build di `dev` fallita per `DATABASE_URL`, è l'impostazione che è saltata.
- **Variabili nuove:** vanno messe in Vercel **prima** del merge su `main`, altrimenti serve un secondo deploy.
- **Mai committare file di backup o di dump** (`.sql`, `.dump`): il repository è pubblico e contengono l'hash delle password e le email. Ora il `.gitignore` li esclude nella cartella principale del progetto, e i backup si tengono in una cartella fuori dal progetto.
- **Lo stato di Neon non si legge da Git:** prima di dare per applicata una migrazione si guarda `npx prisma migrate status` con la stringa diretta.
- **Il catalogo non sta nelle migrazioni:** `db:catalogo` si lancia a mano su Neon e Git non dice se è stato fatto (nei rilasci 7, 8, 9, 10, 11 e 13 l'esito è registrato solo in parte o per niente). Se il passo si dimentica, le voci nuove non compaiono e, se le foto sono state rinominate, quelle del database puntano a file che non esistono più. Si controlla con `PROVA=1 npm run db:catalogo` sulla stringa diretta: «Numeri cambiati: 0», «sostituiti: 0» e «0 nuovi» vogliono dire che Neon è allineato al file. Se una voce sostituita è usata da qualcuno, lo script si ferma senza cambiare niente e si riparte con `SOSTITUISCI_IN_USO=1`.
- **Foto e catalogo si cambiano insieme:** se si rinomina un file in `public/esercizi` senza cambiare lo slug nel file del catalogo (o il contrario), la voce resta senza foto: è successo alle voci 161 e 174 tra il rilascio 10 e l'11. Prima di pubblicare, ogni voce deve avere la sua `numero_slug.jpg` e ogni foto la sua voce (nei rilasci 9, 11 e 12 il controllo dà zero e zero).
- **Il file del catalogo è la fonte:** un cambio fatto a mano nel database (con DBeaver: nome, slug, categoria) non è nel file, e il prossimo `db:catalogo` lo riscrive com'è nel file. Si scrive prima nel file, poi si lancia lo script. Il 15 novembre è successo con la categoria della 155 nel database locale e con la 162 su Neon.
- **Due foto per la stessa voce:** `db:catalogo` si ferma, senza scrivere niente, se in `public/esercizi` ci sono due file con lo stesso slug (303, 242 e 243 il 16 novembre). Se ne tiene uno solo.

---

## Come aggiungere una voce

A rilascio finito, nella sezione «Cosa cambia in questo deploy» di `DEPLOY.md` c'è già quasi tutto. Si copia qui come nuova sezione «Rilascio N — data», in questo ordine, e si svuota il riquadro di `DEPLOY.md`:

1. **Commit** su `main` (`git log --oneline -1 main`, dopo il merge) e quanti ne contiene (`git log --oneline origin/main..dev`, prima del merge).
2. **Cosa conteneva**, in poche righe.
3. **Migrazioni** applicate (`git diff --name-only origin/main..dev -- prisma/migrations`).
4. **Catalogo e immagini**: cambiati o no.
5. **Variabili nuove** su Vercel.
6. **Passi eseguiti** e cosa è andato storto.
7. **Esiti di Vercel**: dal pannello *Deployments*, con l'ora italiana.
8. **Cosa resta da verificare.**

Poi si aggiunge la riga nella tabella «In breve» e si fa un commit `docs:`.
