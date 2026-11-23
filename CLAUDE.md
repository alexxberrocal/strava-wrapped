# RUNRECAP — Wrapped de Strava para runners

Web 100 % estática (Vite + TypeScript sin framework). El usuario sube el `.zip` del export de Strava y todo se procesa en su navegador (Web Workers + canvas 2D). No hay backend.

## Comandos
- `npm run dev` — servidor de desarrollo (http://localhost:5173, página de tarjetas en `/dev.html`)
- `npm test` — tests (Vitest)
- `npm run typecheck` — TypeScript de `src` y `tests`
- `npm run build` — build de producción en `dist/`
- `npm run geodata` — regenera `public/data` (necesita `scripts/cities15000.zip` de GeoNames)

## Estructura
- `src/parse/` — lectura del export: zip, CSV multidioma, fechas, FIT/GPX/TCX, métricas de cada ruta
- `src/worker/`, `src/app/` — workers en paralelo y orquestación (`Pipeline`)
- `src/geo/`, `src/stats/` — países, ciudades, zonas horarias y cálculo de estadísticas del año
- `src/render/` — kit de dibujo y tarjetas animadas (1080×1920)
- `src/ui/` — flujo de la web, visor de historias, compartir (PNG, MP4, zip)
- `src/demo/` — atleta sintético para la demo

## Reglas de trabajo
- **Cada cambio que funcione se sube a GitHub**: `git add -A`, commit con mensaje descriptivo en español y `git push` a `main` (repo `alexxberrocal/strava-wrapped`). El usuario quiere ver todo reflejado en GitHub y en esta carpeta sin tener que pedirlo.
- Antes de subir: `npm run typecheck` y `npm test` en verde.
- Conversación e interfaz en español; la web también tiene inglés (`src/i18n`).
