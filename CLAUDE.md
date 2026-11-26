# RUNRECAP — Wrapped de Strava para runners

Web 100 % estática (Vite + TypeScript sin framework). El usuario sube el `.zip` del export de Strava y todo se procesa en su navegador (Web Workers + canvas 2D). No hay backend.

## Comandos
- `npm run dev` — servidor de desarrollo (http://localhost:5173, página de tarjetas en `/dev.html`)
- `npm test` — tests (Vitest)
- `npm run typecheck` — TypeScript de `src` y `tests`
- `npm run build` — build de producción en `dist/`
- `npm run geodata` — regenera `public/data` (necesita `scripts/cities15000.zip` de GeoNames)
- `npm run sim -- --n=300` — simulador de atletas (casos extremos fijos + aleatorios): pasa cada uno por el mismo código de la web, dibuja todas las tarjetas y avisa de excepciones, textos rotos, solapes, textos fuera de márgenes y huecos vacíos. Informe y hojas en `samples/sim/` (`--sheets=all|flagged|special`, `--only=<caso>`, `--full --card=habits`)
- `npm run sim:fechas` — fechas del CSV en ~60 idiomas · `npm run sim:ficheros` — FIT/GPX/TCX rotos
- `npm run sim:export -- <export.zip> [--year=2026 --lang=en --units=imperial]` — dibuja el resumen de un export real en `samples/export-render/` (datos personales: `samples/` está en .gitignore)
- `npm run sim -- --n=0 --langs=all` — los atletas especiales en los 12 idiomas (textos que no caben, cortes de línea en chino/japonés…); `--random` solo aleatorios, `--only=a,b` varios perfiles
- `npm run check:web` — compila y revisa la web en los 12 idiomas (móvil y ordenador, con el Chrome/Edge del sistema): nada se sale, botones en una línea, sin scroll lateral ni errores, y el flujo completo con el export de prueba. Capturas en `samples/web-check/`
- `npm run og` — regenera las 12 imágenes de vista previa al compartir (`public/og-xx.jpg`) y comprueba que ningún texto pise a otro ni a las tarjetas, y que pesen menos de 300 KB
- `npm run fonts` — regenera `src/styles/fonts/*.css` (titulares en cirílico y CJK)

## Estructura
- `src/parse/` — lectura del export: zip, CSV multidioma, fechas, FIT/GPX/TCX, métricas de cada ruta
- `src/worker/`, `src/app/` — workers en paralelo y orquestación (`Pipeline`; la lógica pura del año está en `enrich.ts` y la usa también el simulador)
- `src/geo/`, `src/stats/` — países, ciudades, zonas horarias y cálculo de estadísticas del año
- `src/render/` — kit de dibujo y tarjetas animadas (1080×1920)
- `src/ui/` — flujo de la web, visor de historias, compartir (PNG, MP4, zip)
- `src/demo/` — atleta sintético para la demo
- `scripts/sim/` — simulador de atletas y pruebas masivas (fechas, ficheros rotos, exports reales)
- `src/render/deck.ts` — qué tarjetas se enseñan (`cardSkipReason`: con pocos datos, la tarjeta no sale)
- `src/i18n/` — 12 idiomas: `site/<lang>.ts` (web), `cards/<lang>.ts` (tarjetas, mensajes con plurales), `format.ts` (números, fechas, contracciones), `langs.ts`
- `scripts/site-pages.ts` — al compilar, una página por idioma (`/es/`, `/en/`…) con textos y vista previa (Open Graph) traducidos, sitemap, robots y 404; la raíz redirige al idioma de cada persona

## Reglas de trabajo
- **Cada cambio que funcione se sube a GitHub**: `git add -A`, commit con mensaje descriptivo en español y `git push` a `main` (repo `alexxberrocal/strava-wrapped`). El usuario quiere ver todo reflejado en GitHub y en esta carpeta sin tener que pedirlo.
- Antes de subir: `npm run typecheck` y `npm test` en verde.
- Conversación e interfaz en español; la web tiene 12 idiomas (`src/i18n`). Cada texto nuevo se añade en los 12 (los tests lo exigen).
- Tras cambios visibles en la web: `npm run check:web`; en las tarjetas: `npm run sim` (y `--langs=all` si tocan textos).
