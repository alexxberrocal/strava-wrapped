import type { PagesContent } from './types';

const pages: PagesContent = {
  ui: {
    updated: 'Dernière mise à jour : {date}',
  },

  guide: {
    title: 'Comment télécharger tes données Strava',
    description: 'Guide pas à pas pour demander l’archive de ton compte Strava (export_XXXX.zip) depuis un ordinateur ou un téléphone et en faire le bilan de ton année.',
    kicker: 'Guide pas à pas',
    lead: 'Strava te donne gratuitement une copie de tout ton compte. La demander prend une minute ; ensuite, il suffit d’attendre un e-mail. Voici comment faire, depuis un ordinateur ou un téléphone.',
    sections: [
      {
        h: 'C’est quoi, cette archive',
        body: [
          'C’est un **.zip avec tout ce que tu as envoyé sur Strava** : la liste de tes activités, le fichier d’origine de chacune (celui enregistré par ta montre ou ton téléphone), tes photos et les données de ton profil. Tous les comptes peuvent la demander, même gratuits.',
          'La demander **ne supprime et ne modifie rien** : Strava t’envoie simplement une copie.',
        ],
      },
      {
        h: 'Demande-la sur Strava',
        body: [
          '1. Ouvre **strava.com** dans un navigateur, sur ordinateur ou sur téléphone, et connecte-toi. L’application Strava ne propose pas cette option.\n2. Touche ta photo et va dans **Paramètres → Mon compte → Télécharger votre compte → Commencer**. Ou vas-y directement avec [ce lien vers Strava](strava).\n3. Touche **Demander l’archive**.',
          'Strava n’autorise qu’**une demande par semaine**. Si tu l’as faite récemment, cherche l’e-mail déjà reçu.',
        ],
      },
      {
        h: 'Attends l’e-mail et garde le .zip',
        body: [
          'Strava écrit à l’adresse de ton compte, avec un lien de téléchargement. Cela prend en général quelques minutes ; avec beaucoup d’années d’activités, plusieurs heures.',
          'Télécharge l’archive et garde le fichier **export_XXXXXXXX.zip** tel quel, sans le décompresser.',
          '- **Android :** il arrive dans le dossier Téléchargements.\n- **iPhone :** Safari l’enregistre dans l’app Fichiers, dans Téléchargements.\n- **Mac :** Safari peut le décompresser tout seul. Aucun souci : tu pourras choisir le dossier.',
        ],
      },
      {
        h: 'Envoie-le et découvre ton année',
        body: [
          'Reviens sur la [page d’accueil de {brand}](home#crear) et dépose le .zip dans le cadre, ou touche-le pour le choisir. Ta story est prête en une minute. S’il est déjà décompressé, utilise « Déjà décompressé ? Choisis le dossier ».',
          'Le fichier **n’est envoyé sur aucun serveur** : il est lu dans ton propre navigateur. Les détails sont dans [Confidentialité et cookies](page:privacy).',
        ],
      },
      {
        h: 'Si quelque chose coince',
        body: [
          '- **L’e-mail n’arrive pas.** Regarde dans les indésirables et vérifie que c’est bien l’adresse de ton compte Strava. Avec beaucoup d’activités, cela peut prendre des heures.\n- **« Je ne trouve pas activities.csv ».** Ce .zip n’est pas l’archive de ton compte : la bonne s’appelle export_ suivi d’un numéro.\n- **Le fichier pèse plusieurs Go.** Peu importe : seules les parties nécessaires sont lues.\n- **Aucune course n’apparaît, ou ce n’est pas la bonne année.** Ouvre « Personnaliser » et vérifie l’année et les types d’activité qui comptent comme course.',
          'Toujours bloqué ? Écris-nous à [{email}](mail).',
        ],
      },
    ],
  },

  how: {
    title: 'Comment ton bilan est calculé',
    description: 'D’où vient chaque chiffre de ton année de course : distance, meilleurs temps, carte de chaleur, pays, cardio, profil de coureur… et pourquoi certains écrans n’apparaissent pas.',
    kicker: 'Dans le détail',
    lead: 'Tous les chiffres viennent de l’archive de ton compte Strava et sont calculés dans ton navigateur. Voici comment, écran par écran.',
    sections: [
      {
        h: 'D’où viennent les données',
        body: [
          'Deux choses sont lues dans l’archive : **activities.csv**, la liste de toutes tes activités avec leur distance, leur durée, leur dénivelé et leurs chaussures ; et **le fichier d’origine de chaque course** (FIT, GPX ou TCX), avec le GPS et le cardio seconde par seconde. Peu importe que tu coures avec Garmin, Coros, Apple Watch ou ton téléphone.',
          'Seules les courses de l’année choisie sont ouvertes : ça marche donc aussi avec des archives de plusieurs Go.',
        ],
      },
      {
        h: 'Ce qui compte comme course',
        body: [
          'Par défaut, les activités de type course à pied, trail et course virtuelle. Dans « Personnaliser », tu peux ajouter ou retirer des types : les marches, par exemple.',
          'Les activités plus rapides que le record du monde de leur distance sont écartées : ce sont presque toujours une sortie à vélo ou un trajet en voiture enregistrés comme course.',
        ],
      },
      {
        h: 'Distance, durée et dénivelé',
        body: [
          'Ce sont les mêmes valeurs que sur Strava. La durée est le **temps de déplacement**, sans les pauses.',
          'Si l’année n’est pas finie, la comparaison avec la précédente porte sur les mêmes dates : là où tu en étais « à la même période ».',
        ],
      },
      {
        h: 'Meilleurs temps',
        body: [
          'Pour chaque distance (1 km ou 1 mile, 5 km, 10 km, semi-marathon et marathon), on cherche **le tronçon le plus rapide dans n’importe laquelle de tes courses**, grâce au GPS. Pas besoin que ce soit une compétition : ton meilleur 5 km se cache peut-être au milieu d’une sortie longue.',
        ],
      },
      {
        h: 'Cartes, villes et pays',
        body: [
          'Le site embarque sa propre carte du monde et sa liste de villes : **tes coordonnées ne sont envoyées à aucun service de cartographie**. Ta ville est la zone où commencent le plus de courses.',
          'Pour ne pas montrer où tu habites, chaque parcours est dessiné **sans ses 250 premiers et derniers mètres** et sans les portions situées dans tes zones de confidentialité Strava. Tu peux le désactiver dans « Personnaliser », et aussi masquer la carte de ta ville.',
        ],
      },
      {
        h: 'Horaires et habitudes',
        body: [
          'L’heure de chaque course est l’**heure locale de l’endroit où tu as couru**, même en voyage. Pour savoir si tu cours à l’heure dorée, au lever du soleil ou de nuit, on calcule la position réelle du soleil ce jour-là à cet endroit.',
        ],
      },
      {
        h: 'Cardio',
        body: [
          'Les battements sont estimés à partir de la fréquence cardiaque moyenne et de la durée de chaque course. Les cinq zones sont établies à partir de ta fréquence maximale de l’année : moins de 60 %, 60–70 %, 70–80 %, 80–90 % et plus de 90 %.',
        ],
      },
      {
        h: 'Chaussures',
        body: [
          'Les kilomètres de chaque paire sont ceux des courses où tu l’as associée sur Strava. La barre de durée de vie compte aussi les années précédentes et prend comme repère environ 800 km (500 miles).',
        ],
      },
      {
        h: 'Ton profil de coureur',
        body: [
          'C’est l’un des dix profils : lève-tôt, oiseau de nuit, globe-trotter, montagnard, endurant, rapide, régulier, coureur du week-end, adepte du tapis ou polyvalent. Il est choisi selon ce qui te distingue le plus : tes horaires, le dénivelé, la distance moyenne, l’allure, les semaines où tu sors ou les endroits où tu cours.',
        ],
      },
      {
        h: 'Pourquoi il manque un écran',
        body: [
          'Chaque écran a besoin d’un minimum de données pour dire quelque chose de pertinent. Si tu ne l’atteins pas, il n’est pas affiché. Quelques exemples :',
          '- **Calendrier :** 10 jours de course.\n- **Dénivelé :** 300 m cumulés.\n- **Meilleurs temps :** au moins deux distances avec GPS.\n- **Carte de ta ville :** 5 parcours dans la même zone.\n- **Où tu as couru :** plus d’une ville ou d’un pays.\n- **Chaussures :** une paire avec 50 km, associée à une bonne partie de tes courses.\n- **Autres sports :** au moins deux autres sports pratiqués régulièrement.\n- **Cardio :** des courses enregistrées avec un capteur cardiaque.',
        ],
      },
      {
        h: 'Images et vidéo',
        body: [
          'Chaque écran est enregistré en 1080 × 1920, le format d’une story Instagram. La vidéo est elle aussi créée dans ton navigateur ; si le tien ne le permet pas, tu as toujours l’image.',
        ],
      },
      {
        h: 'Si quelque chose te paraît bizarre',
        body: [
          'Les chiffres dépendent de ce que ta montre a enregistré : un GPS qui saute ou une activité mal étiquetée peuvent changer un résultat. Si quelque chose ne colle pas, dis-le-nous à [{email}](mail).',
        ],
      },
    ],
  },

  about: {
    title: 'À propos de {brand}',
    description: 'Ce qu’est {brand}, qui le fait, comment il est financé et comment nous contacter.',
    kicker: 'Le projet',
    lead: '{brand} transforme l’archive de ton compte Strava en une story de ton année de course, prête à partager. C’est gratuit, sans inscription, et tes données ne quittent pas ton appareil.',
    sections: [
      {
        h: 'Qui est derrière',
        body: [
          '{brand} est un projet indépendant créé par {owner}, en Espagne. Il n’appartient pas à Strava et n’a aucun lien avec elle : il est compatible avec Strava parce qu’il lit l’archive que Strava laisse télécharger à tout utilisateur.',
        ],
      },
      {
        h: 'Comment il est financé',
        body: [
          { when: 'noads', text: 'Le site est gratuit et n’affiche pour l’instant aucune publicité. Plus tard, il pourra montrer des annonces pour couvrir ses coûts, toujours en dehors de ta story et de tes images, et en te demandant ton accord avant d’utiliser des cookies.' },
          { when: 'ads', text: 'Le site est gratuit et financé par la publicité. Les annonces apparaissent uniquement sur la page d’accueil, sous tes résultats et sur les pages de texte : jamais dans ta story ni sur les images que tu partages.' },
        ],
      },
      {
        h: 'Contact',
        body: ['Pour une question, un bug ou une suggestion, écris à [{email}](mail).'],
      },
      {
        h: 'Crédits',
        body: [
          'Les cartes utilisent les données de Natural Earth et la liste des villes vient de GeoNames (CC BY 4.0). Les polices sont Anton, Archivo, Oswald et Noto Sans. Voici les [licences des logiciels et des données utilisés par le site](licenses).',
          'Strava est une marque déposée de Strava, Inc. {brand} n’est ni affilié à Strava, Inc., ni sponsorisé ou approuvé par elle.',
        ],
      },
    ],
  },

  legal: {
    title: 'Mentions légales et conditions d’utilisation',
    description: 'Qui est le responsable de {brand}, conditions d’utilisation du site, propriété intellectuelle et droit applicable.',
    kicker: 'Mentions légales',
    lead: 'Qui est le responsable de ce site et dans quelles conditions il peut être utilisé.',
    sections: [
      {
        h: 'Éditeur du site',
        body: [
          { when: 'nif', text: 'Conformément à l’article 10 de la loi espagnole 34/2002 sur les services de la société de l’information et le commerce électronique :' },
          '- **Éditeur :** {owner}',
          { when: 'nif', text: '- **Numéro d’identification fiscale (NIF) :** {nif}' },
          { when: 'address', text: '- **Adresse :** {address}' },
          '- **E-mail :** [{email}](mail)\n- **Site web :** {domain}',
        ],
      },
      {
        h: 'Ce qu’est {brand}',
        body: [
          'Un outil gratuit qui génère un bilan annuel de course à pied à partir de l’archive de données que chacun télécharge depuis son propre compte Strava. Tout le calcul se fait dans le navigateur de la personne qui l’utilise.',
        ],
      },
      {
        h: 'Relation avec Strava',
        body: [
          '{brand} est un projet indépendant. Il n’est ni affilié à Strava, Inc., ni sponsorisé ou approuvé par elle, et n’utilise pas son API. Strava est une marque déposée de Strava, Inc. ; elle n’est mentionnée que pour indiquer la compatibilité avec l’archive de données que Strava fournit à ses utilisateurs.',
        ],
      },
      {
        h: 'Conditions d’utilisation',
        body: [
          '- Le site est destiné à un usage personnel. N’utilise que l’archive de ton propre compte, ou celle d’une autre personne avec son accord.\n- Ne l’utilise pas à des fins illicites ni d’une manière qui pourrait l’endommager ou empêcher d’autres personnes de s’en servir.\n- Les chiffres sont calculés automatiquement à partir des données de ton archive et sont indicatifs : ils peuvent contenir des erreurs si les données d’origine en contiennent.\n- Le site est fourni tel quel, sans garantie de disponibilité, et peut évoluer ou cesser d’être disponible.',
        ],
      },
      {
        h: 'Propriété intellectuelle',
        body: [
          'Le design, le code et les textes de {brand} appartiennent à son éditeur. Il est interdit de les copier ou de les réutiliser sans autorisation.',
          '**Les images et les vidéos que tu génères avec tes données t’appartiennent** : tu peux les télécharger et les partager librement.',
          'Les logiciels et les données de tiers utilisés par le site conservent leurs propres [licences](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Publicité',
        body: [
          'Le site est financé par la publicité diffusée par Google AdSense, identifiée comme telle. L’éditeur ne choisit pas les annonces affichées et n’est pas responsable des produits ou services annoncés.',
        ],
      },
      {
        h: 'Responsabilité',
        body: [
          'L’éditeur ne répond pas des dommages résultant d’une utilisation inappropriée du site, ni du contenu des sites externes vers lesquels il renvoie. Si tu repères un contenu ou un lien inapproprié, écris à [{email}](mail).',
        ],
      },
      {
        h: 'Droit applicable',
        body: [
          'Ces conditions sont régies par le droit espagnol. Si tu es un consommateur, tout litige sera porté devant les tribunaux de ton lieu de résidence.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Confidentialité et cookies',
    description: 'Quelles données {brand} traite, et lesquelles non : ton archive Strava ne quitte pas ton appareil. Cookies, statistiques, publicité et tes droits.',
    kicker: 'Mentions légales',
    lead: 'L’essentiel : **ton archive Strava ne quitte pas ton appareil**. Il n’y a ni compte ni inscription, et nous ne recevons ni tes activités, ni tes parcours, ni tes photos.',
    sections: [
      {
        h: 'Qui est responsable',
        body: [
          '{owner}, éditeur de {brand}. Pour toute question sur tes données, écris à [{email}](mail). Ses coordonnées complètes figurent dans les [mentions légales](page:legal).',
        ],
      },
      {
        h: 'Ton archive Strava',
        body: [
          'Quand tu choisis ton archive, **elle est lue et traitée dans ton propre navigateur**. Elle n’est envoyée sur aucun serveur : nous ne la recevons pas, nous ne la conservons pas et nous ne pouvons pas la voir. Il en va de même pour ton nom, tes parcours et tes photos.',
          'Tout reste dans la mémoire de l’onglet et disparaît quand tu le fermes ou le recharges. Les images et les vidéos sont créées sur ton appareil, et n’en sortent que si tu les partages.',
        ],
      },
      {
        h: 'Données techniques de ta visite',
        body: [
          'Comme sur tout site web, pour t’envoyer les pages, notre hébergeur, **Cloudflare**, traite ton adresse IP et des données techniques de connexion (navigateur, date et heure, page demandée). Il s’en sert pour servir le site et le protéger des attaques. La base légale est notre intérêt légitime à proposer le site en toute sécurité (art. 6.1.f du RGPD).',
          'Cloudflare agit en tant que sous-traitant. Il peut traiter des données en dehors de l’Espace économique européen, avec les garanties du cadre de protection des données UE–États-Unis et des clauses contractuelles types.',
        ],
      },
      {
        h: 'Statistiques de visites',
        body: [
          'Nous mesurons les visites avec **Cloudflare Web Analytics** : pages vues, pays approximatif et type d’appareil, toujours de façon agrégée. Il n’utilise pas de cookies, n’enregistre rien sur ton appareil, ne t’identifie pas et ne te suit pas sur d’autres sites.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies et stockage dans ton navigateur',
        body: [
          '{brand} ne dépose aucun cookie propre. Il enregistre seulement dans ton navigateur **la langue que tu choisis** (clé « myrunyear.lang » du stockage local), pour s’en souvenir à ta prochaine visite. C’est un réglage que tu demandes toi-même : il ne nécessite donc pas de consentement, et tu peux l’effacer depuis les réglages de ton navigateur.',
          { when: 'noads', text: 'Pour l’instant, le site **n’affiche aucune publicité et n’utilise aucun cookie tiers**. Si cela change, nous te demanderons ton accord avant et nous mettrons cette page à jour.' },
          { when: 'ads', text: 'La publicité **Google AdSense**, elle, utilise des cookies et des identifiants, de Google et de ses partenaires, pour afficher et mesurer les annonces et, si tu l’acceptes, les personnaliser. Avant de les utiliser, nous te demandons ton accord dans une fenêtre où tu peux **accepter, refuser ou paramétrer** aussi facilement.' },
          { when: 'ads', text: 'Tu peux modifier ton choix quand tu veux dans « Préférences de confidentialité », en bas de chaque page. Si tu les refuses, le site fonctionne de la même façon et les annonces ne sont pas personnalisées.' },
          { when: 'ads', text: '- **Qui les utilise :** Google Ireland Limited et les partenaires publicitaires indiqués dans la fenêtre.\n- **Pour quoi :** afficher des annonces, limiter le nombre de fois où tu vois la même, mesurer leurs résultats, lutter contre la fraude et, avec ton accord, les personnaliser.\n- **Combien de temps :** de la session jusqu’à 13 mois, selon le cookie.\n- **En savoir plus :** [comment Google utilise les données des sites qui affichent ses annonces](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Publicité',
        body: [
          'La base légale de la publicité personnalisée et de ses cookies est ton consentement (art. 6.1.a du RGPD), que tu peux retirer à tout moment. Google traite ces données en tant que responsable de traitement indépendant : consulte ses [règles de confidentialité](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'Si tu nous écris',
        body: ['Nous utiliserons ton adresse et ton message uniquement pour te répondre, et nous les supprimerons lorsqu’ils ne seront plus nécessaires.'],
      },
      {
        h: 'Tes droits',
        body: [
          'Tu peux demander l’accès à tes données, leur rectification ou leur suppression, t’opposer à leur traitement ou en demander la limitation, en écrivant à [{email}](mail). Garde en tête que nous n’avons pas tes données Strava : elles ne nous parviennent jamais.',
          'Si tu estimes que ta demande n’a pas été bien traitée, tu peux déposer une réclamation auprès de l’Agence espagnole de protection des données ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Mineurs',
        body: ['Le site ne s’adresse pas aux enfants de moins de 14 ans.'],
      },
      {
        h: 'Modifications de cette politique',
        body: ['Si cette politique change, nous publierons ici la nouvelle version avec sa date.'],
      },
    ],
  },
};

export default pages;
