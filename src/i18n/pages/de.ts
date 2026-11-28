import type { PagesContent } from './types';

const pages: PagesContent = {
  ui: {
    updated: 'Zuletzt aktualisiert: {date}',
  },

  guide: {
    title: 'So lädst du deine Strava-Daten herunter',
    description: 'Schritt-für-Schritt-Anleitung: das Archiv deines Strava-Kontos (export_XXXX.zip) am Computer oder Handy anfordern und daraus deinen Jahresrückblick machen.',
    kicker: 'Schritt für Schritt',
    lead: 'Strava gibt dir kostenlos eine Kopie deines gesamten Kontos. Das Anfordern dauert eine Minute; danach wartest du nur noch auf eine E-Mail. So geht’s, am Computer oder am Handy.',
    sections: [
      {
        h: 'Was dieses Archiv ist',
        body: [
          'Es ist eine **.zip-Datei mit allem, was du bei Strava hochgeladen hast**: die Liste deiner Aktivitäten, die Originaldatei jeder einzelnen (so wie deine Uhr oder dein Handy sie aufgezeichnet hat), deine Fotos und deine Profildaten. Jedes Konto kann es anfordern, auch ein kostenloses.',
          'Das Anfordern **löscht und ändert nichts**: Strava schickt dir nur eine Kopie.',
        ],
      },
      {
        h: 'Bei Strava anfordern',
        body: [
          '1. Öffne **strava.com** im Browser, am Computer oder am Handy, und melde dich an. In der Strava-App gibt es diese Option nicht.\n2. Tippe auf dein Foto und gehe zu **Einstellungen → Mein Konto → Konto herunterladen → Los geht’s**. Oder nimm direkt [diesen Link zu Strava](strava).\n3. Tippe auf **Archiv anfordern**.',
          'Strava erlaubt nur **eine Anfrage pro Woche**. Hast du es vor Kurzem angefordert, such nach der E-Mail, die du schon bekommen hast.',
        ],
      },
      {
        h: 'Auf die E-Mail warten und die .zip speichern',
        body: [
          'Strava schreibt an die Adresse deines Kontos und schickt einen Download-Link. Meist dauert das ein paar Minuten; bei vielen Jahren voller Aktivitäten auch mehrere Stunden.',
          'Lade das Archiv herunter und behalte die Datei **export_XXXXXXXX.zip** so, wie sie ist, ohne sie zu entpacken.',
          '- **Android:** Sie landet im Ordner „Downloads“.\n- **iPhone:** Safari speichert sie in der App „Dateien“ unter „Downloads“.\n- **Mac:** Safari entpackt sie eventuell automatisch. Kein Problem: Dann wählst du einfach den Ordner.',
        ],
      },
      {
        h: 'Hochladen und dein Jahr ansehen',
        body: [
          'Geh zurück zur [Startseite von {brand}](home#crear) und zieh die .zip in das Feld oder tippe darauf, um sie auszuwählen. In einer Minute ist deine Story fertig. Ist das Archiv schon entpackt, nutze „Schon entpackt? Wähle den Ordner“.',
          'Die Datei wird **auf keinen Server hochgeladen**: Sie wird in deinem eigenen Browser gelesen. Die Details stehen unter [Datenschutz und Cookies](page:privacy).',
        ],
      },
      {
        h: 'Wenn etwas nicht klappt',
        body: [
          '- **Die E-Mail kommt nicht an.** Schau im Spam-Ordner nach und prüfe, ob es die Adresse deines Strava-Kontos ist. Bei vielen Aktivitäten kann es Stunden dauern.\n- **„activities.csv nicht gefunden“.** Diese .zip ist nicht das Archiv deines Kontos: Das richtige heißt export_ gefolgt von einer Nummer.\n- **Die Datei ist mehrere GB groß.** Das macht nichts: Es werden nur die nötigen Teile gelesen.\n- **Es erscheinen keine Läufe oder das falsche Jahr.** Öffne „Anpassen“ und prüfe das Jahr und welche Aktivitätstypen als Laufen zählen.',
          'Geht es immer noch nicht? Schreib uns an [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'So wird dein Rückblick berechnet',
    description: 'Woher jede Zahl deines Laufjahres kommt: Distanz, Bestzeiten, Heatmap, Länder, Herzfrequenz, Läuferprofil … und warum manche Screens nicht erscheinen.',
    kicker: 'Ganz genau',
    lead: 'Alle Zahlen stammen aus dem Archiv deines Strava-Kontos und werden in deinem Browser berechnet. Hier steht wie, Screen für Screen.',
    sections: [
      {
        h: 'Woher die Daten kommen',
        body: [
          'Aus dem Archiv werden zwei Dinge gelesen: **activities.csv**, die Liste all deiner Aktivitäten mit Distanz, Zeit, Höhenmetern und Schuhen; und **die Originaldatei jedes Laufs** (FIT, GPX oder TCX) mit GPS und Herzfrequenz, Sekunde für Sekunde. Ob du mit Garmin, Coros, Apple Watch oder dem Handy läufst, ist egal.',
          'Geöffnet werden nur die Läufe des gewählten Jahres, deshalb funktioniert es auch mit Archiven von mehreren GB.',
        ],
      },
      {
        h: 'Was als Laufen zählt',
        body: [
          'Standardmäßig Aktivitäten vom Typ Lauf, Traillauf und virtueller Lauf. Unter „Anpassen“ kannst du Typen hinzufügen oder entfernen, zum Beispiel Spaziergänge.',
          'Aktivitäten, die schneller sind als der Weltrekord über ihre Distanz, werden aussortiert: Fast immer ist das eine Radtour oder eine Autofahrt, die als Lauf gespeichert wurde.',
        ],
      },
      {
        h: 'Distanz, Zeit und Höhenmeter',
        body: [
          'Es sind dieselben Werte, die du bei Strava siehst. Die Zeit ist die **Bewegungszeit**, ohne Pausen.',
          'Ist das Jahr noch nicht vorbei, vergleicht der Rückblick mit denselben Daten des Vorjahres: wo du „zu diesem Zeitpunkt“ standest.',
        ],
      },
      {
        h: 'Bestzeiten',
        body: [
          'Für jede Distanz (1 km oder 1 Meile, 5 km, 10 km, Halbmarathon und Marathon) wird per GPS **der schnellste Abschnitt innerhalb irgendeines deiner Läufe** gesucht. Es muss kein Wettkampf gewesen sein: Deine besten 5 km stecken vielleicht mitten in einem langen Lauf.',
        ],
      },
      {
        h: 'Karten, Städte und Länder',
        body: [
          'Die Website bringt ihre eigene Weltkarte und Städteliste mit, deshalb werden **deine Koordinaten an keinen Kartendienst gesendet**. Deine Stadt ist die Gegend, in der die meisten Läufe starten.',
          'Damit niemand sieht, wo du wohnst, wird jede Strecke **ohne ihre ersten und letzten 250 Meter** gezeichnet und ohne die Abschnitte in deinen Strava-Privatsphärezonen. Unter „Anpassen“ kannst du das ausschalten und auch die Karte deiner Stadt ausblenden.',
        ],
      },
      {
        h: 'Uhrzeiten und Gewohnheiten',
        body: [
          'Die Uhrzeit jedes Laufs ist die **Ortszeit des Ortes, an dem du gelaufen bist**, auch auf Reisen. Ob du zur goldenen Stunde, bei Sonnenaufgang oder im Dunkeln läufst, ergibt sich aus dem tatsächlichen Sonnenstand an diesem Tag und Ort.',
        ],
      },
      {
        h: 'Herzfrequenz',
        body: [
          'Die Herzschläge werden aus der durchschnittlichen Herzfrequenz und der Dauer jedes Laufs geschätzt. Die fünf Zonen richten sich nach deiner höchsten Herzfrequenz des Jahres: unter 60 %, 60–70 %, 70–80 %, 80–90 % und über 90 %.',
        ],
      },
      {
        h: 'Schuhe',
        body: [
          'Die Kilometer jedes Paars sind die der Läufe, denen du es bei Strava zugeordnet hast. Der Lebensdauer-Balken zählt auch frühere Jahre mit und nimmt etwa 800 km (500 Meilen) als Richtwert.',
        ],
      },
      {
        h: 'Dein Läuferprofil',
        body: [
          'Es ist eines von zehn Profilen: Frühaufsteher, Nachteule, Weltenbummler, Bergziege, Langstreckler, Tempoläufer, Metronom, Wochenendläufer, Laufbandfan oder Allrounder. Gewählt wird, was dich am meisten auszeichnet: deine Uhrzeiten, die Höhenmeter, die Durchschnittsdistanz, das Tempo, die Wochen, in denen du läufst, oder die Orte.',
        ],
      },
      {
        h: 'Warum ein Screen fehlt',
        body: [
          'Jeder Screen braucht eine Mindestmenge an Daten, um etwas Sinnvolles zu sagen. Erreichst du sie nicht, wird er nicht gezeigt. Einige Beispiele:',
          '- **Kalender:** 10 Lauftage.\n- **Höhenmeter:** 300 m insgesamt.\n- **Bestzeiten:** mindestens zwei Distanzen mit GPS.\n- **Karte deiner Stadt:** 5 Strecken in derselben Gegend.\n- **Wo du gelaufen bist:** mehr als eine Stadt oder ein Land.\n- **Schuhe:** ein Paar mit 50 km, das einem guten Teil deiner Läufe zugeordnet ist.\n- **Andere Sportarten:** mindestens zwei weitere Sportarten, die du wirklich betreibst.\n- **Herzfrequenz:** Läufe, die mit Pulsmesser aufgezeichnet wurden.',
        ],
      },
      {
        h: 'Bilder und Video',
        body: [
          'Jeder Screen wird in 1080 × 1920 gespeichert, dem Format einer Instagram-Story. Auch das Video entsteht in deinem Browser; kann deiner das nicht, hast du immer noch das Bild.',
        ],
      },
      {
        h: 'Wenn dir etwas komisch vorkommt',
        body: [
          'Die Zahlen hängen davon ab, was deine Uhr aufgezeichnet hat: Ein springendes GPS oder eine falsch benannte Aktivität können ein Ergebnis verändern. Wenn etwas nicht stimmt, schreib uns an [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'Über {brand}',
    description: 'Was {brand} ist, wer dahintersteckt, wie es sich finanziert und wie du uns erreichst.',
    kicker: 'Das Projekt',
    lead: '{brand} macht aus dem Archiv deines Strava-Kontos eine Story über dein Laufjahr, fertig zum Teilen. Kostenlos, ohne Anmeldung, und deine Daten verlassen dein Gerät nicht.',
    sections: [
      {
        h: 'Wer dahintersteckt',
        body: [
          '{brand} ist ein unabhängiges Projekt von {owner} aus Spanien. Es gehört nicht zu Strava und steht in keiner Verbindung dazu: Es ist mit Strava kompatibel, weil es das Archiv liest, das Strava jede Nutzerin und jeden Nutzer herunterladen lässt.',
        ],
      },
      {
        h: 'Wie es sich finanziert',
        body: [
          { when: 'noads', text: 'Die Website ist kostenlos und zeigt derzeit keine Werbung. Später kann sie Anzeigen einblenden, um ihre Kosten zu decken: immer außerhalb deiner Story und deiner Bilder, und erst nachdem du der Nutzung von Cookies zugestimmt hast.' },
          { when: 'ads', text: 'Die Website ist kostenlos und finanziert sich über Werbung. Anzeigen erscheinen nur auf der Startseite, unter deinen Ergebnissen und auf den Textseiten: nie in deiner Story und nie auf den Bildern, die du teilst.' },
        ],
      },
      {
        h: 'Kontakt',
        body: ['Bei Fragen, Fehlern oder Anregungen schreib an [{email}](mail).'],
      },
      {
        h: 'Credits',
        body: [
          'Die Karten nutzen Daten von Natural Earth, die Städteliste stammt von GeoNames (CC BY 4.0). Die Schriften sind Anton, Archivo, Oswald und Noto Sans. Hier findest du die [Lizenzen der Software und Daten, die die Website verwendet](licenses).',
          'Strava ist eine eingetragene Marke von Strava, Inc. {brand} ist nicht mit Strava, Inc. verbunden und wird von Strava weder gesponsert noch unterstützt.',
        ],
      },
    ],
  },

  legal: {
    title: 'Impressum und Nutzungsbedingungen',
    description: 'Wer {brand} betreibt, die Nutzungsbedingungen der Website, geistiges Eigentum und anwendbares Recht.',
    kicker: 'Rechtliches',
    lead: 'Wer diese Website betreibt und zu welchen Bedingungen sie genutzt werden kann.',
    sections: [
      {
        h: 'Betreiber der Website',
        body: [
          'Gemäß Artikel 10 des spanischen Gesetzes 34/2002 über Dienste der Informationsgesellschaft und den elektronischen Geschäftsverkehr:',
          '- **Betreiber:** {owner}',
          { when: 'nif', text: '- **Steuernummer (NIF):** {nif}' },
          { when: 'address', text: '- **Anschrift:** {address}' },
          '- **E-Mail:** [{email}](mail)\n- **Website:** {domain}',
        ],
      },
      {
        h: 'Was {brand} ist',
        body: [
          'Ein kostenloses Werkzeug, das einen Lauf-Jahresrückblick aus dem Datenarchiv erstellt, das jede Person aus ihrem eigenen Strava-Konto herunterlädt. Die gesamte Berechnung findet im Browser der Person statt, die es nutzt.',
        ],
      },
      {
        h: 'Verhältnis zu Strava',
        body: [
          '{brand} ist ein unabhängiges Projekt. Es ist nicht mit Strava, Inc. verbunden, wird von Strava weder gesponsert noch unterstützt und nutzt nicht die Strava-API. Strava ist eine eingetragene Marke von Strava, Inc.; sie wird nur genannt, um die Kompatibilität mit dem Datenarchiv anzugeben, das Strava seinen Nutzern bereitstellt.',
        ],
      },
      {
        h: 'Nutzungsbedingungen',
        body: [
          '- Die Website ist für den persönlichen Gebrauch gedacht. Verwende nur das Archiv deines eigenen Kontos oder das einer anderen Person mit deren Erlaubnis.\n- Nutze sie nicht für rechtswidrige Zwecke und nicht so, dass sie beschädigt oder andere an der Nutzung gehindert werden könnten.\n- Die Zahlen werden automatisch aus den Daten deines Archivs berechnet und dienen der Orientierung: Sie können Fehler enthalten, wenn die Ausgangsdaten welche enthalten.\n- Die Website wird ohne Gewähr für ihre Verfügbarkeit bereitgestellt und kann sich ändern oder eingestellt werden.',
        ],
      },
      {
        h: 'Geistiges Eigentum',
        body: [
          'Design, Code und Texte von {brand} gehören dem Betreiber. Sie dürfen ohne Genehmigung weder kopiert noch weiterverwendet werden.',
          '**Die Bilder und Videos, die du mit deinen Daten erzeugst, gehören dir**: Du kannst sie frei herunterladen und teilen.',
          'Software und Daten Dritter, die die Website verwendet, behalten ihre eigenen [Lizenzen](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Werbung',
        body: [
          'Die Website finanziert sich über Werbung von Google AdSense, die als solche gekennzeichnet ist. Der Betreiber wählt die einzelnen Anzeigen nicht aus und haftet nicht für die beworbenen Produkte oder Dienstleistungen.',
        ],
      },
      {
        h: 'Haftung',
        body: [
          'Der Betreiber haftet nicht für Schäden aus einer unsachgemäßen Nutzung der Website und nicht für die Inhalte externer Websites, auf die verlinkt wird. Fällt dir ein unpassender Inhalt oder Link auf, schreib an [{email}](mail).',
        ],
      },
      {
        h: 'Anwendbares Recht',
        body: [
          'Für diese Bedingungen gilt spanisches Recht. Bist du Verbraucherin oder Verbraucher, sind für Streitigkeiten die Gerichte deines Wohnsitzes zuständig.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Datenschutz und Cookies',
    description: 'Welche Daten {brand} verarbeitet und welche nicht: Dein Strava-Archiv verlässt dein Gerät nicht. Cookies, Statistiken, Werbung und deine Rechte.',
    kicker: 'Rechtliches',
    lead: 'Das Wichtigste: **Dein Strava-Archiv verlässt dein Gerät nicht**. Es gibt keine Konten und keine Anmeldung, und wir erhalten weder deine Aktivitäten noch deine Strecken oder Fotos.',
    sections: [
      {
        h: 'Wer verantwortlich ist',
        body: [
          '{owner}, Betreiber von {brand}. Bei Fragen zu deinen Daten schreib an [{email}](mail). Die vollständigen Angaben stehen im [Impressum](page:legal).',
        ],
      },
      {
        h: 'Dein Strava-Archiv',
        body: [
          'Wenn du dein Archiv auswählst, **wird es in deinem eigenen Browser gelesen und verarbeitet**. Es wird auf keinen Server hochgeladen: Wir erhalten es nicht, speichern es nicht und können es nicht sehen. Dasselbe gilt für deinen Namen, deine Strecken und deine Fotos.',
          'Alles bleibt im Speicher des Tabs und verschwindet, sobald du ihn schließt oder neu lädst. Bilder und Videos entstehen auf deinem Gerät und verlassen es nur, wenn du sie teilst.',
        ],
      },
      {
        h: 'Technische Daten deines Besuchs',
        body: [
          'Wie bei jeder Website verarbeitet unser Hosting-Anbieter **Cloudflare** deine IP-Adresse und technische Verbindungsdaten (Browser, Datum und Uhrzeit, aufgerufene Seite), um dir die Seiten zu schicken. Er nutzt sie, um die Website auszuliefern und vor Angriffen zu schützen. Rechtsgrundlage ist unser berechtigtes Interesse, die Website sicher anzubieten (Art. 6 Abs. 1 lit. f DSGVO).',
          'Cloudflare handelt als Auftragsverarbeiter. Daten können außerhalb des Europäischen Wirtschaftsraums verarbeitet werden, abgesichert durch das EU-US-Datenschutzrahmenabkommen und Standardvertragsklauseln.',
        ],
      },
      {
        h: 'Besuchsstatistiken',
        body: [
          'Wir messen Besuche mit **Cloudflare Web Analytics**: Seitenaufrufe, ungefähres Land und Gerätetyp, immer nur zusammengefasst. Es verwendet keine Cookies, speichert nichts auf deinem Gerät, identifiziert dich nicht und verfolgt dich nicht über andere Websites.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies und Speicher in deinem Browser',
        body: [
          '{brand} setzt keine eigenen Cookies. Es speichert in deinem Browser nur **die Sprache, die du wählst** (Schlüssel „myrunyear.lang“ im lokalen Speicher), um sie sich für deinen nächsten Besuch zu merken. Diese Einstellung nimmst du selbst vor, daher ist keine Einwilligung nötig, und du kannst sie in den Browser-Einstellungen löschen.',
          { when: 'noads', text: 'Derzeit zeigt die Website **keine Werbung und verwendet keine Cookies von Dritten**. Sollte sich das ändern, fragen wir dich vorher um Erlaubnis und aktualisieren diese Seite.' },
          { when: 'ads', text: 'Die Werbung von **Google AdSense** verwendet dagegen Cookies und Kennungen von Google und seinen Partnern, um Anzeigen auszuliefern und zu messen und sie, wenn du zustimmst, zu personalisieren. Vorher bitten wir dich in einem Hinweis um Erlaubnis, in dem du genauso einfach **zustimmen, ablehnen oder einstellen** kannst.' },
          { when: 'ads', text: 'Deine Auswahl kannst du jederzeit unter „Datenschutz-Einstellungen“ am Ende jeder Seite ändern. Lehnst du ab, funktioniert die Website genauso und die Anzeigen werden nicht personalisiert.' },
          { when: 'ads', text: '- **Wer sie nutzt:** Google Ireland Limited und die im Hinweis genannten Werbepartner.\n- **Wofür:** Anzeigen ausliefern, begrenzen, wie oft du dieselbe siehst, Ergebnisse messen, Betrug verhindern und sie mit deiner Erlaubnis personalisieren.\n- **Wie lange:** von der Sitzung bis zu 13 Monaten, je nach Cookie.\n- **Mehr dazu:** [wie Google Daten von Websites nutzt, die seine Anzeigen zeigen](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Werbung',
        body: [
          'Rechtsgrundlage für personalisierte Werbung und ihre Cookies ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du jederzeit widerrufen kannst. Google verarbeitet diese Daten als eigenständiger Verantwortlicher: siehe die [Datenschutzerklärung von Google](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'Wenn du uns schreibst',
        body: ['Wir verwenden deine Adresse und deine Nachricht nur, um dir zu antworten, und löschen sie, sobald sie nicht mehr gebraucht werden.'],
      },
      {
        h: 'Deine Rechte',
        body: [
          'Du kannst Auskunft über deine Daten, ihre Berichtigung oder Löschung verlangen, der Verarbeitung widersprechen oder ihre Einschränkung verlangen: Schreib dazu an [{email}](mail). Bedenke, dass wir deine Strava-Daten nicht haben: Sie erreichen uns nie.',
          'Wenn du meinst, dass wir deine Anfrage nicht richtig bearbeitet haben, kannst du dich bei der spanischen Datenschutzbehörde beschweren ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Minderjährige',
        body: ['Die Website richtet sich nicht an Kinder unter 14 Jahren.'],
      },
      {
        h: 'Änderungen dieser Erklärung',
        body: ['Ändert sich diese Erklärung, veröffentlichen wir hier die neue Fassung mit Datum.'],
      },
    ],
  },
};

export default pages;
