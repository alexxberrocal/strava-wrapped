import type { Lang } from './format';

/** Textos de la web (las tarjetas llevan los suyos). Claves usadas en index.html con data-i18n. */
const STRINGS = {
  'meta.title': ['RUNRECAP · Tu año corriendo, en una historia', 'RUNRECAP · Your running year, as a story'],
  'nav.how': ['Cómo funciona', 'How it works'],
  'nav.faq': ['Preguntas', 'FAQ'],
  'hero.kicker': ['Tu resumen runner del año', 'Your yearly running recap'],
  'hero.title': ['Tu año<br>corriendo,<br><em>contado</em><br>como merece.', 'Your year<br>of running,<br><em>told</em> the way<br>it deserves.'],
  'hero.lead': [
    'Sube el archivo que te da Strava y en un minuto tendrás tu resumen del año: kilómetros, países, tu mapa de calor, tus marcas… listo para compartir en Instagram.',
    'Drop the archive Strava gives you and get your year in a minute: distance, countries, your heatmap, your best efforts… ready to share on Instagram.',
  ],
  'hero.cta': ['Crear mi resumen', 'Create my recap'],
  'hero.demo': ['Ver un ejemplo', 'See an example'],
  'hero.trust': ['Tus datos no salen de tu dispositivo · Gratis · Sin registro', 'Your data never leaves your device · Free · No sign-up'],
  'steps.kicker': ['Cómo funciona', 'How it works'],
  'steps.title': ['3 pasos.<br>5 minutos.', '3 steps.<br>5 minutes.'],
  'step1.title': ['Pide tu archivo a Strava', 'Request your Strava archive'],
  'step1.text': [
    'En strava.com (desde el ordenador o el navegador del móvil): <b>Ajustes → Mi cuenta → Descarga o eliminación de tu cuenta → Comenzar → Solicitar tu archivo</b>.',
    'On strava.com (computer or mobile browser): <b>Settings → My Account → Download or Delete Your Account → Get Started → Request Your Archive</b>.',
  ],
  'step1.cta': ['Abrir Strava', 'Open Strava'],
  'step1.note': ['Tranquilo: no se borra nada, solo te envían una copia.', "Don't worry: nothing gets deleted, they just send you a copy."],
  'step2.title': ['Descarga el .zip', 'Download the .zip'],
  'step2.text': [
    'Strava te envía un email con el enlace (suele tardar minutos, a veces unas horas). Descarga el archivo <b>export_XXXXXXXX.zip</b>. No hace falta descomprimirlo.',
    'Strava emails you a download link (usually minutes, sometimes a few hours). Download <b>export_XXXXXXXX.zip</b>. No need to unzip it.',
  ],
  'step3.title': ['Suéltalo aquí', 'Drop it here'],
  'drop.title': ['Arrastra aquí tu export_XXXX.zip', 'Drag your export_XXXX.zip here'],
  'drop.sub': ['o pulsa para elegirlo', 'or click to choose it'],
  'drop.titleTouch': ['Toca para elegir tu export_XXXX.zip', 'Tap to choose your export_XXXX.zip'],
  'drop.subTouch': ['Suele estar en Descargas o en la app Archivos', 'Usually in Downloads or the Files app'],
  'drop.folder': ['¿Ya lo descomprimiste? Elige la carpeta', 'Already unzipped? Choose the folder'],
  'drop.privacy': ['Se procesa en tu navegador. Nada se sube a ningún servidor.', 'Processed in your browser. Nothing is uploaded anywhere.'],
  'gallery.kicker': ['Lo que vas a ver', "What you'll get"],
  'gallery.title': ['Hasta 20 pantallas<br>de tu año.', 'Up to 20 screens<br>of your year.'],
  'faq.title': ['Preguntas<br>frecuentes', 'Frequently<br>asked questions'],
  'faq.q1': ['¿Mis datos están seguros?', 'Is my data safe?'],
  'faq.a1': [
    'Sí. Todo se calcula en tu navegador: el archivo no se sube a ningún servidor y no guardamos nada. Puedes incluso desconectarte de internet una vez cargada la página.',
    'Yes. Everything is computed in your browser: the file is never uploaded and nothing is stored. You can even go offline once the page has loaded.',
  ],
  'faq.q2': ['¿Necesito Strava Premium?', 'Do I need Strava subscription?'],
  'faq.a2': ['No. Cualquier cuenta de Strava puede descargar su archivo de datos gratis.', 'No. Any Strava account can download its data archive for free.'],
  'faq.q3': ['¿Cuánto tarda Strava en mandarme el archivo?', 'How long does Strava take to send the archive?'],
  'faq.a3': [
    'Normalmente unos minutos, aunque con muchos años de actividades puede tardar algunas horas. Te llega un email con el enlace de descarga.',
    'Usually a few minutes, but with many years of activities it can take a few hours. You get an email with the download link.',
  ],
  'faq.q4': ['Mi archivo pesa muchísimo, ¿pasa algo?', 'My file is huge. Is that a problem?'],
  'faq.a4': [
    'No. Solo leemos lo que necesitamos (tu lista de actividades y las rutas del año elegido), así que funciona incluso con archivos de varios GB.',
    'No. We only read what we need (your activity list and the routes of the selected year), so it works even with multi-GB archives.',
  ],
  'faq.q5': ['¿Funciona desde el móvil?', 'Does it work on my phone?'],
  'faq.a5': [
    'Sí. En iPhone, guarda el .zip en Archivos y elígelo desde aquí. Si tu móvil lo descomprime solo, elige la carpeta.',
    'Yes. On iPhone, save the .zip to Files and pick it from here. If your phone unzips it automatically, choose the folder instead.',
  ],
  'faq.q6': ['¿Por qué no inicio sesión con Strava?', "Why don't I just log in with Strava?"],
  'faq.a6': [
    'Porque así tus datos no pasan por nadie más y no hay límites de uso. A cambio, toca pedir el archivo una vez.',
    'Because this way your data never goes through anyone else and there are no rate limits. The trade-off: you request the archive once.',
  ],
  'faq.q7': ['Corro con Garmin, Coros, Apple Watch…', 'I run with Garmin, Coros, Apple Watch…'],
  'faq.a7': [
    'Da igual: Strava guarda el fichero original de cada actividad (FIT, GPX o TCX) y lo leemos tal cual.',
    "Doesn't matter: Strava keeps the original file of every activity (FIT, GPX or TCX) and we read it as is.",
  ],
  'footer.legal': [
    'Proyecto independiente: no está afiliado, patrocinado ni respaldado por Strava, Inc. Strava es una marca registrada de Strava, Inc.',
    'Independent project: not affiliated with, sponsored or endorsed by Strava, Inc. Strava is a trademark of Strava, Inc.',
  ],
  'footer.credits': ['Mapas: Natural Earth. Ciudades: GeoNames (CC BY 4.0).', 'Maps: Natural Earth. Cities: GeoNames (CC BY 4.0).'],
  // Flujo
  'flow.reading': ['Abriendo tu archivo…', 'Opening your archive…'],
  'flow.scanned': ['{n} actividades encontradas', '{n} activities found'],
  'flow.tracks': ['Analizando tus rutas de {year}', 'Analysing your {year} routes'],
  'flow.geo': ['Ubicando países y ciudades', 'Placing countries and cities'],
  'flow.ready': ['¡Listo!', 'Ready!'],
  'flow.hello': ['¡Hola, {name}!', 'Hi, {name}!'],
  'flow.helloAnon': ['¡Ya casi está!', 'Almost there!'],
  'flow.summary': ['{runs} carreras en {year} · {km}', '{runs} runs in {year} · {km}'],
  'setup.year': ['Año', 'Year'],
  'setup.name': ['Nombre en las tarjetas', 'Name on the cards'],
  'setup.units': ['Unidades', 'Units'],
  'setup.km': ['Kilómetros', 'Kilometres'],
  'setup.mi': ['Millas', 'Miles'],
  'setup.lang': ['Idioma de las tarjetas', 'Card language'],
  'setup.map': ['Mostrar el mapa de calor de mi ciudad', 'Show my city heatmap'],
  'setup.trim': ['Ocultar inicio y fin de cada ruta (protege tu casa)', 'Hide the start and end of each route (protects your home)'],
  'setup.types': ['Qué cuenta como correr', 'What counts as running'],
  'setup.go': ['Ver mi año', 'See my year'],
  'setup.wait': ['Analizando… {pct}', 'Analysing… {pct}'],
  'setup.restart': ['Usar otro archivo', 'Use another file'],
  'err.noCsv': [
    'Este archivo no parece el export de Strava: no encuentro "activities.csv". Busca el .zip que te llegó por email (export_XXXX.zip).',
    "This doesn't look like a Strava export: there's no \"activities.csv\". Look for the .zip from Strava's email (export_XXXX.zip).",
  ],
  'err.badZip': ['No he podido abrir el archivo. ¿Seguro que es un .zip completo? Prueba a descargarlo de nuevo.', "I couldn't open the file. Is it a complete .zip? Try downloading it again."],
  'err.encrypted': ['El .zip está protegido con contraseña.', 'The .zip is password-protected.'],
  'err.noRuns': [
    'No hay carreras en {year}. De momento esto va de running, pero puedes marcar abajo qué tipos de actividad cuentan.',
    'There are no runs in {year}. This is about running for now, but you can choose below which activity types count.',
  ],
  'err.generic': ['Algo ha fallado al leer tu archivo: {msg}', 'Something went wrong reading your archive: {msg}'],
  'err.retry': ['Probar otra vez', 'Try again'],
  // Visor
  'story.share': ['Compartir', 'Share'],
  'story.close': ['Cerrar', 'Close'],
  'story.pause': ['Pausa', 'Pause'],
  'story.play': ['Seguir', 'Play'],
  'story.prev': ['Anterior', 'Previous'],
  'story.next': ['Siguiente', 'Next'],
  'story.demo': ['Ejemplo con datos inventados', 'Example with made-up data'],
  'story.all': ['Ver todas', 'See all'],
  // Resultados
  'results.kicker': ['Tu {year}', 'Your {year}'],
  'results.title': ['Todas tus<br>pantallas', 'All your<br>screens'],
  'results.replay': ['Ver la historia', 'Play the story'],
  'results.zip': ['Descargar todas (.zip)', 'Download all (.zip)'],
  'results.settings': ['Cambiar ajustes', 'Change settings'],
  'results.again': ['Empezar de nuevo', 'Start over'],
  'results.hint': ['Toca una pantalla para compartirla o descargarla.', 'Tap a screen to share or download it.'],
  // Compartir
  'share.title': ['Compartir', 'Share'],
  'share.image': ['Compartir imagen', 'Share image'],
  'share.imageDl': ['Descargar imagen', 'Download image'],
  'share.video': ['Crear vídeo animado', 'Create animated video'],
  'share.videoMaking': ['Creando vídeo… {pct}', 'Creating video… {pct}'],
  'share.videoShare': ['Compartir vídeo', 'Share video'],
  'share.videoDl': ['Descargar vídeo', 'Download video'],
  'share.videoNo': ['Tu navegador no puede crear vídeo. Prueba con Chrome, Edge o Safari actualizados.', "Your browser can't create video. Try an up-to-date Chrome, Edge or Safari."],
  'share.ig': ['Consejo: en Instagram, elige "Historia". La imagen ya tiene el tamaño perfecto (1080×1920).', 'Tip: in Instagram, choose "Story". The image is already the perfect size (1080×1920).'],
  'share.text': ['Mi año corriendo en {brand}', 'My year of running on {brand}'],
  'share.zipMaking': ['Preparando… {pct}', 'Preparing… {pct}'],
} satisfies Record<string, [string, string]>;

export type SiteKey = keyof typeof STRINGS;

let current: Lang = 'es';

export function setSiteLang(lang: Lang) {
  current = lang;
}
export function siteLang(): Lang {
  return current;
}

export function tr(key: SiteKey, vars: Record<string, string | number> = {}, lang: Lang = current): string {
  const pair = STRINGS[key];
  let s = pair ? pair[lang === 'es' ? 0 : 1] : key;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Aplica traducciones a los elementos con data-i18n (texto) y data-i18n-html (HTML de confianza: nuestro diccionario). */
export function applySiteLang(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n as SiteKey);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    el.innerHTML = tr(el.dataset.i18nHtml as SiteKey);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', tr(el.dataset.i18nAria as SiteKey));
  });
  document.documentElement.lang = current;
  document.title = tr('meta.title');
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem('runrecap.lang');
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    /* sin almacenamiento */
  }
  const nav = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
  return nav.startsWith('es') || nav.startsWith('ca') || nav.startsWith('gl') || nav.startsWith('eu') ? 'es' : 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem('runrecap.lang', lang);
  } catch {
    /* nada */
  }
}

/** Millas solo para quien navega en inglés de EE. UU. (o Liberia/Myanmar); en español siempre km. */
export function detectUnits(lang: Lang = current): 'metric' | 'imperial' {
  if (lang === 'es') return 'metric';
  const nav = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  return nav === 'en-us' || nav === 'en-lr' || nav === 'my' ? 'imperial' : 'metric';
}
