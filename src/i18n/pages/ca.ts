import type { PagesContent } from './types';

// Strava no està en català: els passos citen els menús en castellà, que és el que veurà l'usuari.
const pages: PagesContent = {
  ui: {
    updated: 'Darrera actualització: {date}',
  },

  guide: {
    title: 'Com descarregar les teves dades de Strava',
    description: 'Guia pas a pas per demanar l’arxiu del teu compte de Strava (export_XXXX.zip) des de l’ordinador o el mòbil i convertir-lo en el resum del teu any.',
    kicker: 'Guia pas a pas',
    lead: 'Strava et dona gratis una còpia de tot el teu compte. Demanar-la és cosa d’un minut; després només cal esperar un correu. Així es fa, des de l’ordinador o des del mòbil.',
    sections: [
      {
        h: 'Què és aquest arxiu',
        body: [
          'És un **.zip amb tot el que has pujat a Strava**: la llista de les teves activitats, el fitxer original de cadascuna (el que va gravar el teu rellotge o el teu mòbil), les teves fotos i les dades del teu perfil. El pot demanar qualsevol compte, també els gratuïts.',
          'Demanar-lo **no esborra ni canvia res**: Strava només t’envia una còpia.',
        ],
      },
      {
        h: 'Demana’l a Strava',
        body: [
          '1. Entra a **strava.com** des del navegador, a l’ordinador o al mòbil, i inicia sessió. A l’app de Strava aquesta opció no hi és.\n2. Prem la teva foto i ves a **Configuración → Mi cuenta → Descarga tu cuenta → Comenzar** (Strava no està en català: són els noms dels menús en castellà). O ves-hi directament amb [aquest enllaç a Strava](strava).\n3. Prem **Solicitar descarga**.',
          'Strava només deixa demanar-lo **una vegada per setmana**. Si l’has demanat fa poc, busca el correu que ja et van enviar.',
        ],
      },
      {
        h: 'Espera el correu i desa el .zip',
        body: [
          'Strava t’escriu a l’adreça del teu compte («Tu archivo de Strava está listo para descargarse»). Normalment triga uns minuts; amb molts anys d’activitats, unes quantes hores.',
          'Prem **Descargar archivo** i desa l’**export_XXXXXXXX.zip** tal com és, sense descomprimir-lo.',
          '- **Android:** es queda a la carpeta Baixades.\n- **iPhone:** Safari el desa a l’app Fitxers, dins de Baixades.\n- **Mac:** Safari el pot descomprimir tot sol. No passa res: després podràs triar la carpeta.',
        ],
      },
      {
        h: 'Puja’l i mira el teu any',
        body: [
          'Torna a la [portada de {brand}](home#crear) i deixa anar el .zip al requadre, o toca’l per triar-lo. En un minut tindràs la teva història. Si ja està descomprimit, fes servir «Ja l’has descomprimit? Tria la carpeta».',
          'L’arxiu **no es puja a cap servidor**: es llegeix al teu propi navegador. Els detalls són a [Privacitat i galetes](page:privacy).',
        ],
      },
      {
        h: 'Si alguna cosa no surt',
        body: [
          '- **No arriba el correu.** Mira a la carpeta de correu brossa i comprova que és l’adreça del teu compte de Strava. Amb moltes activitats pot trigar hores.\n- **«No trobo activities.csv».** Aquest .zip no és el del teu compte: el bo es diu export_ seguit d’un número.\n- **L’arxiu pesa uns quants GB.** Tant és: només es llegeixen les parts necessàries.\n- **No hi surten curses o surt un altre any.** Obre «Personalitzar» i revisa l’any i quins tipus d’activitat compten com a córrer.',
          'Continua sense funcionar? Escriu-nos a [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'Com es calcula el teu resum',
    description: 'D’on surt cada xifra del teu any corrent: distància, millors marques, mapa de calor, països, pols, perfil runner… i per què algunes pantalles no apareixen.',
    kicker: 'Amb tot detall',
    lead: 'Totes les xifres surten de l’arxiu del teu compte de Strava i es calculen al teu navegador. Aquí expliquem com, pantalla a pantalla.',
    sections: [
      {
        h: 'D’on surten les dades',
        body: [
          'De l’arxiu es llegeixen dues coses: **activities.csv**, la llista de totes les teves activitats amb la distància, el temps, el desnivell i les sabatilles; i **el fitxer original de cada cursa** (FIT, GPX o TCX), amb el GPS i el pols segon a segon. Tant és que corris amb Garmin, Coros, Apple Watch o el mòbil.',
          'Només s’obren les curses de l’any triat, així que també funciona amb arxius d’uns quants GB.',
        ],
      },
      {
        h: 'Què compta com a córrer',
        body: [
          'Per defecte, les activitats de tipus cursa, trail i cursa virtual. A «Personalitzar» pots afegir o treure tipus: per exemple, les caminades.',
          'Les activitats més ràpides que el rècord del món de la seva distància es descarten: gairebé sempre són una sortida amb bici o un trajecte amb cotxe desats com a cursa.',
        ],
      },
      {
        h: 'Distància, temps i desnivell',
        body: [
          'Són els mateixos valors que veus a Strava. El temps és **temps en moviment**, sense les pauses.',
          'Si l’any no s’ha acabat, la comparació amb l’anterior fa servir les mateixes dates: el que portaves «a aquestes alçades».',
        ],
      },
      {
        h: 'Millors marques',
        body: [
          'Per a cada distància (1 km o 1 milla, 5K, 10K, mitja marató i marató) es busca **el tram més ràpid dins de qualsevol de les teves curses**, amb el GPS. No cal que fos una competició: el teu millor 5K pot ser al mig d’una tirada llarga.',
        ],
      },
      {
        h: 'Mapes, ciutats i països',
        body: [
          'El web porta el seu propi mapa del món i la seva llista de ciutats, així que **les teves coordenades no s’envien a cap servei de mapes**. La teva ciutat és la zona on comencen més curses.',
          'Per no ensenyar on vius, cada ruta es dibuixa **sense els primers i els últims 250 metres** i sense els trams que cauen dins les teves zones de privacitat de Strava. Ho pots desactivar a «Personalitzar», i també amagar el mapa de la teva ciutat.',
        ],
      },
      {
        h: 'Hores i hàbits',
        body: [
          'L’hora de cada cursa és l’**hora local del lloc on vas córrer**, també si eres de viatge. Per saber si surts a l’hora daurada, a trenc d’alba o de nit es calcula la posició real del sol aquell dia en aquell lloc.',
        ],
      },
      {
        h: 'Pols',
        body: [
          'Els batecs s’estimen amb el pols mitjà i la durada de cada cursa. Les cinc zones es reparteixen a partir del teu pols màxim de l’any: menys del 60 %, 60–70 %, 70–80 %, 80–90 % i més del 90 %.',
        ],
      },
      {
        h: 'Sabatilles',
        body: [
          'Els quilòmetres de cada parell són els de les curses on el tens assignat a Strava. La barra de vida útil compta també els d’anys anteriors i pren com a referència uns 800 km (500 milles).',
        ],
      },
      {
        h: 'El teu perfil runner',
        body: [
          'És un de deu perfils: matiner, nocturn, rodamon, de muntanya, de fons, veloç, constant, de cap de setmana, de cinta o tot terreny. Es tria segons el que més et distingeix: els teus horaris, el desnivell, la distància mitjana, el ritme, les setmanes que surts o els llocs on corres.',
        ],
      },
      {
        h: 'Per què no veig alguna pantalla',
        body: [
          'Cada pantalla demana un mínim de dades per dir alguna cosa amb sentit. Si no hi arribes, no s’ensenya. Alguns exemples:',
          '- **Calendari:** 10 dies corrent.\n- **Desnivell:** 300 m acumulats.\n- **Millors marques:** almenys dues distàncies amb GPS.\n- **Mapa de la teva ciutat:** 5 rutes a la mateixa zona.\n- **On vas córrer:** més d’una ciutat o país.\n- **Sabatilles:** un parell amb 50 km i assignat a bona part de les teves curses.\n- **Altres esports:** almenys dos esports més amb una certa dedicació.\n- **Pols:** curses gravades amb pulsòmetre.',
        ],
      },
      {
        h: 'Imatges i vídeo',
        body: [
          'Cada pantalla es desa a 1080 × 1920, la mida d’una història d’Instagram. El vídeo també es crea al teu navegador; si el teu no pot, sempre tens la imatge.',
        ],
      },
      {
        h: 'Si veus alguna cosa estranya',
        body: [
          'Les xifres depenen del que va desar el teu rellotge: un GPS amb salts o una activitat mal etiquetada poden canviar un resultat. Si alguna cosa no quadra, explica’ns-ho a [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'Sobre {brand}',
    description: 'Què és {brand}, qui el fa, com es manté i com posar-s’hi en contacte.',
    kicker: 'El projecte',
    lead: '{brand} converteix l’arxiu del teu compte de Strava en una història amb el teu any corrent, a punt per compartir. És gratis, no demana registre i les teves dades no surten del teu dispositiu.',
    sections: [
      {
        h: 'Qui hi ha al darrere',
        body: [
          '{brand} és un projecte independent creat per {owner}, a Espanya. No pertany a Strava ni hi té cap relació: és compatible amb Strava perquè llegeix l’arxiu que Strava deixa descarregar a qualsevol usuari.',
        ],
      },
      {
        h: 'Com es manté',
        body: [
          { when: 'noads', text: 'El web és gratuït i ara mateix no té publicitat. Més endavant podrà mostrar anuncis per cobrir els seus costos, sempre fora de la teva història i de les teves imatges, i demanant-te permís abans de fer servir galetes.' },
          { when: 'ads', text: 'El web és gratuït i es manté amb publicitat. Els anuncis apareixen només a la portada, sota els teus resultats i a les pàgines de text: mai dins de la teva història ni a les imatges que comparteixes.' },
        ],
      },
      {
        h: 'Contacte',
        body: ['Per a dubtes, errors o suggeriments, escriu a [{email}](mail).'],
      },
      {
        h: 'Crèdits',
        body: [
          'Els mapes fan servir dades de Natural Earth i la llista de ciutats és de GeoNames (CC BY 4.0). Les tipografies són Anton, Archivo, Oswald i Noto Sans. Aquí tens les [llicències del programari i les dades que fa servir el web](licenses).',
          'Strava és una marca registrada de Strava, Inc. {brand} no està afiliat, patrocinat ni avalat per Strava, Inc.',
        ],
      },
    ],
  },

  legal: {
    title: 'Avís legal i condicions d’ús',
    description: 'Qui és el titular de {brand}, condicions d’ús del web, propietat intel·lectual i llei aplicable.',
    kicker: 'Legal',
    lead: 'Qui és el titular d’aquest web i en quines condicions es pot fer servir.',
    sections: [
      {
        h: 'Titular del web',
        body: [
          { when: 'nif', text: 'En compliment de l’article 10 de la Llei 34/2002, de serveis de la societat de la informació i de comerç electrònic:' },
          '- **Titular:** {owner}',
          { when: 'nif', text: '- **NIF:** {nif}' },
          { when: 'address', text: '- **Domicili:** {address}' },
          '- **Correu electrònic:** [{email}](mail)\n- **Lloc web:** {domain}',
        ],
      },
      {
        h: 'Què és {brand}',
        body: [
          'Una eina gratuïta que genera un resum anual de running a partir de l’arxiu de dades que cada persona descarrega del seu propi compte de Strava. Tot el càlcul es fa al navegador de qui la fa servir.',
        ],
      },
      {
        h: 'Relació amb Strava',
        body: [
          '{brand} és un projecte independent. No està afiliat, patrocinat ni avalat per Strava, Inc., i no fa servir la seva API. Strava és una marca registrada de Strava, Inc.; s’esmenta només per indicar la compatibilitat amb l’arxiu de dades que Strava lliura als seus usuaris.',
        ],
      },
      {
        h: 'Condicions d’ús',
        body: [
          '- El web és per a ús personal. Fes servir només l’arxiu del teu propi compte, o el d’una altra persona amb el seu permís.\n- No el facis servir amb finalitats il·lícites ni de manera que el pugui malmetre o impedir-ne l’ús a altres persones.\n- Les xifres es calculen automàticament amb les dades del teu arxiu i són orientatives: poden contenir errors si les dades d’origen en tenen.\n- El web s’ofereix tal com és, sense garantia de disponibilitat, i pot canviar o deixar d’estar disponible.',
        ],
      },
      {
        h: 'Propietat intel·lectual',
        body: [
          'El disseny, el codi i els textos de {brand} pertanyen al seu titular. No està permès copiar-los ni reutilitzar-los sense autorització.',
          '**Les imatges i els vídeos que generis amb les teves dades són teus**: els pots descarregar i compartir lliurement.',
          'El programari i les dades de tercers que fa servir el web conserven les seves pròpies [llicències](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Publicitat',
        body: [
          'El web es finança amb publicitat servida per Google AdSense, que apareix identificada com a tal. El titular no tria els anuncis concrets que es mostren ni respon dels productes o serveis anunciats.',
        ],
      },
      {
        h: 'Responsabilitat',
        body: [
          'El titular no respon dels danys derivats d’un ús indegut del web ni dels continguts dels webs externs als quals s’enllaça. Si detectes un contingut o un enllaç inadequat, escriu a [{email}](mail).',
        ],
      },
      {
        h: 'Llei aplicable',
        body: [
          'Aquestes condicions es regeixen per la legislació espanyola. Si ets consumidor, qualsevol conflicte es resoldrà davant els jutjats i tribunals del teu domicili.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacitat i galetes',
    description: 'Quines dades tracta {brand} i quines no: el teu arxiu de Strava no surt del teu dispositiu. Galetes, estadístiques, publicitat i els teus drets.',
    kicker: 'Legal',
    lead: 'L’essencial: **el teu arxiu de Strava no surt del teu dispositiu**. No hi ha comptes ni registre, i no rebem les teves activitats, les teves rutes ni les teves fotos.',
    sections: [
      {
        h: 'Qui n’és el responsable',
        body: [
          '{owner}, titular de {brand}. Per a qualsevol qüestió sobre les teves dades, escriu a [{email}](mail). Les seves dades completes són a l’[avís legal](page:legal).',
        ],
      },
      {
        h: 'El teu arxiu de Strava',
        body: [
          'Quan tries el teu arxiu, **es llegeix i es processa al teu propi navegador**. No es puja a cap servidor: no el rebem, no el desem i no el podem veure. El mateix val per al teu nom, les teves rutes i les teves fotos.',
          'Tot es queda a la memòria de la pestanya i desapareix quan la tanques o la recarregues. Les imatges i els vídeos es creen al teu dispositiu, i només en surten si tu els comparteixes.',
        ],
      },
      {
        h: 'Dades tècniques de la visita',
        body: [
          'Com a qualsevol web, per enviar-te les pàgines el nostre proveïdor d’allotjament, **Cloudflare**, tracta la teva adreça IP i dades tècniques de la connexió (navegador, data i hora, pàgina demanada). Les fa servir per servir el web i protegir-lo d’atacs. La base legal és el nostre interès legítim a oferir el web de manera segura (art. 6.1.f del RGPD).',
          'Cloudflare actua com a encarregat del tractament. Pot tractar dades fora de l’Espai Econòmic Europeu amb les garanties del Marc de Privacitat de Dades UE-EUA i de les clàusules contractuals tipus.',
        ],
      },
      {
        h: 'Estadístiques de visites',
        body: [
          'Mesurem les visites amb **Cloudflare Web Analytics**: pàgines vistes, país aproximat i tipus de dispositiu, sempre en conjunt. No fa servir galetes, no desa res al teu dispositiu i no t’identifica ni et segueix per altres webs.',
        ],
      },
      {
        id: 'cookies',
        h: 'Galetes i emmagatzematge al teu navegador',
        body: [
          '{brand} no instal·la galetes pròpies. Només desa al teu navegador **l’idioma que tries** (clau «myrunyear.lang» de l’emmagatzematge local), per recordar-lo a la propera visita. És un ajust que demanes tu, així que no necessita consentiment, i el pots esborrar des dels ajustos del navegador.',
          { when: 'noads', text: 'Ara mateix el web **no mostra publicitat ni fa servir galetes de tercers**. Si això canvia, et demanarem permís abans i actualitzarem aquesta pàgina.' },
          { when: 'ads', text: 'La publicitat de **Google AdSense** sí que fa servir galetes i identificadors, de Google i dels seus socis, per mostrar i mesurar els anuncis i, si ho acceptes, personalitzar-los. Abans de fer-los servir et demanem permís amb un avís on pots **acceptar, rebutjar o configurar** amb la mateixa facilitat.' },
          { when: 'ads', text: 'Pots canviar la teva elecció quan vulguis a «Preferències de privacitat», al peu de qualsevol pàgina. Si les rebutges, el web funciona igual i els anuncis no es personalitzen.' },
          { when: 'ads', text: '- **Qui les fa servir:** Google Ireland Limited i els socis publicitaris que apareixen a l’avís.\n- **Per a què:** mostrar anuncis, limitar quantes vegades veus el mateix, mesurar-ne el resultat, evitar el frau i, amb el teu permís, personalitzar-los.\n- **Quant duren:** des de la sessió fins a 13 mesos, segons la galeta.\n- **Més informació:** [com fa servir Google les dades dels webs que mostren els seus anuncis](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Publicitat',
        body: [
          'La base legal de la publicitat personalitzada i de les seves galetes és el teu consentiment (art. 6.1.a del RGPD), que pots retirar en qualsevol moment. Google tracta aquestes dades com a responsable independent: consulta la seva [política de privacitat](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'Si ens escrius',
        body: ['Farem servir la teva adreça i el teu missatge només per respondre’t, i els esborrarem quan ja no facin falta.'],
      },
      {
        h: 'Els teus drets',
        body: [
          'Pots demanar l’accés, la rectificació o la supressió de les teves dades, oposar-te al seu tractament o demanar que es limiti, escrivint a [{email}](mail). Tingues en compte que no tenim les teves dades de Strava: no ens arriben mai.',
          'Si creus que no hem atès bé la teva petició, pots reclamar davant l’Agència Espanyola de Protecció de Dades ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Menors',
        body: ['El web no està adreçat a menors de 14 anys.'],
      },
      {
        h: 'Canvis en aquesta política',
        body: ['Si aquesta política canvia, publicarem aquí la nova versió amb la seva data.'],
      },
    ],
  },
};

export default pages;
