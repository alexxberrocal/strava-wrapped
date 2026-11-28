import type { PagesContent } from './types';

const pages: PagesContent = {
  ui: {
    updated: 'Laatst bijgewerkt: {date}',
  },

  guide: {
    title: 'Zo download je je Strava-gegevens',
    description: 'Stap-voor-stapgids om het archief van je Strava-account (export_XXXX.zip) op te vragen via computer of telefoon en er je jaaroverzicht van te maken.',
    kicker: 'Stap voor stap',
    lead: 'Strava geeft je gratis een kopie van je hele account. Aanvragen kost een minuut; daarna hoef je alleen op een e-mail te wachten. Zo doe je dat, op je computer of op je telefoon.',
    sections: [
      {
        h: 'Wat dat archief is',
        body: [
          'Het is een **.zip met alles wat je naar Strava hebt geüpload**: de lijst van je activiteiten, het originele bestand van elke activiteit (zoals je horloge of telefoon het heeft opgenomen), je foto’s en je profielgegevens. Elk account kan het aanvragen, ook een gratis account.',
          'Aanvragen **verwijdert of verandert niets**: Strava stuurt je alleen een kopie.',
        ],
      },
      {
        h: 'Vraag het aan bij Strava',
        body: [
          '1. Open **strava.com** in de browser, op je computer of telefoon, en log in. In de Strava-app zit deze optie niet.\n2. Tik op je foto en ga naar **Instellingen → Mijn account → Je account downloaden → Aan de slag**. Of ga er direct heen met [deze link naar Strava](strava).\n3. Tik op **Download aanvragen**.',
          'Strava staat maar **één aanvraag per week** toe. Heb je het kortgeleden aangevraagd, zoek dan de e-mail die je al hebt gekregen.',
        ],
      },
      {
        h: 'Wacht op de e-mail en bewaar de .zip',
        body: [
          'Strava mailt naar het adres van je account met een downloadlink. Meestal duurt dat een paar minuten; met veel jaren aan activiteiten soms een paar uur.',
          'Download het archief en bewaar het bestand **export_XXXXXXXX.zip** zoals het is, zonder het uit te pakken.',
          '- **Android:** het komt in de map Downloads.\n- **iPhone:** Safari bewaart het in de app Bestanden, onder Downloads.\n- **Mac:** Safari pakt het soms vanzelf uit. Geen probleem: dan kies je gewoon de map.',
        ],
      },
      {
        h: 'Upload het en bekijk je jaar',
        body: [
          'Ga terug naar de [startpagina van {brand}](home#crear) en sleep de .zip in het vak, of tik erop om het bestand te kiezen. Binnen een minuut staat je verhaal klaar. Is het al uitgepakt, gebruik dan ‘Al uitgepakt? Kies de map’.',
          'Het bestand wordt **naar geen enkele server geüpload**: het wordt in je eigen browser gelezen. De details staan in [Privacy en cookies](page:privacy).',
        ],
      },
      {
        h: 'Als er iets misgaat',
        body: [
          '- **De e-mail komt niet aan.** Kijk in je spammap en controleer of het het adres van je Strava-account is. Met veel activiteiten kan het uren duren.\n- **‘activities.csv niet gevonden’.** Die .zip is niet het archief van je account: het juiste bestand heet export_ gevolgd door een nummer.\n- **Het bestand is meerdere GB groot.** Geen punt: alleen de nodige delen worden gelezen.\n- **Er verschijnen geen runs, of het verkeerde jaar.** Open ‘Aanpassen’ en controleer het jaar en welke activiteitstypen als hardlopen tellen.',
          'Lukt het nog steeds niet? Mail ons op [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'Zo wordt je terugblik berekend',
    description: 'Waar elk cijfer van je hardloopjaar vandaan komt: afstand, beste tijden, heatmap, landen, hartslag, hardloopprofiel… en waarom sommige schermen niet verschijnen.',
    kicker: 'Tot in detail',
    lead: 'Alle cijfers komen uit het archief van je Strava-account en worden in je browser berekend. Hier lees je hoe, scherm voor scherm.',
    sections: [
      {
        h: 'Waar de gegevens vandaan komen',
        body: [
          'Uit het archief worden twee dingen gelezen: **activities.csv**, de lijst van al je activiteiten met afstand, tijd, hoogtemeters en schoenen; en **het originele bestand van elke run** (FIT, GPX of TCX), met gps en hartslag van seconde tot seconde. Het maakt niet uit of je loopt met Garmin, Coros, Apple Watch of je telefoon.',
          'Alleen de runs van het gekozen jaar worden geopend, dus het werkt ook met archieven van meerdere GB.',
        ],
      },
      {
        h: 'Wat telt als hardlopen',
        body: [
          'Standaard de activiteiten van het type hardloopsessie, trailrun en virtuele run. Onder ‘Aanpassen’ kun je types toevoegen of weghalen, bijvoorbeeld wandelingen.',
          'Activiteiten die sneller zijn dan het wereldrecord op hun afstand vallen af: bijna altijd is dat een fietsrit of een autorit die als run is opgeslagen.',
        ],
      },
      {
        h: 'Afstand, tijd en hoogtemeters',
        body: [
          'Het zijn dezelfde waarden die je in Strava ziet. De tijd is de **bewegingstijd**, zonder pauzes.',
          'Is het jaar nog niet voorbij, dan gebruikt de vergelijking met het vorige jaar dezelfde datums: waar je ‘rond deze tijd’ stond.',
        ],
      },
      {
        h: 'Beste tijden',
        body: [
          'Voor elke afstand (1 km of 1 mijl, 5 km, 10 km, halve marathon en marathon) zoeken we met gps **het snelste stuk binnen een van je runs**. Het hoeft geen wedstrijd te zijn: je beste 5 km kan midden in een lange duurloop zitten.',
        ],
      },
      {
        h: 'Kaarten, steden en landen',
        body: [
          'De site heeft zijn eigen wereldkaart en stedenlijst aan boord, dus **je coördinaten gaan naar geen enkele kaartdienst**. Je stad is het gebied waar de meeste runs beginnen.',
          'Om niet te laten zien waar je woont, wordt elke route getekend **zonder de eerste en laatste 250 meter** en zonder de stukken binnen je privacyzones van Strava. Je kunt dit uitzetten onder ‘Aanpassen’, en ook de kaart van je stad verbergen.',
        ],
      },
      {
        h: 'Tijdstippen en gewoontes',
        body: [
          'Het tijdstip van elke run is de **lokale tijd van de plek waar je liep**, ook op reis. Om te bepalen of je in het gouden uur, bij zonsopkomst of in het donker loopt, berekenen we de echte stand van de zon op die dag en plek.',
        ],
      },
      {
        h: 'Hartslag',
        body: [
          'De hartslagen worden geschat uit de gemiddelde hartslag en de duur van elke run. De vijf zones zijn gebaseerd op je hoogste hartslag van het jaar: onder 60%, 60–70%, 70–80%, 80–90% en boven 90%.',
        ],
      },
      {
        h: 'Schoenen',
        body: [
          'De kilometers van elk paar zijn die van de runs waaraan je het in Strava hebt gekoppeld. De levensduurbalk telt ook eerdere jaren mee en neemt ongeveer 800 km (500 mijl) als richtlijn.',
        ],
      },
      {
        h: 'Je hardloopprofiel',
        body: [
          'Het is een van tien profielen: vroege vogel, nachtuil, wereldreiziger, berggeit, langeafstandsloper, snelheidsduivel, metronoom, weekendloper, loopbandfan of allrounder. De keuze hangt af van wat jou het meest typeert: je tijdstippen, de hoogtemeters, de gemiddelde afstand, het tempo, de weken waarin je loopt of de plekken waar je loopt.',
        ],
      },
      {
        h: 'Waarom een scherm ontbreekt',
        body: [
          'Elk scherm heeft een minimum aan gegevens nodig om iets zinnigs te zeggen. Haal je dat niet, dan wordt het niet getoond. Een paar voorbeelden:',
          '- **Kalender:** 10 hardloopdagen.\n- **Hoogtemeters:** 300 m in totaal.\n- **Beste tijden:** minstens twee afstanden met gps.\n- **Kaart van je stad:** 5 routes in hetzelfde gebied.\n- **Waar je liep:** meer dan één stad of land.\n- **Schoenen:** een paar met 50 km, gekoppeld aan een flink deel van je runs.\n- **Andere sporten:** minstens twee andere sporten die je echt beoefent.\n- **Hartslag:** runs die met een hartslagmeter zijn opgenomen.',
        ],
      },
      {
        h: 'Afbeeldingen en video',
        body: [
          'Elk scherm wordt opgeslagen in 1080 × 1920, het formaat van een Instagram-story. Ook de video wordt in je browser gemaakt; kan jouw browser dat niet, dan heb je altijd nog de afbeelding.',
        ],
      },
      {
        h: 'Als iets er vreemd uitziet',
        body: [
          'De cijfers hangen af van wat je horloge heeft opgenomen: een springende gps of een verkeerd gelabelde activiteit kan een resultaat veranderen. Klopt er iets niet, laat het ons weten via [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'Over {brand}',
    description: 'Wat {brand} is, wie het maakt, hoe het wordt gefinancierd en hoe je contact opneemt.',
    kicker: 'Het project',
    lead: '{brand} maakt van het archief van je Strava-account een verhaal over je hardloopjaar, klaar om te delen. Het is gratis, je hoeft je niet te registreren en je gegevens verlaten je apparaat niet.',
    sections: [
      {
        h: 'Wie erachter zit',
        body: [
          '{brand} is een onafhankelijk project van {owner}, uit Spanje. Het is niet van Strava en heeft er geen band mee: het is compatibel met Strava omdat het het archief leest dat Strava elke gebruiker laat downloaden.',
        ],
      },
      {
        h: 'Hoe het wordt gefinancierd',
        body: [
          { when: 'noads', text: 'De site is gratis en heeft op dit moment geen advertenties. Later kan de site advertenties tonen om de kosten te dekken, altijd buiten je verhaal en je afbeeldingen, en pas nadat je toestemming hebt gegeven voor cookies.' },
          { when: 'ads', text: 'De site is gratis en wordt gefinancierd met advertenties. Die staan alleen op de startpagina, onder je resultaten en op de tekstpagina’s: nooit in je verhaal en nooit op de afbeeldingen die je deelt.' },
        ],
      },
      {
        h: 'Contact',
        body: ['Voor vragen, fouten of suggesties mail je naar [{email}](mail).'],
      },
      {
        h: 'Credits',
        body: [
          'De kaarten gebruiken gegevens van Natural Earth en de stedenlijst komt van GeoNames (CC BY 4.0). De lettertypen zijn Anton, Archivo, Oswald en Noto Sans. Hier vind je de [licenties van de software en gegevens die de site gebruikt](licenses).',
          'Strava is een geregistreerd handelsmerk van Strava, Inc. {brand} is niet gelieerd aan, gesponsord of goedgekeurd door Strava, Inc.',
        ],
      },
    ],
  },

  legal: {
    title: 'Juridische informatie en gebruiksvoorwaarden',
    description: 'Wie de eigenaar van {brand} is, de gebruiksvoorwaarden van de site, intellectueel eigendom en toepasselijk recht.',
    kicker: 'Juridisch',
    lead: 'Wie de eigenaar van deze website is en onder welke voorwaarden je haar mag gebruiken.',
    sections: [
      {
        h: 'Eigenaar van de website',
        body: [
          { when: 'nif', text: 'Op grond van artikel 10 van de Spaanse wet 34/2002 inzake diensten van de informatiemaatschappij en elektronische handel:' },
          '- **Eigenaar:** {owner}',
          { when: 'nif', text: '- **Fiscaal nummer (NIF):** {nif}' },
          { when: 'address', text: '- **Adres:** {address}' },
          '- **E-mail:** [{email}](mail)\n- **Website:** {domain}',
        ],
      },
      {
        h: 'Wat {brand} is',
        body: [
          'Een gratis hulpmiddel dat een jaaroverzicht van je hardlopen maakt op basis van het gegevensarchief dat iedereen uit zijn eigen Strava-account downloadt. Alle berekeningen gebeuren in de browser van degene die het gebruikt.',
        ],
      },
      {
        h: 'Relatie met Strava',
        body: [
          '{brand} is een onafhankelijk project. Het is niet gelieerd aan, gesponsord of goedgekeurd door Strava, Inc., en gebruikt de Strava-API niet. Strava is een geregistreerd handelsmerk van Strava, Inc.; het wordt alleen genoemd om aan te geven dat de site compatibel is met het gegevensarchief dat Strava aan zijn gebruikers levert.',
        ],
      },
      {
        h: 'Gebruiksvoorwaarden',
        body: [
          '- De site is voor persoonlijk gebruik. Gebruik alleen het archief van je eigen account, of dat van iemand anders met diens toestemming.\n- Gebruik de site niet voor onwettige doeleinden of op een manier die haar kan beschadigen of anderen het gebruik kan beletten.\n- De cijfers worden automatisch berekend uit de gegevens in je archief en zijn indicatief: ze kunnen fouten bevatten als de brongegevens die bevatten.\n- De site wordt aangeboden zoals ze is, zonder garantie op beschikbaarheid, en kan veranderen of verdwijnen.',
        ],
      },
      {
        h: 'Intellectueel eigendom',
        body: [
          'Het ontwerp, de code en de teksten van {brand} zijn van de eigenaar. Ze mogen niet zonder toestemming worden gekopieerd of hergebruikt.',
          '**De afbeeldingen en video’s die je met je gegevens maakt, zijn van jou**: je mag ze vrij downloaden en delen.',
          'Software en gegevens van derden die de site gebruikt, houden hun eigen [licenties](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Advertenties',
        body: [
          'De site wordt gefinancierd met advertenties van Google AdSense, die als zodanig herkenbaar zijn. De eigenaar kiest niet welke advertenties worden getoond en is niet verantwoordelijk voor de geadverteerde producten of diensten.',
        ],
      },
      {
        h: 'Aansprakelijkheid',
        body: [
          'De eigenaar is niet aansprakelijk voor schade door oneigenlijk gebruik van de site, noch voor de inhoud van externe websites waarnaar wordt gelinkt. Zie je ongepaste inhoud of een verkeerde link, mail dan naar [{email}](mail).',
        ],
      },
      {
        h: 'Toepasselijk recht',
        body: [
          'Op deze voorwaarden is het Spaanse recht van toepassing. Ben je consument, dan worden geschillen beslecht door de rechter van je woonplaats.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy en cookies',
    description: 'Welke gegevens {brand} verwerkt en welke niet: je Strava-archief verlaat je apparaat niet. Cookies, statistieken, advertenties en je rechten.',
    kicker: 'Juridisch',
    lead: 'De kern: **je Strava-archief verlaat je apparaat niet**. Er zijn geen accounts en geen registratie, en we ontvangen je activiteiten, routes en foto’s niet.',
    sections: [
      {
        h: 'Wie verantwoordelijk is',
        body: [
          '{owner}, eigenaar van {brand}. Voor vragen over je gegevens mail je naar [{email}](mail). De volledige gegevens staan in de [juridische informatie](page:legal).',
        ],
      },
      {
        h: 'Je Strava-archief',
        body: [
          'Als je je archief kiest, **wordt het in je eigen browser gelezen en verwerkt**. Het wordt naar geen enkele server geüpload: we ontvangen het niet, bewaren het niet en kunnen het niet zien. Hetzelfde geldt voor je naam, je routes en je foto’s.',
          'Alles blijft in het geheugen van het tabblad en verdwijnt zodra je het sluit of opnieuw laadt. Afbeeldingen en video’s worden op je apparaat gemaakt en verlaten het alleen als jij ze deelt.',
        ],
      },
      {
        h: 'Technische gegevens van je bezoek',
        body: [
          'Zoals bij elke website verwerkt onze hostingprovider, **Cloudflare**, je IP-adres en technische verbindingsgegevens (browser, datum en tijd, opgevraagde pagina) om je de pagina’s te sturen. Cloudflare gebruikt ze om de site te leveren en tegen aanvallen te beschermen. De rechtsgrond is ons gerechtvaardigd belang om de site veilig aan te bieden (art. 6.1.f AVG).',
          'Cloudflare treedt op als verwerker. Gegevens kunnen buiten de Europese Economische Ruimte worden verwerkt, met de waarborgen van het EU-VS-kader voor gegevensbescherming en standaardcontractbepalingen.',
        ],
      },
      {
        h: 'Bezoekstatistieken',
        body: [
          'We meten bezoeken met **Cloudflare Web Analytics**: paginaweergaven, land bij benadering en type apparaat, altijd samengevoegd. Het gebruikt geen cookies, slaat niets op je apparaat op, identificeert je niet en volgt je niet over andere sites.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies en opslag in je browser',
        body: [
          '{brand} plaatst geen eigen cookies. Het bewaart in je browser alleen **de taal die je kiest** (sleutel ‘myrunyear.lang’ in de lokale opslag), om die bij je volgende bezoek te onthouden. Het is een instelling waar je zelf om vraagt, dus er is geen toestemming voor nodig, en je kunt haar wissen via de instellingen van je browser.',
          { when: 'noads', text: 'Op dit moment toont de site **geen advertenties en gebruikt ze geen cookies van derden**. Als dat verandert, vragen we je eerst om toestemming en werken we deze pagina bij.' },
          { when: 'ads', text: 'De advertenties van **Google AdSense** gebruiken wel cookies en identificatiemiddelen, van Google en zijn partners, om advertenties te tonen en te meten en, als je dat accepteert, te personaliseren. Voordat we ze gebruiken, vragen we je toestemming in een melding waarin je even makkelijk kunt **accepteren, weigeren of instellen**.' },
          { when: 'ads', text: 'Je kunt je keuze altijd wijzigen onder ‘Privacyvoorkeuren’, onderaan elke pagina. Weiger je, dan werkt de site hetzelfde en worden de advertenties niet gepersonaliseerd.' },
          { when: 'ads', text: '- **Wie ze gebruikt:** Google Ireland Limited en de advertentiepartners die in de melding staan.\n- **Waarvoor:** advertenties tonen, beperken hoe vaak je dezelfde ziet, resultaten meten, fraude voorkomen en ze met jouw toestemming personaliseren.\n- **Hoe lang:** van de sessie tot 13 maanden, afhankelijk van de cookie.\n- **Meer informatie:** [hoe Google gegevens gebruikt van sites die zijn advertenties tonen](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Advertenties',
        body: [
          'De rechtsgrond voor gepersonaliseerde advertenties en de bijbehorende cookies is je toestemming (art. 6.1.a AVG), die je op elk moment kunt intrekken. Google verwerkt die gegevens als zelfstandige verwerkingsverantwoordelijke: zie het [privacybeleid van Google](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'Als je ons mailt',
        body: ['We gebruiken je adres en je bericht alleen om te antwoorden, en wissen ze wanneer ze niet meer nodig zijn.'],
      },
      {
        h: 'Je rechten',
        body: [
          'Je kunt vragen om inzage, rectificatie of verwijdering van je gegevens, bezwaar maken tegen de verwerking of vragen die te beperken, door te mailen naar [{email}](mail). Houd er rekening mee dat we je Strava-gegevens niet hebben: ze bereiken ons nooit.',
          'Vind je dat we je verzoek niet goed hebben afgehandeld, dan kun je een klacht indienen bij de Spaanse gegevensbeschermingsautoriteit ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Minderjarigen',
        body: ['De site is niet bedoeld voor kinderen jonger dan 14 jaar.'],
      },
      {
        h: 'Wijzigingen in dit beleid',
        body: ['Als dit beleid verandert, publiceren we hier de nieuwe versie met de datum.'],
      },
    ],
  },
};

export default pages;
