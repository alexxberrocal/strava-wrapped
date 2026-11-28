import type { PagesContent } from './types';

const pages: PagesContent = {
  ui: {
    updated: 'Ultimo aggiornamento: {date}',
  },

  guide: {
    title: 'Come scaricare i tuoi dati da Strava',
    description: 'Guida passo passo per richiedere l’archivio del tuo account Strava (export_XXXX.zip) dal computer o dal telefono e trasformarlo nel riepilogo del tuo anno.',
    kicker: 'Guida passo passo',
    lead: 'Strava ti dà gratis una copia di tutto il tuo account. Richiederla è questione di un minuto; poi basta aspettare un’e-mail. Ecco come si fa, dal computer o dal telefono.',
    sections: [
      {
        h: 'Che cos’è questo archivio',
        body: [
          'È un **.zip con tutto quello che hai caricato su Strava**: l’elenco delle tue attività, il file originale di ciascuna (quello registrato dall’orologio o dal telefono), le tue foto e i dati del tuo profilo. Può richiederlo qualsiasi account, anche quelli gratuiti.',
          'Richiederlo **non cancella e non modifica nulla**: Strava ti manda solo una copia.',
        ],
      },
      {
        h: 'Richiedilo su Strava',
        body: [
          '1. Apri **strava.com** dal browser, sul computer o sul telefono, e accedi. Nell’app di Strava questa opzione non c’è.\n2. Tocca la tua foto e vai su **Impostazioni → Il mio account → Scarica il tuo account → Inizia**. Oppure vai direttamente con [questo link a Strava](strava).\n3. Tocca **Richiedi download**.',
          'Strava permette **una sola richiesta a settimana**. Se l’hai fatta da poco, cerca l’e-mail che ti hanno già mandato.',
        ],
      },
      {
        h: 'Aspetta l’e-mail e salva il .zip',
        body: [
          'Strava scrive all’indirizzo del tuo account con il link per scaricare. Di solito bastano pochi minuti; con molti anni di attività, anche qualche ora.',
          'Scarica l’archivio e conserva il file **export_XXXXXXXX.zip** così com’è, senza decomprimerlo.',
          '- **Android:** finisce nella cartella Download.\n- **iPhone:** Safari lo salva nell’app File, dentro Download.\n- **Mac:** Safari potrebbe decomprimerlo da solo. Nessun problema: potrai scegliere la cartella.',
        ],
      },
      {
        h: 'Caricalo e guarda il tuo anno',
        body: [
          'Torna alla [pagina iniziale di {brand}](home#crear) e trascina il .zip nel riquadro, oppure toccalo per sceglierlo. In un minuto la tua storia è pronta. Se è già decompresso, usa «L’hai già decompresso? Scegli la cartella».',
          'Il file **non viene caricato su nessun server**: viene letto nel tuo browser. I dettagli sono in [Privacy e cookie](page:privacy).',
        ],
      },
      {
        h: 'Se qualcosa non funziona',
        body: [
          '- **L’e-mail non arriva.** Controlla nello spam e verifica che sia l’indirizzo del tuo account Strava. Con molte attività possono volerci ore.\n- **«Non trovo activities.csv».** Quel .zip non è l’archivio del tuo account: quello giusto si chiama export_ seguito da un numero.\n- **Il file pesa diversi GB.** Non importa: vengono lette solo le parti necessarie.\n- **Non compaiono corse o esce un altro anno.** Apri «Personalizza» e controlla l’anno e quali tipi di attività contano come corsa.',
          'Ancora niente? Scrivici a [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'Come si calcola il tuo riepilogo',
    description: 'Da dove viene ogni numero del tuo anno di corsa: distanza, migliori tempi, heatmap, paesi, frequenza cardiaca, profilo runner… e perché alcune schermate non compaiono.',
    kicker: 'In dettaglio',
    lead: 'Tutti i numeri vengono dall’archivio del tuo account Strava e sono calcolati nel tuo browser. Ecco come, schermata per schermata.',
    sections: [
      {
        h: 'Da dove vengono i dati',
        body: [
          'Dall’archivio si leggono due cose: **activities.csv**, l’elenco di tutte le tue attività con distanza, tempo, dislivello e scarpe; e **il file originale di ogni corsa** (FIT, GPX o TCX), con GPS e frequenza cardiaca secondo per secondo. Non importa se corri con Garmin, Coros, Apple Watch o il telefono.',
          'Si aprono solo le corse dell’anno scelto, quindi funziona anche con archivi di diversi GB.',
        ],
      },
      {
        h: 'Cosa conta come corsa',
        body: [
          'Per impostazione predefinita, le attività di tipo corsa, trail e corsa virtuale. In «Personalizza» puoi aggiungere o togliere tipi: per esempio le camminate.',
          'Le attività più veloci del record del mondo sulla loro distanza vengono scartate: quasi sempre sono un’uscita in bici o un tragitto in auto salvati come corsa.',
        ],
      },
      {
        h: 'Distanza, tempo e dislivello',
        body: [
          'Sono gli stessi valori che vedi su Strava. Il tempo è il **tempo in movimento**, senza le pause.',
          'Se l’anno non è finito, il confronto con il precedente usa le stesse date: a che punto eri «in questo periodo».',
        ],
      },
      {
        h: 'Migliori tempi',
        body: [
          'Per ogni distanza (1 km o 1 miglio, 5 km, 10 km, mezza maratona e maratona) si cerca **il tratto più veloce dentro una qualsiasi delle tue corse**, con il GPS. Non serve che fosse una gara: i tuoi migliori 5 km possono nascondersi in mezzo a un lungo.',
        ],
      },
      {
        h: 'Mappe, città e paesi',
        body: [
          'Il sito include la propria mappa del mondo e il proprio elenco di città, quindi **le tue coordinate non vengono inviate a nessun servizio di mappe**. La tua città è la zona da cui partono più corse.',
          'Per non mostrare dove abiti, ogni percorso viene disegnato **senza i primi e gli ultimi 250 metri** e senza i tratti che ricadono nelle tue zone di privacy di Strava. Puoi disattivarlo in «Personalizza», e anche nascondere la mappa della tua città.',
        ],
      },
      {
        h: 'Orari e abitudini',
        body: [
          'L’ora di ogni corsa è l’**ora locale del posto in cui hai corso**, anche in viaggio. Per capire se corri nell’ora dorata, all’alba o col buio si calcola la posizione reale del sole quel giorno in quel luogo.',
        ],
      },
      {
        h: 'Frequenza cardiaca',
        body: [
          'I battiti sono stimati dalla frequenza media e dalla durata di ogni corsa. Le cinque zone si basano sulla tua frequenza massima dell’anno: meno del 60%, 60–70%, 70–80%, 80–90% e più del 90%.',
        ],
      },
      {
        h: 'Scarpe',
        body: [
          'I chilometri di ogni paio sono quelli delle corse a cui l’hai assegnato su Strava. La barra della durata conta anche gli anni precedenti e prende come riferimento circa 800 km (500 miglia).',
        ],
      },
      {
        h: 'Il tuo profilo runner',
        body: [
          'È uno di dieci profili: mattiniero, nottambulo, giramondo, da montagna, fondista, velocista, metronomo, da weekend, da tapis roulant o tuttofare. Si sceglie in base a ciò che ti distingue di più: i tuoi orari, il dislivello, la distanza media, il ritmo, le settimane in cui esci o i posti in cui corri.',
        ],
      },
      {
        h: 'Perché manca una schermata',
        body: [
          'Ogni schermata ha bisogno di un minimo di dati per dire qualcosa di sensato. Se non ci arrivi, non viene mostrata. Qualche esempio:',
          '- **Calendario:** 10 giorni di corsa.\n- **Dislivello:** 300 m complessivi.\n- **Migliori tempi:** almeno due distanze con GPS.\n- **Mappa della tua città:** 5 percorsi nella stessa zona.\n- **Dove hai corso:** più di una città o di un paese.\n- **Scarpe:** un paio con 50 km, assegnato a buona parte delle tue corse.\n- **Altri sport:** almeno altri due sport praticati con una certa costanza.\n- **Frequenza cardiaca:** corse registrate con il cardiofrequenzimetro.',
        ],
      },
      {
        h: 'Immagini e video',
        body: [
          'Ogni schermata viene salvata a 1080 × 1920, il formato di una storia di Instagram. Anche il video viene creato nel tuo browser; se il tuo non ci riesce, hai sempre l’immagine.',
        ],
      },
      {
        h: 'Se vedi qualcosa di strano',
        body: [
          'I numeri dipendono da ciò che ha registrato il tuo orologio: un GPS che salta o un’attività etichettata male possono cambiare un risultato. Se qualcosa non torna, scrivici a [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'Informazioni su {brand}',
    description: 'Che cos’è {brand}, chi lo realizza, come si finanzia e come contattarci.',
    kicker: 'Il progetto',
    lead: '{brand} trasforma l’archivio del tuo account Strava in una storia del tuo anno di corsa, pronta da condividere. È gratis, non richiede registrazione e i tuoi dati non lasciano il tuo dispositivo.',
    sections: [
      {
        h: 'Chi c’è dietro',
        body: [
          '{brand} è un progetto indipendente creato da {owner}, in Spagna. Non appartiene a Strava e non ha alcun rapporto con essa: è compatibile con Strava perché legge l’archivio che Strava permette di scaricare a qualsiasi utente.',
        ],
      },
      {
        h: 'Come si finanzia',
        body: [
          { when: 'noads', text: 'Il sito è gratuito e al momento non ha pubblicità. Più avanti potrà mostrare annunci per coprire i costi, sempre fuori dalla tua storia e dalle tue immagini, e chiedendoti il permesso prima di usare i cookie.' },
          { when: 'ads', text: 'Il sito è gratuito e si finanzia con la pubblicità. Gli annunci compaiono solo nella pagina iniziale, sotto i tuoi risultati e nelle pagine di testo: mai dentro la tua storia né sulle immagini che condividi.' },
        ],
      },
      {
        h: 'Contatti',
        body: ['Per dubbi, errori o suggerimenti, scrivi a [{email}](mail).'],
      },
      {
        h: 'Crediti',
        body: [
          'Le mappe usano i dati di Natural Earth e l’elenco delle città è di GeoNames (CC BY 4.0). I caratteri sono Anton, Archivo, Oswald e Noto Sans. Qui trovi le [licenze del software e dei dati usati dal sito](licenses).',
          'Strava è un marchio registrato di Strava, Inc. {brand} non è affiliato a Strava, Inc., né sponsorizzato o approvato da essa.',
        ],
      },
    ],
  },

  legal: {
    title: 'Note legali e condizioni d’uso',
    description: 'Chi è il titolare di {brand}, le condizioni d’uso del sito, la proprietà intellettuale e la legge applicabile.',
    kicker: 'Note legali',
    lead: 'Chi è il titolare di questo sito e a quali condizioni si può usare.',
    sections: [
      {
        h: 'Titolare del sito',
        body: [
          'Ai sensi dell’articolo 10 della legge spagnola 34/2002 sui servizi della società dell’informazione e sul commercio elettronico:',
          '- **Titolare:** {owner}',
          { when: 'nif', text: '- **Codice fiscale (NIF):** {nif}' },
          { when: 'address', text: '- **Indirizzo:** {address}' },
          '- **E-mail:** [{email}](mail)\n- **Sito web:** {domain}',
        ],
      },
      {
        h: 'Che cos’è {brand}',
        body: [
          'Uno strumento gratuito che genera un riepilogo annuale di corsa a partire dall’archivio di dati che ciascuno scarica dal proprio account Strava. Tutto il calcolo avviene nel browser di chi lo usa.',
        ],
      },
      {
        h: 'Rapporto con Strava',
        body: [
          '{brand} è un progetto indipendente. Non è affiliato a Strava, Inc., né sponsorizzato o approvato da essa, e non usa la sua API. Strava è un marchio registrato di Strava, Inc.; viene citato solo per indicare la compatibilità con l’archivio di dati che Strava fornisce ai suoi utenti.',
        ],
      },
      {
        h: 'Condizioni d’uso',
        body: [
          '- Il sito è per uso personale. Usa solo l’archivio del tuo account, o quello di un’altra persona con il suo permesso.\n- Non usarlo per scopi illeciti né in modo da danneggiarlo o da impedirne l’uso ad altre persone.\n- I numeri sono calcolati automaticamente dai dati del tuo archivio e sono indicativi: possono contenere errori se li contengono i dati di origine.\n- Il sito è offerto così com’è, senza garanzia di disponibilità, e può cambiare o non essere più disponibile.',
        ],
      },
      {
        h: 'Proprietà intellettuale',
        body: [
          'Il design, il codice e i testi di {brand} appartengono al titolare. Non è consentito copiarli o riutilizzarli senza autorizzazione.',
          '**Le immagini e i video che generi con i tuoi dati sono tuoi**: puoi scaricarli e condividerli liberamente.',
          'Il software e i dati di terzi usati dal sito mantengono le proprie [licenze](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Pubblicità',
        body: [
          'Il sito si finanzia con la pubblicità fornita da Google AdSense, identificata come tale. Il titolare non sceglie i singoli annunci mostrati e non risponde dei prodotti o servizi pubblicizzati.',
        ],
      },
      {
        h: 'Responsabilità',
        body: [
          'Il titolare non risponde dei danni derivanti da un uso improprio del sito né dei contenuti dei siti esterni a cui rimanda. Se noti un contenuto o un link inadeguato, scrivi a [{email}](mail).',
        ],
      },
      {
        h: 'Legge applicabile',
        body: [
          'Queste condizioni sono regolate dalla legge spagnola. Se sei un consumatore, qualsiasi controversia sarà decisa dai tribunali del tuo luogo di residenza.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy e cookie',
    description: 'Quali dati tratta {brand} e quali no: il tuo archivio Strava non lascia il tuo dispositivo. Cookie, statistiche, pubblicità e i tuoi diritti.',
    kicker: 'Note legali',
    lead: 'L’essenziale: **il tuo archivio Strava non lascia il tuo dispositivo**. Non ci sono account né registrazioni, e non riceviamo le tue attività, i tuoi percorsi né le tue foto.',
    sections: [
      {
        h: 'Chi è il titolare del trattamento',
        body: [
          '{owner}, titolare di {brand}. Per qualsiasi questione sui tuoi dati, scrivi a [{email}](mail). I suoi dati completi sono nelle [note legali](page:legal).',
        ],
      },
      {
        h: 'Il tuo archivio Strava',
        body: [
          'Quando scegli il tuo archivio, **viene letto ed elaborato nel tuo browser**. Non viene caricato su nessun server: non lo riceviamo, non lo conserviamo e non possiamo vederlo. Lo stesso vale per il tuo nome, i tuoi percorsi e le tue foto.',
          'Tutto resta nella memoria della scheda e scompare quando la chiudi o la ricarichi. Immagini e video vengono creati sul tuo dispositivo, e ne escono solo se li condividi tu.',
        ],
      },
      {
        h: 'Dati tecnici della visita',
        body: [
          'Come in qualsiasi sito, per inviarti le pagine il nostro fornitore di hosting, **Cloudflare**, tratta il tuo indirizzo IP e i dati tecnici della connessione (browser, data e ora, pagina richiesta). Li usa per servire il sito e proteggerlo dagli attacchi. La base giuridica è il nostro legittimo interesse a offrire il sito in modo sicuro (art. 6.1.f del GDPR).',
          'Cloudflare agisce come responsabile del trattamento. Può trattare dati fuori dallo Spazio economico europeo con le garanzie del Data Privacy Framework UE-USA e delle clausole contrattuali tipo.',
        ],
      },
      {
        h: 'Statistiche delle visite',
        body: [
          'Misuriamo le visite con **Cloudflare Web Analytics**: pagine viste, paese approssimativo e tipo di dispositivo, sempre in forma aggregata. Non usa cookie, non salva nulla sul tuo dispositivo, non ti identifica e non ti segue su altri siti.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookie e archiviazione nel tuo browser',
        body: [
          '{brand} non installa cookie propri. Salva nel tuo browser solo **la lingua che scegli** (chiave «myrunyear.lang» dell’archiviazione locale), per ricordarla alla prossima visita. È un’impostazione che chiedi tu, quindi non richiede consenso, e puoi cancellarla dalle impostazioni del browser.',
          { when: 'noads', text: 'Al momento il sito **non mostra pubblicità e non usa cookie di terze parti**. Se le cose cambiano, ti chiederemo prima il permesso e aggiorneremo questa pagina.' },
          { when: 'ads', text: 'La pubblicità di **Google AdSense** invece usa cookie e identificatori, di Google e dei suoi partner, per mostrare e misurare gli annunci e, se accetti, personalizzarli. Prima di usarli ti chiediamo il permesso con un avviso in cui puoi **accettare, rifiutare o configurare** con la stessa facilità.' },
          { when: 'ads', text: 'Puoi cambiare la tua scelta quando vuoi in «Preferenze sulla privacy», in fondo a ogni pagina. Se li rifiuti, il sito funziona allo stesso modo e gli annunci non vengono personalizzati.' },
          { when: 'ads', text: '- **Chi li usa:** Google Ireland Limited e i partner pubblicitari indicati nell’avviso.\n- **A cosa servono:** mostrare annunci, limitare quante volte vedi lo stesso, misurarne i risultati, prevenire le frodi e, con il tuo permesso, personalizzarli.\n- **Quanto durano:** dalla sessione fino a 13 mesi, a seconda del cookie.\n- **Maggiori informazioni:** [come Google usa i dati dei siti che mostrano i suoi annunci](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Pubblicità',
        body: [
          'La base giuridica della pubblicità personalizzata e dei suoi cookie è il tuo consenso (art. 6.1.a del GDPR), che puoi revocare in qualsiasi momento. Google tratta questi dati come titolare autonomo: consulta le sue [norme sulla privacy](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'Se ci scrivi',
        body: ['Useremo il tuo indirizzo e il tuo messaggio solo per risponderti, e li cancelleremo quando non serviranno più.'],
      },
      {
        h: 'I tuoi diritti',
        body: [
          'Puoi chiedere l’accesso, la rettifica o la cancellazione dei tuoi dati, opporti al loro trattamento o chiederne la limitazione, scrivendo a [{email}](mail). Tieni presente che non abbiamo i tuoi dati di Strava: non ci arrivano mai.',
          'Se ritieni che non abbiamo gestito bene la tua richiesta, puoi presentare reclamo all’Agenzia spagnola per la protezione dei dati ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Minori',
        body: ['Il sito non è rivolto ai minori di 14 anni.'],
      },
      {
        h: 'Modifiche a questa informativa',
        body: ['Se questa informativa cambia, pubblicheremo qui la nuova versione con la data.'],
      },
    ],
  },
};

export default pages;
