import type { PagesContent } from './types';

/** Páginas de texto en español (idioma de referencia: los demás siguen su estructura). */
const pages: PagesContent = {
  ui: {
    updated: 'Última actualización: {date}',
  },

  // ------------------------------------------------------------------ Guía
  guide: {
    title: 'Cómo descargar tus datos de Strava',
    description: 'Guía paso a paso para pedir el archivo de tu cuenta de Strava (export_XXXX.zip) desde el ordenador o el móvil y convertirlo en tu resumen del año.',
    kicker: 'Guía paso a paso',
    lead: 'Strava te da gratis una copia de toda tu cuenta. Pedirla lleva un minuto; después solo hay que esperar un correo. Así se hace, desde el ordenador o desde el móvil.',
    sections: [
      {
        h: 'Qué es ese archivo',
        body: [
          'Es un **.zip con todo lo que has subido a Strava**: la lista de tus actividades, el fichero original de cada una (el que grabó tu reloj o tu móvil), tus fotos y los datos de tu perfil. Lo puede pedir cualquier cuenta, también las gratuitas.',
          'Pedirlo **no borra ni cambia nada**: Strava solo te manda una copia.',
        ],
      },
      {
        h: 'Pídelo en Strava',
        body: [
          '1. Entra en **strava.com** desde el navegador, en el ordenador o en el móvil, e inicia sesión. En la app de Strava no está esta opción.\n2. Pulsa tu foto y ve a **Configuración → Mi cuenta → Descarga tu cuenta → Comenzar**. O ve directo con [este enlace a Strava](strava).\n3. Pulsa **Solicitar descarga**.',
          'Strava solo deja pedirlo **una vez por semana**. Si lo pediste hace poco, busca el correo que ya te enviaron.',
        ],
      },
      {
        h: 'Espera el correo y guarda el .zip',
        body: [
          'Strava te escribe a la dirección de tu cuenta («Tu archivo de Strava está listo para descargarse»). Suele tardar unos minutos; con muchos años de actividades, varias horas.',
          'Pulsa **Descargar archivo** y guarda el **export_XXXXXXXX.zip** tal cual, sin descomprimirlo.',
          '- **Android:** se queda en la carpeta Descargas.\n- **iPhone:** Safari lo guarda en la app Archivos, dentro de Descargas.\n- **Mac:** Safari puede descomprimirlo solo. No pasa nada: luego podrás elegir la carpeta.',
        ],
      },
      {
        h: 'Súbelo y mira tu año',
        body: [
          'Vuelve a la [portada de {brand}](home#crear) y suelta el .zip en el recuadro, o tócalo para elegirlo. En un minuto tendrás tu historia. Si ya está descomprimido, usa «¿Ya lo descomprimiste? Elige la carpeta».',
          'El archivo **no se sube a ningún servidor**: se lee en tu propio navegador. Los detalles están en [Privacidad y cookies](page:privacy).',
        ],
      },
      {
        h: 'Si algo no sale',
        body: [
          '- **No llega el correo.** Mira en spam y comprueba que es la dirección de tu cuenta de Strava. Con muchas actividades puede tardar horas.\n- **«No encuentro activities.csv».** Ese .zip no es el de tu cuenta: el bueno se llama export_ seguido de un número.\n- **El archivo pesa varios GB.** No importa: solo se leen las partes necesarias.\n- **No aparecen carreras o sale otro año.** Abre «Personalizar» y revisa el año y qué tipos de actividad cuentan como correr.',
          '¿Sigue sin funcionar? Escríbenos a [{email}](mail).',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ Cómo se calcula
  how: {
    title: 'Cómo se calcula tu resumen',
    description: 'De dónde sale cada cifra de tu año corriendo: distancia, mejores marcas, mapa de calor, países, pulso, perfil runner… y por qué algunas pantallas no aparecen.',
    kicker: 'Con todo detalle',
    lead: 'Todas las cifras salen del archivo de tu cuenta de Strava y se calculan en tu navegador. Aquí explicamos cómo, pantalla a pantalla.',
    sections: [
      {
        h: 'De dónde salen los datos',
        body: [
          'Del archivo se leen dos cosas: **activities.csv**, la lista de todas tus actividades con su distancia, tiempo, desnivel y zapatillas; y **el fichero original de cada carrera** (FIT, GPX o TCX), con el GPS y el pulso segundo a segundo. Da igual que corras con Garmin, Coros, Apple Watch o el móvil.',
          'Solo se abren las carreras del año elegido, así que funciona también con archivos de varios GB.',
        ],
      },
      {
        h: 'Qué cuenta como correr',
        body: [
          'Por defecto, las actividades de tipo carrera, trail y carrera virtual. En «Personalizar» puedes añadir o quitar tipos: por ejemplo, las caminatas.',
          'Las actividades más rápidas que el récord del mundo de su distancia se descartan: casi siempre son una salida en bici o un trayecto en coche guardados como carrera.',
        ],
      },
      {
        h: 'Distancia, tiempo y desnivel',
        body: [
          'Son los mismos valores que ves en Strava. El tiempo es **tiempo en movimiento**, sin las pausas.',
          'Si el año no ha terminado, la comparación con el anterior usa las mismas fechas: lo que llevabas «a estas alturas».',
        ],
      },
      {
        h: 'Mejores marcas',
        body: [
          'Para cada distancia (1 km o 1 milla, 5K, 10K, media maratón y maratón) se busca **el tramo más rápido dentro de cualquiera de tus carreras**, con el GPS. No hace falta que fuera una competición: tu mejor 5K puede estar en mitad de una tirada larga.',
        ],
      },
      {
        h: 'Mapas, ciudades y países',
        body: [
          'La web lleva su propio mapa del mundo y su lista de ciudades, así que **tus coordenadas no se envían a ningún servicio de mapas**. Tu ciudad es la zona donde empiezan más carreras.',
          'Para no enseñar dónde vives, cada ruta se dibuja **sin sus primeros y últimos 250 metros** y sin los tramos que caen en tus zonas de privacidad de Strava. Puedes desactivarlo en «Personalizar», y también ocultar el mapa de tu ciudad.',
        ],
      },
      {
        h: 'Horas y hábitos',
        body: [
          'La hora de cada carrera es la **hora local del lugar donde corriste**, también si estabas de viaje. Para saber si sales en la hora dorada, al amanecer o de noche se calcula la posición real del sol ese día en ese sitio.',
        ],
      },
      {
        h: 'Pulso',
        body: [
          'Los latidos se estiman con el pulso medio y la duración de cada carrera. Las cinco zonas se reparten a partir de tu pulso máximo del año: menos del 60 %, 60–70 %, 70–80 %, 80–90 % y más del 90 %.',
        ],
      },
      {
        h: 'Zapatillas',
        body: [
          'Los kilómetros de cada par son los de las carreras en las que lo tienes asignado en Strava. La barra de vida útil cuenta también los de años anteriores y toma como referencia unos 800 km (500 millas).',
        ],
      },
      {
        h: 'Tu perfil runner',
        body: [
          'Es uno de diez perfiles: madrugador, nocturno, trotamundos, de montaña, de fondo, veloz, constante, de fin de semana, de cinta o todoterreno. Se elige según lo que más te distingue: tus horarios, el desnivel, la distancia media, el ritmo, las semanas que sales o los sitios donde corres.',
        ],
      },
      {
        h: 'Por qué no veo alguna pantalla',
        body: [
          'Cada pantalla pide un mínimo de datos para decir algo con sentido. Si no llegas, no se enseña. Algunos ejemplos:',
          '- **Calendario:** 10 días corriendo.\n- **Desnivel:** 300 m acumulados.\n- **Mejores marcas:** al menos dos distancias con GPS.\n- **Mapa de tu ciudad:** 5 rutas en la misma zona.\n- **Dónde corriste:** más de una ciudad o país.\n- **Zapatillas:** un par con 50 km y asignado en buena parte de tus carreras.\n- **Otros deportes:** al menos dos deportes más con cierta dedicación.\n- **Pulso:** carreras grabadas con pulsómetro.',
        ],
      },
      {
        h: 'Imágenes y vídeo',
        body: [
          'Cada pantalla se guarda a 1080 × 1920, el tamaño de una historia de Instagram. El vídeo se crea también en tu navegador; si el tuyo no puede, siempre tienes la imagen.',
        ],
      },
      {
        h: 'Si ves algo raro',
        body: [
          'Las cifras dependen de lo que guardó tu reloj: un GPS con saltos o una actividad mal etiquetada pueden cambiar un resultado. Si algo no cuadra, cuéntanoslo en [{email}](mail).',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ Sobre el proyecto
  about: {
    title: 'Sobre {brand}',
    description: 'Qué es {brand}, quién lo hace, cómo se mantiene y cómo contactar.',
    kicker: 'El proyecto',
    lead: '{brand} convierte el archivo de tu cuenta de Strava en una historia con tu año corriendo, lista para compartir. Es gratis, no pide registro y tus datos no salen de tu dispositivo.',
    sections: [
      {
        h: 'Quién está detrás',
        body: [
          '{brand} es un proyecto independiente creado por {owner}, en España. No pertenece a Strava ni tiene relación con ella: es compatible con Strava porque lee el archivo que Strava deja descargar a cualquier usuario.',
        ],
      },
      {
        h: 'Cómo se mantiene',
        body: [
          { when: 'noads', text: 'La web es gratuita y ahora mismo no tiene publicidad. Más adelante podrá mostrar anuncios para cubrir sus costes, siempre fuera de tu historia y de tus imágenes, y pidiéndote permiso antes de usar cookies.' },
          { when: 'ads', text: 'La web es gratuita y se mantiene con publicidad. Los anuncios aparecen solo en la portada, bajo tus resultados y en las páginas de texto: nunca dentro de tu historia ni en las imágenes que compartes.' },
        ],
      },
      {
        h: 'Contacto',
        body: ['Para dudas, errores o sugerencias, escribe a [{email}](mail).'],
      },
      {
        h: 'Créditos',
        body: [
          'Los mapas usan datos de Natural Earth y la lista de ciudades es de GeoNames (CC BY 4.0). Las tipografías son Anton, Archivo, Oswald y Noto Sans. Aquí están las [licencias del software y los datos que usa la web](licenses).',
          'Strava es una marca registrada de Strava, Inc. {brand} no está afiliado, patrocinado ni respaldado por Strava, Inc.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ Aviso legal
  legal: {
    title: 'Aviso legal y condiciones de uso',
    description: 'Quién es el titular de {brand}, condiciones de uso de la web, propiedad intelectual y ley aplicable.',
    kicker: 'Legal',
    lead: 'Quién es el titular de esta web y en qué condiciones se puede usar.',
    sections: [
      {
        h: 'Titular de la web',
        body: [
          'En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico:',
          '- **Titular:** {owner}',
          { when: 'nif', text: '- **NIF:** {nif}' },
          { when: 'address', text: '- **Domicilio:** {address}' },
          '- **Correo electrónico:** [{email}](mail)\n- **Sitio web:** {domain}',
        ],
      },
      {
        h: 'Qué es {brand}',
        body: [
          'Una herramienta gratuita que genera un resumen anual de running a partir del archivo de datos que cada persona descarga de su propia cuenta de Strava. Todo el cálculo se hace en el navegador de quien la usa.',
        ],
      },
      {
        h: 'Relación con Strava',
        body: [
          '{brand} es un proyecto independiente. No está afiliado, patrocinado ni respaldado por Strava, Inc., y no utiliza su API. Strava es una marca registrada de Strava, Inc.; se menciona solo para indicar la compatibilidad con el archivo de datos que Strava entrega a sus usuarios.',
        ],
      },
      {
        h: 'Condiciones de uso',
        body: [
          '- La web es para uso personal. Usa solo el archivo de tu propia cuenta, o el de otra persona con su permiso.\n- No la utilices con fines ilícitos ni de forma que pueda dañarla o impedir su uso a otras personas.\n- Las cifras se calculan automáticamente con los datos de tu archivo y son orientativas: pueden contener errores si los datos de origen los tienen.\n- La web se ofrece tal cual, sin garantía de disponibilidad, y puede cambiar o dejar de estar disponible.',
        ],
      },
      {
        h: 'Propiedad intelectual',
        body: [
          'El diseño, el código y los textos de {brand} pertenecen a su titular. No está permitido copiarlos ni reutilizarlos sin autorización.',
          '**Las imágenes y los vídeos que generes con tus datos son tuyos**: puedes descargarlos y compartirlos libremente.',
          'El software y los datos de terceros que usa la web conservan sus propias [licencias](licenses).',
        ],
      },
      {
        when: 'ads',
        h: 'Publicidad',
        body: [
          'La web se financia con publicidad servida por Google AdSense, que aparece identificada como tal. El titular no elige los anuncios concretos que se muestran ni responde de los productos o servicios anunciados.',
        ],
      },
      {
        h: 'Responsabilidad',
        body: [
          'El titular no responde de los daños derivados de un uso indebido de la web ni de los contenidos de las webs externas a las que se enlaza. Si detectas un contenido o un enlace inadecuado, escribe a [{email}](mail).',
        ],
      },
      {
        h: 'Ley aplicable',
        body: [
          'Estas condiciones se rigen por la legislación española. Si eres consumidor, cualquier conflicto se resolverá ante los juzgados y tribunales de tu domicilio.',
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ Privacidad y cookies
  privacy: {
    title: 'Privacidad y cookies',
    description: 'Qué datos trata {brand} y cuáles no: tu archivo de Strava no sale de tu dispositivo. Cookies, estadísticas, publicidad y tus derechos.',
    kicker: 'Legal',
    lead: 'Lo esencial: **tu archivo de Strava no sale de tu dispositivo**. No hay cuentas ni registro, y no recibimos tus actividades, tus rutas ni tus fotos.',
    sections: [
      {
        h: 'Quién es el responsable',
        body: [
          '{owner}, titular de {brand}. Para cualquier cuestión sobre tus datos, escribe a [{email}](mail). Sus datos completos están en el [aviso legal](page:legal).',
        ],
      },
      {
        h: 'Tu archivo de Strava',
        body: [
          'Cuando eliges tu archivo, **se lee y se procesa en tu propio navegador**. No se sube a ningún servidor: no lo recibimos, no lo guardamos y no podemos verlo. Lo mismo vale para tu nombre, tus rutas y tus fotos.',
          'Todo se queda en la memoria de la pestaña y desaparece al cerrarla o recargarla. Las imágenes y los vídeos se crean en tu dispositivo, y solo salen de él si tú los compartes.',
        ],
      },
      {
        h: 'Datos técnicos de la visita',
        body: [
          'Como en cualquier web, para enviarte las páginas nuestro proveedor de alojamiento, **Cloudflare**, trata tu dirección IP y datos técnicos de la conexión (navegador, fecha y hora, página pedida). Los usa para servir la web y protegerla de ataques. La base legal es nuestro interés legítimo en ofrecer la web de forma segura (art. 6.1.f del RGPD).',
          'Cloudflare actúa como encargado del tratamiento. Puede tratar datos fuera del Espacio Económico Europeo con las garantías del Marco de Privacidad de Datos UE-EE. UU. y de las cláusulas contractuales tipo.',
        ],
      },
      {
        h: 'Estadísticas de visitas',
        body: [
          'Medimos las visitas con **Cloudflare Web Analytics**: páginas vistas, país aproximado y tipo de dispositivo, siempre en conjunto. No usa cookies, no guarda nada en tu dispositivo y no te identifica ni te sigue por otras webs.',
        ],
      },
      {
        id: 'cookies',
        h: 'Cookies y almacenamiento en tu navegador',
        body: [
          '{brand} no instala cookies propias. Solo guarda en tu navegador **el idioma que eliges** (clave «myrunyear.lang» del almacenamiento local), para recordarlo en tu próxima visita. Es un ajuste que pides tú, así que no necesita consentimiento, y puedes borrarlo desde los ajustes del navegador.',
          { when: 'noads', text: 'Ahora mismo la web **no muestra publicidad ni usa cookies de terceros**. Si eso cambia, te pediremos permiso antes y actualizaremos esta página.' },
          { when: 'ads', text: 'La publicidad de **Google AdSense** sí utiliza cookies e identificadores, de Google y de sus socios, para mostrar y medir los anuncios y, si lo aceptas, personalizarlos. Antes de usarlos te pedimos permiso con un aviso en el que puedes **aceptar, rechazar o configurar** con la misma facilidad.' },
          { when: 'ads', text: 'Puedes cambiar tu elección cuando quieras en «Preferencias de privacidad», al pie de cualquier página. Si las rechazas, la web funciona igual y los anuncios no se personalizan.' },
          { when: 'ads', text: '- **Quién las usa:** Google Ireland Limited y los socios publicitarios que aparecen en el aviso.\n- **Para qué:** mostrar anuncios, limitar cuántas veces ves el mismo, medir su resultado, evitar el fraude y, con tu permiso, personalizarlos.\n- **Cuánto duran:** desde la sesión hasta 13 meses, según la cookie.\n- **Más información:** [cómo usa Google los datos de las webs que muestran sus anuncios](https://policies.google.com/technologies/partner-sites).' },
        ],
      },
      {
        when: 'ads',
        h: 'Publicidad',
        body: [
          'La base legal de la publicidad personalizada y de sus cookies es tu consentimiento (art. 6.1.a del RGPD), que puedes retirar en cualquier momento. Google trata esos datos como responsable independiente: consulta su [política de privacidad](https://policies.google.com/privacy).',
        ],
      },
      {
        h: 'Si nos escribes',
        body: ['Usaremos tu dirección y tu mensaje solo para responderte, y los borraremos cuando ya no hagan falta.'],
      },
      {
        h: 'Tus derechos',
        body: [
          'Puedes pedir el acceso, la rectificación o la supresión de tus datos, oponerte a su tratamiento o pedir que se limite, escribiendo a [{email}](mail). Ten en cuenta que no tenemos tus datos de Strava: nunca llegan a nosotros.',
          'Si crees que no hemos atendido bien tu petición, puedes reclamar ante la Agencia Española de Protección de Datos ([aepd.es](https://www.aepd.es)).',
        ],
      },
      {
        h: 'Menores',
        body: ['La web no está dirigida a menores de 14 años.'],
      },
      {
        h: 'Cambios en esta política',
        body: ['Si esta política cambia, publicaremos aquí la nueva versión con su fecha.'],
      },
    ],
  },
};

export default pages;
