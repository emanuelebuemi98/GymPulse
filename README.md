# GymPulse

**Il diario di allenamento in palestra.** Ognuno ha il proprio account e la propria scheda, con da 1 a 7 giornate di allenamento a scelta, e chi vuole può condividerla con il personal trainer della propria palestra. In palestra registri ogni serie con kg e ripetizioni, l'app ti suggerisce i valori dell'ultima volta e fa partire il timer di recupero. A casa guardi lo storico e i progressi.

Si usa dal browser del telefono e funziona anche in locale sul PC.

---

## Cosa può fare l'app

| Cosa | Come funziona |
|---|---|
| **Presentazione prima dell'accesso** | La pagina iniziale (`/`) spiega l'app a chi non è ancora entrato: tredici schede piccole (home, giornate, scheda, superset e triset, catalogo per categoria con foto, sessione, "Come si fa", storico, dettaglio di una seduta, andamento, progressi, record, scheda da file Excel) da toccare: si apre la schermata ingrandita, con i pulsanti avanti e indietro (si può anche scorrere col dito o usare le frecce della tastiera) e si chiude con la X, con Esc o toccando fuori, come si usa in tre passi, l'elenco delle funzioni principali e i pulsanti per creare l'account o accedere. Dopo aver eliminato l'account si arriva qui con una riga di conferma. Chi è già entrato viene mandato alla sua home, che sta in `/home`; uscendo con «Esci» si torna alla presentazione. Le immagini degli esercizi si vedono anche qui, quindi `public/esercizi` non è protetta dall'accesso. |
| **Tema chiaro e scuro** | Il pulsante con il sole e la luna in alto a destra (anche nelle pagine di accesso) cambia il tema. La prima volta si parte da quello del telefono; dopo il primo tocco la scelta si ricorda in quel browser (`localStorage`, chiave `gympulse_tema`). I colori si chiamano per ruolo e stanno tutti in `src/app/globals.css`; i grafici li leggono da lì. Tema "Foresta": verde bosco con un punto di lime. |
| **Piè di pagina** | In fondo a tutte le pagine, anche dentro l'app, c'è «App ideata e creata da Emanuele Buemi». Sta nel layout (`PiePagina.tsx`), quindi si cambia in un posto solo. Sotto il piè di pagina resta lo spazio per il timer di recupero, fisso in basso durante la sessione, che altrimenti coprirebbe il nome. |
| **Logo e icone** | Una kettlebell con il battito dentro. Il disegno è in `public/icon.svg`, da cui sono ricavate le icone PNG (192, 512, "maskable" per Android e 180 per la schermata Home di iPhone); il componente `Logo.tsx` lo riusa con i colori del tema. |
| **Account personali** | Ti registri dall'app con nome e cognome, nome utente, **email** e password: sono tutti obbligatori, in un solo modulo e **senza nessun codice da ricopiare**: l'account nasce subito. Va bene l'email di qualunque fornitore (Gmail, iCloud, Outlook, Libero, un dominio proprio): si controlla solo che abbia la forma di un indirizzo vero, e che sia davvero di chi la scrive non si verifica. Ogni persona vede solo i propri dati. |
| **Personal trainer e palestre** | Alla registrazione scegli se essere **Utente** o **Personal trainer**. L'utente può indicare, facoltativamente, la **palestra** a cui appartiene (`NEW LIGHTWEIGHT GYM 24H` o `THE IRON PARADISE`, elenco fisso in `src/lib/palestre.ts`); può cambiarla o toglierla in qualsiasi momento dalla pagina **Account**. **Scegliere la palestra è il consenso**: il personal trainer di quella palestra può **vedere e modificare la sua scheda** (creare giornate, cambiare gli esercizi, anche toglierle) e **solo quella**, intesa come giornate, esercizi, serie, ripetizioni, recuperi, incrementi di carico e note. Del trainer non sono visibili i **kg sollevati**, lo **storico degli allenamenti** (le sedute già fatte), i **grafici**, l'email e il nome utente; dell'utente vede solo il nome completo. La giornata cambiata dal trainer porta «Modificata da NOME, il giorno» e l'utente la può ricambiare come vuole. Il trainer si registra con un **codice d'invito** (variabile `CODICE_TRAINER`) che dà il titolare dell'app: senza, l'opzione «Personal trainer» non compare nemmeno. Chi è già registrato come utente può **passare a personal trainer dalla pagina Account** (riquadro «Sei un personal trainer?»): sceglie la palestra, scrive lo stesso codice e conferma in una finestra che ricorda le conseguenze; il tipo di account, la palestra e il collegamento a «I tuoi allievi» cambiano subito, e la scheda e lo storico restano suoi. Valgono le stesse regole della registrazione (codice giusto, una palestra con un solo trainer, stesso limite di errori) e il riquadro compare solo se il codice è configurato. **Ogni palestra ha un solo personal trainer**: chi si registra con il codice e sceglie una palestra la occupa, e per quella palestra nessun altro può più registrarsi come trainer (messaggio «Questa palestra ha già un personal trainer», mostrato solo dopo il controllo del codice, così chi non ce l'ha non scopre quali palestre sono occupate). La regola sta anche nel database (indice unico parziale `User_un_trainer_per_palestra`), quindi vale pure se due persone si registrano nello stesso istante. La palestra del trainer si sceglie alla registrazione (o quando si passa a trainer da Account) e non si cambia dall'app; **dal trainer a utente non si torna dall'app**, solo da terminale; **si libera** se il trainer elimina il suo account o se lo riporti a utente da terminale (`NUOVO_RUOLO=utente`), e non c'è un modo di "passarla" a un altro trainer. Un utente può scegliere qualunque palestra, anche già occupata. Dalla Home e da Account il trainer apre **I tuoi allievi** (`/trainer`). |
| **Password visibile** | Su accesso, registrazione, recupero ed email, ogni campo password ha un pulsante con l'occhio per vedere quello che scrivi e controllare di non aver sbagliato. Un secondo tocco la nasconde di nuovo. |
| **Recupero della password** | Dalla pagina di accesso ("Password dimenticata?") scrivi il nome utente: arriva un'email con un codice a 6 cifre, valido 10 minuti, e scegli una password nuova. Dalla pagina **Account** l'email si può cambiare (servono la password e un codice di conferma all'indirizzo nuovo) ma **non togliere**, perché serve al recupero. |
| **Eliminare l'account** | Dalla pagina **Account**, in fondo, «Elimina il mio account» cancella **per sempre** l'account e tutto ciò che gli appartiene: la scheda (giornate ed esercizi), le **sedute e le serie** e quindi anche lo **storico, i grafici e i progressi**, che si calcolano da quei dati, più nome, nome utente, email e password. Il pannello dice prima, con i numeri veri, cosa sparisce; poi una **finestra di conferma con i colori dell'app** («Vuoi eliminare definitivamente il tuo account?», con Annulla ed Elimina; niente password, e il focus parte su Annulla) e, dopo, si torna alla pagina iniziale. Si può scaricare prima la propria scheda in CSV. Le bozze di sessioni in corso salvate nel browser di quell'account vengono tolte. Il nome utente si può registrare di nuovo, ma come account nuovo e vuoto. Se a eliminarsi è un **personal trainer**, le schede degli utenti che ha modificato **restano** e sparisce solo il suo nome da «Modificata da». **I backup già fatti non vengono toccati.** Non esiste «annulla». |
| **Riepilogo della giornata** | Nella pagina Scheda, sopra l'elenco, vedi quanti esercizi e serie ha la giornata, **quanto può durare** (una stima: 40 secondi a serie più il recupero previsto) e le categorie che allena. |
| **La tua scheda** | Parti con **una sola giornata vuota (A)** e la riempi dall'app, poi aggiungi le altre col **+**: scegli gli esercizi, serie, ripetizioni (anche a range, es. 6-8), recupero, note e il "carico a salire". Puoi cambiare l'ordine, aggiungere e togliere esercizi quando vuoi. La pagina della giornata mostra per ogni esercizio serie × ripetizioni **e il tempo di recupero**  e l'ultimo carico usato. |
| **Serie fisse e serie piramidale** | Ogni esercizio ha due tasti sotto «Ripetizioni», **SERIE FISSE** e **SERIE PIRAMIDALE**, all'inizio spenti: i campi non si vedono, e una riga dice com'è l'esercizio adesso («Ora: 3 × 8-10 · recupero 90 s»). Toccando un tasto compaiono i suoi campi, sempre in quest'ordine: **Serie**, **Recupero**, poi le ripetizioni; toccandolo di nuovo si richiudono. **Serie fisse**: un minimo e un massimo (**Rip. min**, **Rip. max**) uguali per tutte le serie, per esempio 8 e 10. **Serie piramidale**: una casella per ogni serie (**Rip. 1**, **Rip. 2**…), per esempio 12, 10, 8, 6 (a scendere) o 6, 8, 10, 12 (a salire). La scheda mostra «4 × 12-10-8-6». In sessione ogni riga ha come segnaposto le ripetizioni della sua serie, e il carico a salire aumenta quando **ogni serie** ha raggiunto le sue. Nel database il minimo e il massimo restano scritti, uguali al valore più basso e più alto. È l'**unico tipo di obiettivo**: «Ripetizioni totali» e «Serie a scelta» non ci sono più (gli esercizi che li usavano sono stati portati a «serie × ripetizioni»). |
| **Superset, triset, gigantset** | Dalla pagina di una giornata, **Personalizza → Super Serie**: scegli due o più esercizi e li metti insieme, da fare **uno dopo l'altro senza pausa**. Due esercizi sono un **superset**, tre un **triset**, quattro o più un **gigantset** (fino a dieci); il nome si ricava da solo dal numero di esercizi. Il gruppo ha un suo **recupero**, che parte dopo l'ultimo esercizio di ogni giro. Nell'editor un gruppo è un blocco (barra a sinistra, «Superset · 1/2»): i pulsanti sposta del blocco lo muovono intero, quelli di un esercizio lo scambiano solo dentro il gruppo, e «Sciogli» lo disfa. La scheda, la pagina del trainer e la sessione mostrano lo stesso blocco; in sessione il timer non parte tra un esercizio e l'altro, ma quando tutti hanno confermato la stessa serie. La stima della durata conta il recupero una volta per giro. |
| **Catalogo degli esercizi** | Gli esercizi **non si scrivono più a mano**: si scelgono da un catalogo di **246 esercizi**, diviso in nove categorie (**Petto, Dorsali, Spalle, Braccia, Gambe, Glutei, Addome, Cardio, Riscaldamento**). Nell'elenco «Aggiungi esercizio» si cerca per nome (italiano o inglese, senza badare agli accenti) e si filtra per categoria; ogni riga ha la sua **miniatura**. Il nome italiano è in evidenza e l'inglese, più piccolo, sta sotto. Dalla pagina **Scheda** si apre anche il **Catalogo degli esercizi** (`/catalogo`): tutti gli esercizi divisi per categoria, con foto, ricerca, linguette per categoria e, toccando un esercizio, passi e accortezze. La categoria è quella del catalogo e non si cambia. Il catalogo è nel database (tabella `CatalogoEsercizio`) e si carica dal file `prisma/dati/catalogo-esercizi.json` con `npm run db:catalogo`: per aggiungere un esercizio si aggiunge una voce al file e si rilancia il comando. |
| **Come si fa** | Sotto ogni esercizio, nella scheda e nella sessione, il pulsante **Come si fa** apre i passi dell'esecuzione e le accortezze da avere. I testi li dà il database a richiesta (non viaggiano con la pagina). Sono scritti in italiano, con parole nostre, a partire da pagine italiane lette, da un dataset pubblico inglese tradotto (free-exercise-db, licenza Unlicense) e, per una parte degli esercizi, dalla sola conoscenza generale perché non si è trovata una fonte leggibile. I primi 240 testi sono stati poi riletti e corretti (ortografia, presa «inversa» al posto di «supina», «addome» al posto di «core»), e quelli che erano rimasti di un esercizio sostituito sono stati riscritti. **Non sono consigli di un istruttore**: per i movimenti tecnici e i carichi pesanti c'è sempre l'invito a impararli con un istruttore. Se per l'esercizio c'è un'immagine, compare nel riquadro. |
| **Immagini degli esercizi** | Un'immagine per esercizio, nella cartella `public/esercizi`: JPEG quadrati di **200 × 200** punti con lo sfondo bianco, chiamati con il numero e lo slug dell'esercizio (`35_push-up.jpg`; lo script accetta anche `.png` e `.webp`, e il solo slug o il solo numero). Il numero e lo slug si trovano nel file `prisma/dati/catalogo-esercizi.json`. Per aggiungerne una basta mettere il file nella cartella e rilanciare `npm run db:catalogo`: lo script ritrova i file da solo, segnala i nomi che non corrispondono a nessun esercizio e i doppioni. Nell'app l'immagine compare nel riquadro **Come si fa**, accanto al nome nella scheda, nella sessione, nell'editor, nello storico e nel catalogo, e nelle miniature dell'elenco «Aggiungi esercizio», sempre alla sua grandezza o più piccola (mai ingrandita, perché sfocherebbe). **Controlla i diritti**: il repository è pubblico, quindi le immagini vanno tenute nel repository solo se si ha il permesso di usarle. |
| **Quante giornate vuoi** | Il numero di giornate non è fisso: da **1 a 7**, a seconda di quante volte ti alleni a settimana. Dalla pagina Scheda il **+** aggiunge la giornata successiva (B, C, D, …) e "Togli la giornata" la toglie, finché ne resta una. Togliendo una giornata che ha già sedute registrate, le sedute **non si perdono**: restano nello storico e nei progressi, e la giornata sparisce solo dalla scheda. Vale anche quando a toglierla è il personal trainer. |
| **Sessione di allenamento** | Per ogni serie scrivi kg e ripetizioni e la confermi con ✓. Puoi aggiungere o togliere serie, aggiungere esercizi extra e cambiare la data. Sotto il nome di ogni esercizio compare la **nota della scheda** (scritta da te o dal tuo personal trainer), per ricordare come va eseguito mentre ti alleni; gli esercizi aggiunti a metà sessione non hanno nota. |
| **Valori dell'ultima volta** | Nei campi vedi in grigio i kg e le ripetizioni dell'ultima seduta. Contano solo dopo la conferma: se confermi una serie vuota vale il suggerimento. |
| **Timer di recupero** | Dopo ogni serie parte il conto alla rovescia del recupero previsto dalla scheda (in un superset, un triset o un gigantset parte alla fine del giro, con il recupero del gruppo) (con vibrazione sui telefoni che la supportano). |
| **Suggerimento del carico** | Per gli esercizi con "carico a salire" (es. panca, squat, stacco) l'app propone il peso successivo quando hai completato tutte le ripetizioni previste. |
| **Giornata consigliata** | La home ti dice cosa tocca oggi, con le foto degli esercizi in programma. Propone **la prima giornata che questa settimana non hai ancora fatto** (A → B → C → …): se fai la C prima della B, dopo la C ti propone la B. **Ogni lunedì riparte dalla prima**, anche se la settimana prima non hai finito il giro (le settimane vanno da lunedì a domenica, all'ora di Roma). Con **Cambia**, nella card, scegli un'altra giornata: la card si aggiorna subito, e nell'elenco vedi quali sono già fatte questa settimana. Una giornata che non fai resta semplicemente non fatta: non serve «saltarla». |
| **Bozza che non si perde** | Se chiudi la pagina o il browser, o il telefono si spegne, a metà allenamento, le serie già confermate restano nel browser per 12 ore, **anche se nel frattempo l'accesso è scaduto**. Nella home compare "Riprendi la sessione": tocchi, accedi di nuovo se serve, e ritrovi tutto com'era. Ogni account ha la sua bozza, anche sullo stesso browser. |
| **Scheda che non si perde** | Mentre scrivi o modifichi una giornata della scheda, le modifiche si salvano da sole nel browser (non nel database), per 24 ore. Se esci per sbaglio, il browser si ricarica o il telefono chiude la pagina, riaprendo la stessa giornata le ritrovi, con l'avviso «Ho ripreso le modifiche che non avevi salvato» e un pulsante per ricominciare dalla scheda salvata. **Annulla** chiede conferma se hai modifiche non salvate. Se nel frattempo la giornata è cambiata (per esempio l'ha modificata il tuo personal trainer) la bozza non si applica di nascosto: scegli se usare la scheda attuale o riprendere le tue modifiche. Ogni bozza è legata a chi modifica, alla scheda e alla giornata, quindi un personal trainer non mischia le sue con quelle dell'allievo. |
| **Sessione di accesso** | Vale **fino alla prossima mezzanotte di Roma**: accedi quando inizi ad allenarti e non vieni buttato fuori a metà, anche se un giorno ti alleni alle 17:30 e il giorno dopo alle 18:30. Chiudere il browser per sbaglio non fa uscire. **Cambiando la password (con il recupero) tutte le sessioni aperte, su qualunque dispositivo, si chiudono** e si accede di nuovo con la password nuova. |
| **Storico** | Una card per ogni seduta, con la data, il volume, la durata e le **foto degli esercizi** fatti (le prime quattro, con il conteggio degli altri); dettaglio di ogni seduta; puoi eliminarne una. |
| **Progressi: panoramica** | In cima i tuoi numeri di sempre (sedute, serie fatte, tonnellate sollevate, ore in palestra se registri la durata, altrimenti le settimane di fila). Poi sedute per settimana (le settimane senza sedute ci sono, a zero), **kg per categoria** di una settimana, sedute per giornata e gli ultimi record. |
| **Progressi: per esercizio** | Tre grafici per ogni esercizio: carico massimo, peso totale per seduta e ripetizioni totali per seduta (nelle sedute con ripetizioni non registrate un avviso lo dice). Ogni grafico ha il suggerimento al passaggio del mouse (o con la tastiera) e la tabella dei numeri, e quello del peso totale mostra anche la somma. |
| **Kg per gruppo e peso totale** | I kg di ogni serie si **sommano senza moltiplicare per le ripetizioni**. Nella panoramica la somma è per categoria (le sei con kg: Petto, Dorsali, Spalle, Braccia, Gambe, Glutei; Addome, Cardio e Riscaldamento non ci sono) e si sfoglia una settimana alla volta con le frecce. Passando il mouse su una categoria (con la tastiera: Tab; sul telefono: toccandolo) compaiono i suoi esercizi con il calcolo. Gli esercizi senza categoria (di prima del catalogo) non entrano nelle categorie: i loro kg compaiono a parte, sotto il grafico. |
| **Durata della seduta** | Quando apri una sessione parte un **cronometro**, che vedi in fondo nella sezione **Durata** («Tempo di questa sessione 12:34»), e quando salvi la seduta la durata si registra da sola, **in secondi**: lo storico la mostra in ore, minuti e secondi («1 h 5 min 12 s»). Il conto parte dall'ora di inizio, quindi resta giusto con lo schermo bloccato o dopo un ricaricamento della pagina. Non c'è un campo per scriverla a mano. Non si registra se la seduta è di un altro giorno (il cronometro misura la sessione di oggi) o se è durata oltre 10 ore. Compare nel dettaglio e nell'elenco dello storico, e la somma è nei Progressi («in palestra»). Non c'è nessun collegamento con orologi o altre app. |
| **Scheda in CSV** | Dalla pagina Scheda si scarica il **catalogo completo** in un file Excel (una riga per esercizio, 3 serie da 8-10 ripetizioni, e nella colonna `giornata` il segnaposto `<A/B/C/D/E/F/G>` da sostituire con la lettera della giornata: se resta, l'importazione si ferma e lo dice) oppure la **propria scheda** nello stesso formato. Si cancellano le righe che non servono, si scrive nella colonna `giornata` dove deve andare ogni esercizio (A, B, C…) e si reimporta. Prima di scrivere l'app mostra un'anteprima («A: 8 esercizi → 5») e chiede conferma. Le giornate nel file vengono **rifatte** (i loro esercizi di prima si tolgono), quelle che non compaiono non si toccano; una giornata nuova si crea solo se è la lettera successiva all'ultima. Gli esercizi si ritrovano per nome italiano o inglese; se un nome non si trova non si importa niente. Storico e carichi non cambiano mai. Le sedute già fatte si consultano in Storico e Progressi: non si esportano né si importano. |

---

## Stack tecnologico

| Area | Tecnologia | Versione | Note |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.4.3 | Pagine e backend nello stesso progetto; le modifiche ai dati passano da *server action* |
| Interfaccia | React | 19.3.1 | Libreria per la costruzione dell'interfaccia utente tramite componenti riutilizzabili e gestione dello stato |
| Linguaggio | TypeScript | 7.0.2 | Superset tipizzato di JavaScript; controllo statico dei tipi per un codice più sicuro e manutenibile |
| Stile | Tailwind CSS | 4.3.3 | Font Bricolage Grotesque, tema chiaro e scuro |
| Database | PostgreSQL | 17 in locale, 18 su Neon | Docker in locale; Neon (cloud) online. Per il backup di Neon serve `pg_dump` 18 (vedi `DEPLOY.md`) |
| ORM | Prisma | 7.10.1 | Con driver `pg` 8.23.1 e `@prisma/adapter-pg` 7.10.1 |
| Validazione | Zod | 4.6.7 | I dati arrivati dal browser si ricontrollano sempre sul server |
| Accesso | Scritto nel progetto | — | Cookie firmato (HMAC-SHA256) e password con scrypt, entrambi di Node.js: nessuna libreria in più |
| Grafici | Recharts | 3.10.1 | Linee e barre di una sola serie, in un solo colore (il token `--color-grafico`: blu in chiaro, blu più chiaro in scuro) |
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
| Database | PostgreSQL in Docker sul tuo PC | Neon (cloud) |
| App | `npm run dev` su http://localhost:3000 | Vercel (https://gym-pulse-omega.vercel.app); sul PC `npm run build` e `npm start` |
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

   **Email (recupero della password e cambio dell'indirizzo).** Senza un servizio email configurato il recupero e il cambio dell'indirizzo sono spenti, e l'app lo dice. La registrazione funziona comunque, perché non manda email. Per provare in locale senza mandare nulla aggiungi al `.env`:

   ```env
   EMAIL_PROVIDER="console"
   ```

   Con questa riga l'email non parte: il messaggio, con il codice, compare nel terminale dove gira `npm run dev` (riga `[email:console]`). **Non si accende su Vercel**, dove la variabile `VERCEL` lo impedisce. Per mandare email vere serve un account di posta con SMTP (vedi "Email vere con Gmail" più sotto).

   **Personal trainer (codice d'invito).** Nella registrazione l'opzione «Personal trainer», e in Account il riquadro «Sei un personal trainer?» per chi è già utente, compaiono **solo se** esiste questa variabile; senza, c'è soltanto «Utente». Il valore è il codice che dai a chi vuoi come trainer: almeno 12 caratteri, e se è più corto l'opzione resta spenta.

   ```env
   CODICE_TRAINER="scegli-un-codice-lungo-e-tuo"
   ```

   Dopo averla aggiunta al `.env` **riavvia** `npm run dev`: Next legge le variabili solo all'avvio. Su Vercel si imposta nelle variabili di Production (vedi `DEPLOY.md`). Un utente già registrato può passare a trainer anche da Account, con questo stesso codice. Per rendere trainer un account già esistente senza il codice c'è `npm run db:utente` con `NUOVO_RUOLO=trainer` e `NUOVA_PALESTRA`.

3. **Database**: `docker compose up -d` (ascolta solo su `127.0.0.1:5432`).

4. **Tabelle**: `npm run db:deploy` applica le migrazioni. Quando modifichi lo schema in sviluppo si usa `npm run db:migrate`.

5. **Il primo account**: apri l'app e scegli *Crea account* (la registrazione non manda email: l'account nasce subito). In alternativa, da terminale, senza email, aggiungi al `.env` queste tre righe:

   ```env
   NUOVO_NOME="Nome Cognome"
   NUOVO_USERNAME="nomeutente"
   NUOVA_PASSWORD="almeno 8 caratteri"
   ```

   poi lancia `npm run db:utente` e **toglile dal `.env`**: una password in chiaro non deve restare su disco. Se il nome utente esiste già, lo stesso comando ne cambia la password. Un account creato così **non ha un'email**: la si collega dalla pagina Account (con `EMAIL_PROVIDER="console"` il codice di conferma lo leggi nel terminale), e finché non c'è la password non si recupera con il codice.

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

**Su Vercel** si impostano in *Settings → Environment Variables*: `DATABASE_URL` (Neon, la stringa **con pooler**, quella con `-pooler` nell'indirizzo), `AUTH_SECRET`, le variabili dell'email (`SMTP_UTENTE`, `SMTP_PASSWORD`) e `CODICE_TRAINER` (il codice d'invito dei personal trainer, almeno 12 caratteri). Le migrazioni non partono da sole: si applicano con `db:deploy` dal PC, con `DATABASE_URL` della shell che punta alla stringa **diretta** di Neon (senza `-pooler`), prima di pubblicare una modifica che cambia lo schema. Il promemoria completo, con backup e controlli, è in `DEPLOY.md`; cosa è già stato pubblicato, rilascio per rilascio, è in `STORICO_RILASCI.md`.

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
| `npm run db:utente` | Crea un account, ne cambia la password, la palestra o il ruolo (`NUOVA_PALESTRA`, `NUOVO_RUOLO=trainer`) | per l'account di prova | per recuperare una password in produzione, con le variabili di produzione |
| `npm run db:catalogo` | Carica il catalogo degli esercizi (`prisma/dati/catalogo-esercizi.json`) e collega agli esercizi delle persone quelli con lo stesso nome italiano o inglese. Con `PROVA=1` non scrive niente e mostra cosa cambierebbe | dopo ogni migrazione che tocca il catalogo, e quando se ne modifica il file | con le variabili di produzione, dopo il backup |
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
│   │   ├── 20261108150000_registrazione_senza_codice/ # via la tabella delle registrazioni in attesa del codice
│   │   ├── 20261108180000_categoria_glutei/          # nasce la categoria "glutei", separata da "gambe": nove categorie
│   │   ├── 20261110100000_catalogo_senza_alias/      # via la colonna "alias" dal catalogo
│   │   ├── 20261111100000_ruoli_e_palestre/          # ruolo e palestra degli utenti; chi ha modificato una giornata e quando
│   │   ├── 20261112100000_un_trainer_per_palestra/   # indice unico parziale: un solo personal trainer per palestra
│   │   ├── 20261112200000_durata_in_secondi/         # la durata della seduta in secondi (colonna durataSecondi), riportando le durate già salvate
│   │   ├── 20261113100000_ripetizioni_per_serie_e_super_serie/ # ripSerie, gruppo e recuperoGruppoSec su VoceScheda, con i loro CHECK
│   │   ├── 20261113200000_un_solo_tipo_di_obiettivo/ # «ripetizioni totali» e «serie a scelta» diventano «serie × ripetizioni»; CHECK sul tipo
│   │   └── migration_lock.toml
│   ├── catalogo.ts, immagini.ts                      # script: carica il catalogo (db:catalogo) e ritrova le immagini
│   ├── dati/catalogo-esercizi.json                   # i 246 esercizi del catalogo
│   ├── schema.prisma                                 # modello dei dati
│   └── utente.ts                                     # script: crea un account, cambia password, palestra o ruolo
├── public/
│   ├── icon.svg                                      # logo e icona dell'app (kettlebell con il battito)
│   ├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-icon.png  # icone PNG ricavate dal logo
│   ├── esercizi/                                     # le immagini degli esercizi (200 x 200)
│   └── manifest.webmanifest                          # nome e colori dell'app, se la aggiungi alla schermata Home
├── src/
│   ├── proxy.ts                                      # prima porta: senza accesso si vedono solo presentazione e accesso
│   ├── app/                                          # pagine e route (Next.js App Router)
│   │   ├── layout.tsx                                # intestazione, menu in alto, font
│   │   ├── globals.css                               # colori del tema, chiaro e scuro
│   │   ├── page.tsx                                  # presentazione dell'app, pubblica (chi è dentro va a /home)
│   │   ├── home/page.tsx                             # la home di chi è entrato: cosa tocca oggi
│   │   ├── actions.ts                                # azioni sul server: salva sessione e scheda, elimina, anteprima e importazione della scheda da CSV
│   │   ├── api/
│   │   │   └── scheda-csv/route.ts                   # catalogo e scheda in CSV (?cosa=catalogo o ?cosa=scheda)
│   │   ├── registrati/page.tsx                       # creazione dell'account (utente o personal trainer)
│   │   ├── catalogo/page.tsx                         # il catalogo degli esercizi per categoria
│   │   ├── esercizi/actions.ts                       # legge i passi e le accortezze di un esercizio (a richiesta)
│   │   ├── login/
│   │   │   ├── page.tsx                              # accesso
│   │   │   ├── actions.ts                            # accedi, registrati (utente o trainer), recupera la password, esci
│   │   │   └── recupera/page.tsx                     # password dimenticata
│   │   ├── account/
│   │   │   ├── page.tsx                              # profilo, palestra, passaggio a trainer, email per il recupero, elimina account
│   │   │   ├── palestra.ts                           # sceglie o toglie la palestra (il consenso al trainer)
│   │   │   ├── trainer.ts                            # il passaggio da utente a personal trainer, con il codice d'invito
│   │   │   └── actions.ts                            # email di recupero ed eliminazione dell'account (eliminaAccount)
│   │   ├── trainer/                                  # le pagine del personal trainer
│   │   │   ├── page.tsx                              # I tuoi allievi
│   │   │   ├── actions.ts                            # salva, aggiungi e togli giornata (sempre dopo allievoDelTrainer)
│   │   │   └── [allievoId]/                          # la scheda di un allievo e il suo editor
│   │   │       ├── page.tsx
│   │   │       └── modifica/page.tsx
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
│   │   ├── EditorScheda.tsx                          # modifica di una giornata, con la bozza che non si perde
│   │   ├── GraficoSerie.tsx                          # grafico a linee o a barre (Recharts) con suggerimento e tabella
│   │   ├── DistribuzioneGiornate.tsx                 # barre delle sedute per giornata
│   │   ├── AggiungiGiornata.tsx, RimuoviGiornata.tsx # il "+" e "Togli la giornata" nella pagina Scheda
│   │   ├── SchedeProgressi.tsx                       # scelta tra panoramica e per esercizio
│   │   ├── SelettoreEsercizio.tsx                    # menu per scegliere l'esercizio nei progressi
│   │   ├── TabGiorni.tsx                             # scelta A / B / C
│   │   ├── CardOggi.tsx                              # la card «Oggi tocca a» della home, con «Cambia» per scegliere la giornata
│   │   ├── TempoTrascorso.tsx                        # il cronometro della sessione in corso
│   │   ├── NavSuperiore.tsx                          # menu in alto
│   │   ├── CampoPassword.tsx                         # campo password con il pulsante «occhio» per vederla
│   │   ├── CreaSuperSerie.tsx                        # il pannello «Super Serie»: sceglie gli esercizi e crea superset, triset, gigantset
│   │   ├── FormLogin.tsx, FormRegistrazione.tsx      # moduli di accesso e registrazione (utente o trainer, a un passo)
│   │   ├── FormRecupero.tsx, FormEmail.tsx           # recupero della password e email nell'Account
│   │   ├── FormPalestra.tsx                          # scelta o rimozione della palestra, nell'Account
│   │   ├── FormTrainer.tsx                           # il passaggio a personal trainer (palestra, codice e conferma), nell'Account
│   │   ├── EliminaAccount.tsx                        # pannello «Elimina account» con i numeri di cosa sparisce
│   │   ├── FinestraConferma.tsx                      # finestra di conferma con i colori dell'app (al posto di window.confirm)
│   │   ├── CsvScheda.tsx                             # scarica il catalogo, importa la scheda da CSV con anteprima
│   │   ├── CatalogoCompleto.tsx                      # il catalogo per categoria (pagina /catalogo)
│   │   ├── DettaglioEsercizio.tsx                    # foto, passi e accortezze di un esercizio
│   │   ├── EliminaSessione.tsx                       # pulsante per eliminare una seduta
│   │   ├── ElencoEsercizi.tsx                        # l'elenco «Aggiungi esercizio», con ricerca, categoria e miniature
│   │   ├── ElencoGiornata.tsx                        # gli esercizi di una giornata (con i kg solo per chi è il proprietario)
│   │   ├── ModificataDa.tsx                          # «Modificata da NOME, il giorno»
│   │   ├── ImmagineEsercizio.tsx, IstruzioniEsercizio.tsx, OminoDomanda.tsx # la foto e il riquadro «Come si fa»
│   │   ├── SessioneInCorso.tsx, PesoPerGruppo.tsx    # «Riprendi la sessione» nella home; kg per categoria nei progressi
│   │   ├── Logo.tsx, PiePagina.tsx                   # logo e piè di pagina con il nome dell'autore
│   │   ├── TemaPulsante.tsx                          # il pulsante sole/luna che cambia il tema
│   │   ├── benvenuto/Index.tsx                       # la cornice del telefono e le tredici schermate d'esempio della pagina iniziale
│   │   ├── benvenuto/GalleriaSchermate.tsx           # le quattro schede da toccare e la finestra con la schermata ingrandita
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

Dentro `src/lib/` (40 file):

| Gruppo | File |
|---|---|
| Accesso | `accesso.ts` (chi è l'utente della richiesta, e `allievoDelTrainer`: l'unico punto che dice se un trainer può toccare la scheda di una persona), `sessione-auth.ts` (cookie firmato), `password.ts` (scrypt), `registrazione.ts` (nome e giornate di partenza), `account-eliminazione.ts` (cancella un account con tutti i suoi dati, in una transazione), `limite.ts` (limite di tentativi in memoria), `utente.ts` (dati dell'account e conteggio di cosa contiene), `palestre.ts` (le palestre ammesse), `codice-trainer.ts` (il codice d'invito dei trainer, confronto a tempo costante), `trainer-db.ts` (allievi e trainer di una palestra: solo i nomi) |
| Email | `email.ts` (invio SMTP con Nodemailer), `otp.ts` (codici a 6 cifre, HMAC e testo del messaggio), `codici-email.ts` (i codici nel database, con i limiti), `indirizzo-email.ts` (controllo degli indirizzi, di qualunque fornitore) |
| Dati | `db.ts` (connessione), `scheda-db.ts` (legge la scheda), `storico.ts` (legge sedute e progressi), `catalogo.ts` (dall'esercizio del catalogo a quello della persona, e ricerca per nome), `catalogo-db.ts` (il catalogo intero), `scheda-scrittura.ts` (scrive la scheda di una persona, per lei o per il suo trainer: salva, aggiunge e toglie giornate sotto blocco), `import-scheda.ts` (dal CSV al piano di importazione della scheda), `voci.ts` (da riga del database a esercizio) |
| Validazione | `sessione-schema.ts`, `scheda-schema.ts`, `csv.ts` (regole comuni dei file CSV), `csv-scheda.ts` (scrive e legge il CSV del catalogo e della scheda, con le colonne `rip_per_serie`, `gruppo` e `recupero_gruppo_sec` in coda), `numeri.ts`, `url.ts` |
| Calcoli | `allenamento.ts` (timer di recupero, giornata consigliata, carico successivo), `durata.ts` (secondi da salvare dal cronometro), `progressi.ts` (volume, peso totale, carico, record), `panoramica.ts` (sedute per settimana, sedute per giornata, kg per gruppo muscolare), `grafico.ts` (assi dei grafici), `formato.ts` (date e numeri in italiano) |
| Tipi e form | `scheda-tipi.ts`, `tipi.ts`, `scheda-form.ts`, `giornate.ts` (da 1 a 7 giornate, sigla della prossima), `categorie.ts` (le nove categorie), `tema.ts` (dove si ricorda il tema scelto), `bozza.ts` (la sessione in corso nel browser, e come toglierla quando l'account viene eliminato), `bozza-scheda.ts` (la scheda che si sta scrivendo, nel browser) |

## Modello dei dati

Lo schema è in `prisma/schema.prisma`:

In ogni tabella l'`id` è la prima colonna.

| Tabella | Colonne, nell'ordine | Id |
|---|---|---|
| `User` | `id`, `fullName`, `username`, `passwordHash`, `email`, `palestra` (una di quelle di `palestre.ts`, vuota se non ne ha), `ruolo` (`utente` o `trainer`) | numero progressivo; un trainer ha sempre la palestra (vincolo `User_trainer_palestra`) e per ogni palestra c'è al massimo un trainer (indice unico parziale `User_un_trainer_per_palestra`) |
| `GiornoScheda` | `id`, `userId`, `titolo`, `attiva`, `modificatoDaId`, `modificatoIl` (chi l'ha cambiata per ultimo e quando) | chiave primaria composta (id, userId); coppia unica per persona. `modificatoDaId` punta a `User` con `ON DELETE SET NULL`: se chi l'ha modificata elimina l'account, la giornata resta |
| `Esercizio` | `id`, `userId`, `nome`, `categoria` (una delle nove chiavi, es. `petto`, oppure vuota), `catalogoId` (la voce del catalogo, vuoto per gli esercizi personali di prima) | numero progressivo |
| `CatalogoEsercizio` | `id`, `slug`, `nomeIt`, `nomeEn`, `categoria`, `attrezzatura`, `muscoloPrincipale`, `muscoliSecondari`, `tipoMovimento`, `immagine`, `esecuzione`, `accortezze` | numero progressivo; uguale per tutti, non modificabile dall'app |
| `VoceScheda` | `id`, `userId`, `giornoId`, `esercizioId`, `ordine`, `tipo`, `serie`, `ripMin`, `ripMax`, `recuperoSec`, `nota`, `incrementoKg`, `ripSerie` (le ripetizioni piramidali, una per serie: «12,10,8,6»; vuoto = tra `ripMin` e `ripMax`), `gruppo` e `recuperoGruppoSec` (la super serie e il suo recupero; vuoti per un esercizio singolo) | testo casuale; `tipo` vale sempre `serie` (CHECK `VoceScheda_tipo`); le colonne `ripTotali`, `serieMin` e `serieMax` dei tipi tolti restano nel database, vuote; `ripSerie` e `gruppo` hanno i CHECK `VoceScheda_ripSerie` e `VoceScheda_gruppo` |
| `Sessione` | `id`, `userId`, `giornoId`, `data`, `note`, `durataSecondi`, `durataMinuti`, `datiIniziali` | numero progressivo; la durata si scrive in `durataSecondi`, mentre `durataMinuti` è la colonna di prima: resta per le durate vecchie e non viene più scritta |
| `SerieEseguita` | `id`, `userId`, `sessioneId`, `esercizioId`, `ordine`, `pesoKg`, `ripetizioni` | testo casuale |

Una tabella serve solo ai codici per email e non ha dati della scheda:

| Tabella | Colonne, nell'ordine | A cosa serve |
|---|---|---|
| `CodiceEmail` | `id`, `userId`, `scopo` (`email` o `recupero`), `email`, `chiave`, `codiceHash`, `tentativi`, `creatoIl`, `scadeIl` | i codici mandati a chi ha già un account |

## Sicurezza

- **Cookie di accesso** `httpOnly`, `SameSite=Lax`, con `Secure` su https, valido fino alla prossima mezzanotte di Roma (l'ora si legge dal fuso di Roma e non da quello del server, che su Vercel è UTC; il cambio tra ora legale e solare avviene di notte, tra le 2 e le 3, quindi non sposta mai la mezzanotte). Contiene l'id dell'utente, la scadenza e un'impronta della sua password, firmati: non può essere modificato per diventare un altro. L'impronta è un HMAC calcolato con `AUTH_SECRET` sull'hash della password: non permette di risalire né all'una né all'altro. A ogni richiesta l'app la confronta con la password che la persona ha adesso (una lettura del database per richiesta): se la password è cambiata, il cookie non vale più. La prima porta (`proxy.ts`) controlla solo firma e scadenza, il confronto con il database lo fanno pagine e azioni.
- **Password** salvate come hash scrypt. Lo stesso messaggio d'errore per utente inesistente e password sbagliata, con una breve pausa, così non si scoprono i nomi esistenti.
- **L'utente si ricava sempre dal cookie**, mai da un id mandato dal browser. Il proxy chiude le pagine, e ogni pagina e ogni azione ricontrolla da sola.
- **Più account nello stesso browser.** Un browser ha un solo cookie di accesso per tutte le sue schede: se in una scheda si entra con un altro account, una scheda rimasta aperta sul primo scriverebbe nel secondo (era un difetto vero: la scheda di una persona finiva in quella di un'altra). Ora ogni pagina che scrive manda l'id dell'account per cui è stata disegnata, e il server **rifiuta** se non coincide con quello del cookie. L'id mandato dalla pagina serve solo a rifiutare: l'account su cui si scrive resta sempre quello del cookie. In pratica, in un browser si usa un account alla volta; per due account insieme servono due browser o una finestra in incognito.
- **Eliminare l'account** non chiede la password, solo una finestra di conferma (la nostra, `FinestraConferma`; il resto dell'app usa ancora `window.confirm`): chi avesse rubato il cookie di accesso di una persona potrebbe quindi cancellarne l'account. È una scelta di comodità, fatta di proposito; se non ti basta, il costo è un campo password in più (come per cambiare l'email). La cancellazione è in una transazione sola e con il blocco per persona; dopo, ogni cookie ancora in giro smette di valere perché l'utente non esiste più. I backup non si toccano.
- **Personal trainer: un solo punto decide.** `allievoDelTrainer` (in `lib/accesso.ts`) dice se un trainer può toccare la scheda di una persona: serve che chi chiede sia trainer, che la persona sia un utente (non un trainer, non lui stesso) e che abbia scelto la stessa palestra. Lo usano **ogni pagina e ogni azione** del trainer, a ogni richiesta e mai fidandosi di un id arrivato dal browser: se la persona toglie la palestra, la richiesta successiva viene rifiutata anche da una pagina rimasta aperta. Le pagine del trainer non leggono nemmeno dal database i kg, lo storico, l'email o il nome utente. Se due persone modificano la stessa giornata insieme, la seconda riceve «La scheda è stata modificata da NOME» e non sovrascrive. Il codice d'invito si confronta a tempo costante (HMAC e `timingSafeEqual`), con un limite di cinque tentativi sbagliati all'ora, lo stesso per la registrazione e per il passaggio da Account (per indirizzo, e in Account anche per persona; in memoria, per istanza su Vercel: rallenta e non blocca del tutto, la sicurezza vera è la lunghezza del codice).
- **Dati ricontrollati sul server** con Zod (date, pesi, ripetizioni, scheda, file CSV).
- **CSV**: ognuno scarica solo la propria scheda (il catalogo è uguale per tutti, ma serve l'accesso). La scheda da CSV si importa in una sola transazione, con un blocco per persona, dopo un'anteprima: l'importazione controlla ogni riga (giornata, nome dell'esercizio, numeri; il segnaposto `<A/B/C/D/E/F/G>` lasciato al posto della lettera ferma l'importazione), la dimensione (massimo 900.000 caratteri), e si ferma al primo errore dicendo il numero di riga, senza importare niente a metà. Nel file i testi che iniziano con `=`, `+`, `-` o `@` hanno un apostrofo davanti, così Excel non li esegue come formule; l'importazione lo toglie.
- **Registrazione aperta a chiunque** conosca l'indirizzo, con l'email obbligatoria (di qualunque fornitore) ma **non confermata**: si controlla solo la forma, e un indirizzo sbagliato rende la password non recuperabile mentre uno altrui può ricevere codici di recupero che non ha chiesto (al massimo 3 all'ora, vedi sotto). Nessuno entra nell'account di un altro per questo: il codice arriva alla casella scritta, non a chi lo chiede. Ci sono limiti per indirizzo di rete (3 account all'ora, 10 accessi ogni 15 minuti, 5 email di recupero all'ora) tenuti **in memoria**: su Vercel valgono per ogni istanza e rallentano senza bloccare del tutto.
- **Limiti delle email nel database** (valgono per tutti i server e non si azzerano riavviando): 1 email al minuto per scopo, 3 all'ora e 10 al giorno per persona, **3 all'ora per ogni casella di destinazione** (ferma chi vuole riempire di messaggi l'indirizzo di un altro; `nome+1@gmail.com`, `n.ome@gmail.com` e `nome@googlemail.com` contano come la stessa casella) e un **tetto globale di 100 email in 24 ore** (cambia con `EMAIL_LIMITE_GIORNALIERO`). Le email sono gratis, ma il tetto protegge l'account che le spedisce: Google dichiara un massimo di 500 email al giorno e blocca l'invio per 1-24 ore se lo si supera. Se il tetto scatta, il recupero e il cambio dell'indirizzo si fermano.
- **Codici per email**: 6 cifre, valgono 10 minuti, 5 tentativi, uso unico, e un codice nuovo sostituisce il precedente. Nel database c'è solo un HMAC, legato a persona e scopo. Un codice di recupero vale solo se è stato mandato all'indirizzo che l'account ha *in quel momento*: cambiare l'email rende inutili i codici già mandati.
- **Gli indirizzi sono controllati con rigore** (`lib/indirizzo-email.ts`): niente spazi, virgole, virgolette, a capo o più indirizzi. L'indirizzo finisce in un'intestazione del messaggio, quindi un valore con un a capo potrebbe aggiungere destinatari. Un indirizzo insolito ma valido può essere rifiutato: meglio questo che spedire a qualcosa che non si sa leggere.
- **L'email apre la porta all'account**: chi ha accesso alla casella può cambiare la password. Per questo collegarla o cambiarla chiede la password (togliere non si può), e il recupero risponde in modo diverso a "non esiste o senza email" solo per dire subito a chi non ne ha una che da qui non può recuperare nulla.
- **Il messaggio** è solo testo, senza link: non c'è niente da cliccare e niente da falsificare. Il codice non è nell'oggetto, che si vede anche a schermo bloccato.
- **`.env`** escluso da Git.

## Email vere con Gmail

L'invio è in `src/lib/email.ts` e parla con un server SMTP qualunque tramite Nodemailer. Il caso a costo zero è un **account Gmail**; per le email i servizi gratuiti più noti richiedono un dominio proprio (a pagamento), un account Gmail no.

Si può usare il **proprio Gmail personale**: non serve crearne uno apposta. Cosa comporta:

- **Chi chiede un codice (recupero o cambio email) vede il tuo indirizzo** (quello da cui spedisci, non il suo) come mittente (`GymPulse <tuonome@gmail.com>`), e se risponde alla email la risposta arriva a te.
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

4. Se manca qualcosa, o è scritto male, l'invio resta spento e l'app lo dice (nelle pagine di recupero e Account) invece di fallire a metà. Nel log del server compare il motivo, senza mai l'indirizzo né il codice.

**Cosa ho verificato e cosa no.** Le prime due righe vengono dalle pagine di Google lette durante il lavoro:

- *Letto:* il server SMTP di Gmail è `smtp.gmail.com`, porta 587 con TLS, nome utente = l'indirizzo email, autenticazione obbligatoria.
- *Letto:* Google dichiara un massimo di 500 email al giorno per account e, se si supera, blocca l'invio per 1-24 ore. Per questo il tetto dell'app è a 100.
- *Letto:* Google dice che le password per le app "non sono consigliate e non servono nella maggior parte dei casi", ma resta il modo per far inviare a un'app una mail da Gmail con SMTP.
- *Non so:* se il limite di 500 vale allo stesso modo via SMTP (la pagina non lo dice).
- *Non so:* se Google blocchi o limiti un account che manda codici di accesso ad altri indirizzi, e se i messaggi finiscano nello spam del destinatario. Con il tuo account personale c'è una differenza in più: se i messaggi venissero segnalati come spam, ne risentirebbe anche la tua posta di tutti i giorni. I messaggi sono di solo testo, senza link e col solo codice, per ridurre il rischio, ma la consegna non l'ho potuta controllare.
- *Mai provato con Gmail vero.* L'invio è stato provato con un trasporto finto (configurazione, mittente, destinatario, gestione degli errori) e con la modalità `console`. Non ho spedito nessuna email reale: il primo invio vero è il primo controllo da fare, mandandolo a te.
- *Il segreto.* `SMTP_PASSWORD` non va nel codice né in Git. Se sospetti che sia uscita, revocala dalla pagina delle password per le app di Google e creane un'altra.

**Per provare in locale senza mandare niente**, usa `EMAIL_PROVIDER="console"` come spiegato più su.

## Pubblicazione online

**Perché Neon e non Supabase.** L'app usa funzioni di PostgreSQL (blocchi `pg_advisory_xact_lock`, vincoli `CHECK`, chiavi esterne composte), quindi serve un database Postgres. Dalle pagine dei piani gratuiti: Neon dà 1 GB per progetto, si sospende dopo 5 minuti di inattività e riparte alla prima query, senza carta; Supabase dà 500 MB, **mette in pausa il progetto dopo una settimana di inattività** e non include i backup automatici. Non ho verificato i backup di Neon.

1. **Neon** per il database: progetto in una regione europea (Francoforte). Neon usa **Postgres 18**, il Docker locale la 17: per il backup serve `pg_dump` 18 (vedi `DEPLOY.md`). Servono due stringhe di connessione: quella **con pooler** (`-pooler` nell'indirizzo) per l'app e quella **diretta** per le migrazioni e per portarci i dati.
2. **I dati**: si porta una copia del database locale con solo il proprio account (vedi sotto), non quello di tutti i giorni.
3. **Vercel** per l'app, collegato al ramo `main`, piano Hobby (gratuito, solo uso personale e non commerciale). Variabili d'ambiente **solo per Production**: `DATABASE_URL` (la stringa con pooler), un `AUTH_SECRET` **nuovo**, diverso da quello locale (almeno 32 caratteri), le variabili dell'email (`SMTP_UTENTE`, `SMTP_PASSWORD`) e `CODICE_TRAINER`. Senza `AUTH_SECRET` l'accesso resta chiuso; senza le variabili dell'email il recupero della password resta spento (la registrazione funziona comunque); senza `CODICE_TRAINER` l'opzione «Personal trainer» non compare.
4. **Regione delle funzioni**: per i nuovi progetti Vercel usa Washington (`iad1`); su Hobby se ne sceglie una sola, e conviene quella più vicina al database, cioè Francoforte (`fra1`), in *Settings → Functions*, oppure `regions` in `vercel.json`.
5. **Il ramo `dev` resta spento online**: in *Settings → Build and Deployment → Ignored Build Step* si sceglie "Only build production". Una build annullata conta comunque tra i deploy giornalieri (100 su Hobby).
6. Le credenziali di Neon vanno solo nelle variabili di Vercel e nei comandi che lanci tu, mai nel codice e mai nel `.env`.
