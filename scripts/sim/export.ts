/**
 * Dibuja el resumen de un export REAL de Strava sin navegador (mismo código que la web):
 * hoja con todas las tarjetas + cada tarjeta a tamaño real, en samples/export-render/ (ignorado
 * por git: son datos personales).
 *
 *   npm run sim:export -- ruta/al/export.zip [--year=2026] [--lang=es|en] [--units=metric|imperial]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, setupCanvasEnv } from './env';
import { loadImage } from '@napi-rs/canvas';

const ROOT = process.cwd();
setupCanvasEnv(ROOT);
const file = process.argv[2];
if (!file || file.startsWith('--')) {
  console.error('Uso: npm run sim:export -- <export.zip> [--year=2026] [--lang=es] [--units=metric]');
  process.exit(1);
}
const args = Object.fromEntries(process.argv.slice(3).map((a) => a.replace(/^--/, '').split('=')));
const OUT = join(ROOT, 'samples', 'export-render');
mkdirSync(OUT, { recursive: true });

const { ParserCore } = await import('../../src/worker/core');
const { pickDefaultYear } = await import('../../src/app/pipeline');
const { enrichActivities, finishYear, splitYear, wrappedStats } = await import('../../src/app/enrich');
const { Countries } = await import('../../src/geo/countries');
const { Cities } = await import('../../src/geo/cities');
const { buildDeck, cardSkipReason } = await import('../../src/render/deck');
const { CardPainter } = await import('../../src/render/card');
const { Fmt } = await import('../../src/i18n/format');
const { W, H } = await import('../../src/render/kit');
type CardId = import('../../src/render/deck').CardId;

const countries = new Countries(JSON.parse(readFileSync(join(ROOT, 'public/data/countries.json'), 'utf8')));
const cities = new Cities(readFileSync(join(ROOT, 'public/data/cities.tsv'), 'utf8'));

const core = new ParserCore();
await core.open({ kind: 'zip', file: new File([readFileSync(file)], 'export.zip') });
const scan = await core.scan();
const acts = scan.csv.activities;
const byYear = new Map<number, { year: number; runs: number; distance: number; activities: number }>();
for (const a of acts) {
  if (!Number.isFinite(a.startUtc)) continue;
  const y = new Date(a.startUtc).getUTCFullYear();
  const e = byYear.get(y) ?? { year: y, runs: 0, distance: 0, activities: 0 };
  e.activities++;
  if (a.category === 'run') {
    e.runs++;
    e.distance += a.distance;
  }
  byYear.set(y, e);
}
const years = [...byYear.values()].sort((a, b) => b.year - a.year);
const year = Number(args.year ?? pickDefaultYear(years, scan.exportDate));
const lang = (args.lang ?? 'es') as 'es' | 'en';
const units = (args.units ?? 'metric') as 'metric' | 'imperial';
const runTypes = new Set(acts.filter((a) => a.category === 'run').map((a) => a.typeRaw));
console.log(`Año por defecto: ${pickDefaultYear(years, scan.exportDate)} · dibujando ${year} (${lang}, ${units})`);

const { runsCsv, excludedCsv, othersCsv } = splitYear(acts, year, runTypes);
const tracks = new Map<string, Awaited<ReturnType<typeof core.track>>>();
for (const a of runsCsv) if (a.filename) tracks.set(a.id, await core.track({ id: a.id, filename: a.filename, csvDistance: a.distance }));
const enriched = enrichActivities(runsCsv, (id) => tracks.get(id) ?? null, countries, cities);
const { runs, others, excluded } = finishYear(year, enriched, othersCsv, excludedCsv);
const stats = wrappedStats({ activities: acts, exportDate: scan.exportDate, extras: scan.extras }, year, runs, others, { name: scan.firstName ?? '', lang, trimMeters: 250 }, runTypes);
const photos: unknown[] = [];
if (stats.photos.length >= 3) {
  for (const it of await core.media(stats.photos.slice(0, 10), 8_000_000)) {
    try {
      photos.push(await loadImage(Buffer.from(it.bytes)));
    } catch {
      /* formato no soportado */
    }
    if (photos.length >= 5) break;
  }
}
const env = { fmt: new Fmt(lang, units), stats, countries, photos: photos as ImageBitmap[], brand: 'RUNRECAP', domain: 'runrecap.app' };
const deck = buildDeck(env, { cityMap: true });
console.log(`${stats.runs} carreras · ${Math.round(stats.distance / 1000)} km · descartadas por imposibles: ${excluded}`);
console.log(`Tarjetas (${deck.length}): ${deck.map((c) => c.id).join(' · ')}`);
const all: CardId[] = ['intro', 'distance', 'time', 'calendar', 'months', 'elevation', 'pace', 'records', 'longest', 'heatmap', 'countries', 'allruns', 'habits', 'heart', 'shoes', 'curiosities', 'others', 'photos', 'archetype', 'summary'];
for (const id of all) {
  const why = cardSkipReason(id, env, { cityMap: true });
  if (why) console.log(`  sin "${id}": ${why}`);
}
console.log(`Perfil horario: ${stats.habit.key} (${Math.round(stats.habit.share * 100)} %) · sol: ${JSON.stringify(stats.sun)} · perfil runner: ${stats.archetype.key}`);
if (stats.prev) console.log(`Año anterior (${stats.prev.partial ? 'mismas fechas' : 'completo'}): ${Math.round(stats.prev.distance / 1000)} km`);

const painter = new CardPainter(env);
const cw = 270, ch = 480, cols = 5, pad = 10;
const rowsN = Math.ceil(deck.length / cols);
const sheet = createCanvas(cols * (cw + pad) + pad, rowsN * (ch + pad) + pad);
const g = sheet.getContext('2d') as unknown as CanvasRenderingContext2D;
g.fillStyle = '#2a2a2a';
g.fillRect(0, 0, sheet.width, sheet.height);
deck.forEach((card, i) => {
  painter.paint(g, card, 0, cw / W, { still: true, offsetX: pad + (i % cols) * (cw + pad), offsetY: pad + Math.floor(i / cols) * (ch + pad) });
  const c = createCanvas(W, H);
  painter.paint(c.getContext('2d') as unknown as CanvasRenderingContext2D, card, 0, 1, { still: true });
  writeFileSync(join(OUT, `${year}-${lang}-${String(i + 1).padStart(2, '0')}-${card.id}.png`), c.toBuffer('image/png'));
});
writeFileSync(join(OUT, `${year}-${lang}-hoja.png`), sheet.toBuffer('image/png'));
console.log(`Listo: ${OUT}`);
