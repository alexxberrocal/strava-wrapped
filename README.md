# My Run Year · Tu año corriendo, en una historia

![My Run Year](public/og-es.jpg)

Web ([myrunyear.com](https://myrunyear.com/)) para crear tu **resumen anual de running** a partir del
archivo que te da Strava. Kilómetros, horas, desnivel, rachas, mejores marcas, pulsaciones, zapatillas, países,
mapa de calor de tu ciudad, tu perfil runner… en hasta 20 pantallas animadas listas para
compartir en Instagram (imagen o vídeo).

- **100 % en el navegador**: el archivo no se sube a ningún servidor. Sin registro ni login.
- **Funciona en ordenador y en móvil** (Android e iPhone), en el navegador: sin app que instalar.
- **Cualquier idioma de Strava**: el export viene traducido (cabeceras y fechas) y se detecta solo.
- **Exports enormes**: solo se leen las partes necesarias del `.zip`, aunque pese varios GB.
- **12 idiomas** (web y tarjetas): español, catalán, inglés, francés, alemán, italiano, portugués,
  neerlandés, ruso, chino, japonés y coreano. Kilómetros o millas.
- **Hecha para compartirse**: cada idioma tiene su página (`/es/`, `/en/`, `/ca/`…) con su vista
  previa traducida para WhatsApp, Instagram o X; las imágenes llevan la marca de agua con la web y
  la última tarjeta invita a hacerse el suyo; al compartir se añade el enlace.

## Cómo funciona (para quien la usa)

1. En **strava.com** → tu foto → Configuración → Mi cuenta → *Descarga tu cuenta* → Comenzar →
   **Solicitar descarga** (no borra nada; una vez por semana).
2. Strava envía por email un enlace al `export_XXXXXXXX.zip` (minutos u horas).
3. Se suelta el `.zip` en la web (o la carpeta, si el móvil lo descomprimió) y listo.

## Qué hay por dentro

| Pieza | Dónde |
| --- | --- |
| Lectura del export: zip con acceso aleatorio, CSV en cualquier idioma, fechas, FIT/GPX/TCX | `src/parse/` |
| Procesado en paralelo con Web Workers (con alternativa sin workers) | `src/worker/`, `src/app/` |
| Países, ciudades y zona horaria sin conexión | `src/geo/`, `public/data/` |
| Estadísticas del año, equivalencias y perfil runner | `src/stats/` |
| Tarjetas animadas en canvas a 1080×1920 | `src/render/` |
| Web: portada, flujo, visor tipo stories, compartir (PNG, MP4, zip) | `src/ui/`, `index.html` |
| Atleta de demostración (datos inventados) | `src/demo/` |
| Textos de la web y de las tarjetas en 12 idiomas | `src/i18n/site/`, `src/i18n/cards/` |
| Páginas de texto (guía, cómo se calcula, sobre el proyecto, aviso legal, privacidad) en 12 idiomas | `src/i18n/pages/` |
| Portadas y páginas de texto de cada idioma, sitemap, robots, 404, licencias y cabeceras de seguridad (al compilar) | `scripts/site-pages.ts` |
| Marca, titular del aviso legal y publicidad | `src/config.ts` |

Detalles del export que conviene saber (comprobados con exports reales):

- `activities.csv` viene **en el idioma de la cuenta** (`Fecha de la actividad`, `Aktivitätsdatum`…),
  y a veces con cabeceras sin traducir envueltas en HTML. Las columnas van siempre en el mismo
  orden, así que se leen por posición; algunas columnas nuevas se buscan por nombre.
- La fecha está en **UTC** y con formato local (`9 sept. 2018 17:26:30`, `2 ago 2026, 12:20:32 p. m.`,
  `16.10.2024, 15:57:17`…). La hora local se calcula con la posición GPS.
- Las rutas están en `activities/` como `.fit.gz`, `.gpx`, `.gpx.gz` o `.tcx.gz`.

## Desarrollo

Requisitos: Node 20 o superior.

```bash
npm install
npm run dev          # http://localhost:5173
```

- `http://localhost:5173/es/guide/` (y el resto de páginas de texto) se generan al vuelo.
- `http://localhost:5173/dev.html` muestra todas las tarjetas con la demo
  (`?card=distance&t=1200`, `?lang=ru&units=imperial`, `?play`, casos extremos con
  `?case=ultra|tiny|nogps|longname|partial|down`).
- `npm run og` regenera las imágenes de vista previa al compartir el enlace (`public/og-xx.jpg`, una
  por idioma) y comprueba que ningún texto pise a otro, a las tarjetas o al círculo.
- `npm run sample` genera `samples/export_12345678.zip` (export de prueba realista) y
  `http://localhost:5173/?sample` lo carga para probar el flujo completo.
- `npm test` (Vitest) · `npm run typecheck` · `npm run build` (sale en `dist/`).
- `npm run check:web` compila y revisa la web en los 12 idiomas, en móvil y en ordenador, con el
  Chrome o Edge del sistema en modo invisible: textos que se salen, botones partidos, scroll
  lateral, errores de JavaScript… y el recorrido completo con el export de prueba. Capturas en
  `samples/web-check/`.
- `npm run sim -- --n=300` (simulador de atletas, ver `CLAUDE.md`); `--langs=all` dibuja cada
  atleta en los 12 idiomas.
- `npm run fonts` regenera las tipografías de titulares en cirílico y CJK (`src/styles/fonts/`).
- `npm run geodata` regenera `public/data` (necesita `scripts/cities15000.zip` de
  [GeoNames](https://download.geonames.org/export/dump/cities15000.zip)).
- `npx tsx scripts/validate-fit.ts <carpeta>` compara el lector FIT con el SDK oficial de Garmin.

## Publicar la web

Es una web estática: el resultado de `npm run build` (carpeta `dist/`) se puede subir a cualquier
alojamiento. Cada `git push` a `main` pasa los tests y genera el build en GitHub Actions.

### Recomendado · Cloudflare Pages + dominio propio

1. Compra **myrunyear.com** en Cloudflare Registrar (a precio de coste).
2. En Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**, elige este repositorio,
   **Build command** `npm run build`, **Output directory** `dist`. Se publica solo con cada push.
3. En el proyecto de Pages: **Custom domains → myrunyear.com**. El HTTPS es automático.
4. **Email → Email Routing**: crea `hola@myrunyear.com` y redirígelo a tu correo (es el contacto
   que aparece en el aviso legal; no enseña tu dirección personal).
5. **Web Analytics**: actívalo para el proyecto (mide visitas sin cookies).

El build ya genera lo que Cloudflare Pages necesita: `_headers` (política de seguridad y caché),
`sitemap.xml`, `robots.txt`, `404.html`, `licenses.txt` y `.well-known/security.txt`. El repositorio
puede ser privado: Cloudflare lo lee igual.

La URL pública (enlaces al compartir, vista previa y sitemap) es `https://myrunyear.com/`; para
publicar en otra dirección, define `VITE_SITE_URL` al compilar.

### Alternativa · GitHub Pages

El workflow lo publica si la variable `DEPLOY_PAGES` del repositorio vale `true` y Pages usa
«GitHub Actions». Ojo: GitHub Pages no aplica las cabeceras de `_headers` y, en el plan gratuito,
exige que el repositorio sea público.

## Personalizar

- Nombre, dominio, titular y publicidad: `src/config.ts`.
- Colores: `src/render/kit.ts` (tarjetas) y `src/styles/main.css` (web).
- Textos: `src/i18n/site/<idioma>.ts` (web), `src/i18n/cards/<idioma>.ts` (tarjetas) y
  `src/i18n/pages/<idioma>.ts` (páginas de texto). El español define las claves y la estructura;
  los tests comprueban que los 12 idiomas las tengan todas, con las mismas variables.

## Publicidad (preparada y apagada)

La web se financia solo con publicidad, siempre **fuera de la historia y de las imágenes**: en la
portada, bajo los resultados y al final de las páginas de contenido. Está apagada mientras
`ADS.client` (en `src/config.ts`) esté vacío: sin anuncios, sin cookies y con los textos legales
diciendo eso mismo.

Para activarla:

1. Rellena `OWNER.nif` y `OWNER.address`: con ingresos, el aviso legal tiene que llevarlos (art. 10
   de la LSSI). Sin ellos el build falla.
2. Pon en `ADS.client` el identificador de AdSense (`ca-pub-…`). Con eso se carga el script de
   AdSense en todas las páginas, se publica `ads.txt`, aparece «Preferencias de privacidad» en el
   pie y la política de privacidad, el aviso legal y la pregunta sobre cookies pasan a su versión
   con publicidad.
3. En AdSense, **Privacidad y mensajes**: crea el mensaje de consentimiento para Europa con el
   botón de rechazar en la primera pantalla (lo exige la AEPD).
4. Cuando Google apruebe la web, crea los bloques de anuncios y pon sus identificadores en
   `ADS.slots` (`home`, `results`, `page`).

## Aviso legal

- Proyecto independiente: **no está afiliado, patrocinado ni respaldado por Strava, Inc.**
  Strava es una marca registrada de Strava, Inc. Se nombra solo para explicar de dónde sale el
  archivo; no se usan su logotipo ni su nombre en la marca.
- La web no usa la API de Strava: cada persona usa **su propio archivo de datos**, que Strava
  entrega a cualquier usuario (derecho de portabilidad del RGPD).
- Aviso legal, privacidad y cookies de la web: `src/i18n/pages/` (se publican en `/es/legal/` y
  `/es/privacy/`, y en los otros 11 idiomas).
- Código: © Àlex Berrocal, todos los derechos reservados (ver `LICENSE`). Componentes de
  terceros: `THIRD_PARTY_NOTICES.md` (y `licenses.txt` en la web publicada).
