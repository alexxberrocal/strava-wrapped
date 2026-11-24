/**
 * Simulador masivo: genera atletas muy distintos, los pasa por el mismo código que la web
 * (enrich → estadísticas → tarjetas), dibuja cada tarjeta en varios instantes y revisa:
 *   - excepciones (también las que lanzaría el navegador: radios negativos, degradados con NaN…)
 *   - textos con NaN/undefined/"–", números negativos, letras sin tipografía
 *   - textos que se salen de la tarjeta o se pisan entre sí
 *   - huecos vacíos grandes (pantallas pobres)
 *   - incoherencias en las estadísticas
 *
 *   npx tsx scripts/sim/run.ts --n=300 --seed=1 --sheets=flagged
 *
 * Resultado en samples/sim/ (carpeta ignorada por git): report.txt, report.json y hojas PNG.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REC, createCanvas, setupCanvasEnv, type TextBox } from './env';

const ROOT = process.cwd();
setupCanvasEnv(ROOT);

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? 'true']));
const N = Number(args.n ?? 200);
const SEED = Number(args.seed ?? 1);
const SHEETS = (args.sheets ?? 'flagged') as 'all' | 'flagged' | 'none' | 'special';
const ONLY = args.only ?? null;
const OUT = join(ROOT, args.out ?? 'samples/sim');
const BOTH = args.both === 'true';

const { catalog, generateProfile } = await import('./athletes');
const { enrichActivities, finishYear, splitYear, wrappedStats } = await import('../../src/app/enrich');
const { Countries } = await import('../../src/geo/countries');
const { Cities } = await import('../../src/geo/cities');
const { buildDeck } = await import('../../src/render/deck');
const { CardPainter } = await import('../../src/render/card');
const { Fmt } = await import('../../src/i18n/format');
const { W, H, THEMES } = await import('../../src/render/kit');
type DeckEnv = import('../../src/render/card').DeckEnv;
type Card = import('../../src/render/card').Card;
type WrappedStats = import('../../src/stats/types').WrappedStats;

const countries = new Countries(JSON.parse(readFileSync(join(ROOT, 'public/data/countries.json'), 'utf8')));
const cities = new Cities(readFileSync(join(ROOT, 'public/data/cities.tsv'), 'utf8'));

interface Issue {
  kind: string;
  severity: 'error' | 'warn' | 'info';
  profile: string;
  card: string;
  detail: string;
}
const issues: Issue[] = [];
const flagged = new Set<string>();
const add = (i: Issue) => {
  issues.push(i);
  if (i.severity !== 'info') flagged.add(i.profile);
};

// Rangos de las tipografías (latin + latin-ext + vietnamese de Google Fonts).
const COVERED = /^[\u0000-ɏə̀-ͯʰ-˿Ḁ-ỿ -⁯₠-⃏℀-⅏←-↓−∕﻿�°×]*$/u;

const specs = catalog(N, SEED).filter((s) => !ONLY || s.id === ONLY || s.traits[0] === ONLY);
mkdirSync(join(OUT, 'sheets'), { recursive: true });
const t0 = Date.now();
const deckStats: Record<string, number> = {};
let profilesWithRuns = 0;
const summaries: string[] = [];

for (const [pi, spec] of specs.entries()) {
  const prof = generateProfile(spec);
  const runTypes = new Set(prof.activities.filter((a) => a.category === 'run').map((a) => a.typeRaw));
  const { runsCsv, excludedCsv, othersCsv } = splitYear(prof.activities, spec.year, runTypes);
  const enriched = enrichActivities(runsCsv, (id) => prof.tracks.get(id) ?? null, countries, cities);
  const { runs, others, excluded } = finishYear(spec.year, enriched, othersCsv, excludedCsv);
  if (spec.bikesAsRuns && excluded === 0) add({ kind: 'bicis no descartadas', severity: 'error', profile: spec.id, card: '-', detail: `${spec.bikesAsRuns} bicis` });
  if (!runs.length) {
    summaries.push(`${spec.id.padEnd(26)} sin carreras en ${spec.year}`);
    continue;
  }
  profilesWithRuns++;
  const langs: ('es' | 'en')[] = BOTH ? ['es', 'en'] : [spec.lang];
  for (const lang of langs) {
    let stats: WrappedStats;
    try {
      stats = wrappedStats({ activities: prof.activities, exportDate: spec.exportDate, extras: prof.extras }, spec.year, runs, others, { name: spec.name, lang, trimMeters: spec.trim ? 250 : 0 }, runTypes);
    } catch (err) {
      add({ kind: 'excepción en estadísticas', severity: 'error', profile: spec.id, card: '-', detail: String((err as Error)?.stack ?? err).slice(0, 400) });
      continue;
    }
    checkStats(spec.id, stats);
    const photos = stats.photos.length >= 3 ? fakePhotos(Math.min(5, stats.photos.length)) : [];
    const env: DeckEnv = { fmt: new Fmt(lang, spec.units), stats, countries, photos: photos as unknown as ImageBitmap[], brand: 'RUNRECAP', domain: 'runrecap.app' };
    const warns: string[] = [];
    const origWarn = console.warn;
    console.warn = (...a: unknown[]) => warns.push(a.map(String).join(' '));
    const deck = buildDeck(env, { cityMap: spec.cityMap });
    console.warn = origWarn;
    for (const w of warns) add({ kind: 'tarjeta que falla al crearse', severity: 'error', profile: spec.id, card: '-', detail: w.slice(0, 300) });
    for (const c of deck) deckStats[c.id] = (deckStats[c.id] ?? 0) + 1;
    summaries.push(`${spec.id.padEnd(26)} ${lang} ${String(stats.runs).padStart(4)} carreras ${String(Math.round(stats.distance / 1000)).padStart(6)} km  [${deck.map((c) => c.id).join(' ')}]  ${spec.traits.join(' · ')}`);
    const painter = new CardPainter(env);
    for (const card of deck) auditCard(spec.id, painter, card, env);
    if (args.full) {
      // Tarjetas a tamaño real (para revisar a ojo): --full --card=habits,pace
      mkdirSync(join(OUT, 'full'), { recursive: true });
      const want = String(args.card ?? '').split(',').filter(Boolean);
      for (const card of deck) {
        if (want.length && !want.includes(card.id)) continue;
        const c = createCanvas(W, H);
        painter.paint(c.getContext('2d') as unknown as CanvasRenderingContext2D, card, 0, 1, { still: true });
        writeFileSync(join(OUT, 'full', `${spec.id}-${lang}-${card.id}.png`), c.toBuffer('image/png'));
      }
    }
    const wantSheet = SHEETS === 'all' || (SHEETS === 'flagged' && flagged.has(spec.id)) || (SHEETS === 'special' && !spec.id.startsWith('r'));
    if (wantSheet) sheet(`${spec.id}${BOTH ? '-' + lang : ''}`, painter, deck, spec.traits, stats);
  }
  if ((pi + 1) % 25 === 0) process.stdout.write(`  ${pi + 1}/${specs.length} perfiles · ${issues.length} avisos · ${Math.round((Date.now() - t0) / 1000)} s\n`);
}

// ------------------------------------------------------------------ comprobaciones
function checkStats(id: string, s: WrappedStats) {
  const bad = (detail: string) => add({ kind: 'estadística incoherente', severity: 'error', profile: id, card: '-', detail });
  const sumMonths = s.months.reduce((a, m) => a + m.distance, 0);
  if (Math.abs(sumMonths - s.distance) > 1) bad(`meses suman ${sumMonths} ≠ ${s.distance}`);
  if (s.weekdays.reduce((a, b) => a + b, 0) !== s.runs) bad('días de la semana no suman las carreras');
  if (s.hours.reduce((a, b) => a + b, 0) !== s.runs) bad('horas no suman las carreras');
  if (s.activeDays > s.daysInPeriod) bad(`días activos ${s.activeDays} > días del periodo ${s.daysInPeriod}`);
  if (s.longestStreak.days > s.activeDays) bad('racha > días activos');
  if (s.bestWeek && s.bestWeek.distance > s.distance + 1) bad('mejor semana > total');
  if (s.distance > 0 && s.moving > 0 && !Number.isFinite(s.avgPace)) bad('ritmo medio no finito');
  if (s.hr && !(s.hr.avg > 40 && s.hr.avg < 230)) bad(`pulso medio ${s.hr.avg}`);
  if (s.hr && Number.isFinite(s.hr.max) && !(s.hr.max >= 60 && s.hr.max <= 235)) bad(`pulso máximo ${s.hr.max}`);
  if (!(s.habit.share >= 0 && s.habit.share <= 1)) bad(`porcentaje de hábito ${s.habit.share}`);
  if (s.countries.reduce((a, c) => a + c.runs, 0) > s.gpsRuns) bad('países con más carreras que con GPS');
  if (s.home && s.home.runs > s.gpsRuns) bad('ciudad con más carreras que con GPS');
  if (s.weeksInPeriod < s.activeWeeks) bad(`semanas activas ${s.activeWeeks} > semanas ${s.weeksInPeriod}`);
  if (s.goal && s.goal.period !== 'year' && s.goal.hit > s.goal.total) bad('objetivo cumplido más veces que periodos');
  for (const e of s.efforts) if (e.target / e.time > 7.7) bad(`marca imposible ${e.target} m en ${e.time} s`);
  if (s.longestRun && s.longestRun.distance > s.distance + 1) bad('carrera más larga > total');
}

function auditCard(id: string, painter: InstanceType<typeof CardPainter>, card: Card, env: DeckEnv) {
  // 1) Animación: varios instantes a media resolución (excepciones y NaN).
  const small = createCanvas(Math.round(W / 2), Math.round(H / 2));
  const sctx = small.getContext('2d') as unknown as CanvasRenderingContext2D;
  REC.nonFinite = [];
  for (const t of [0, 200, 650, 1300, 2300, 3600, card.duration * 0.8]) {
    try {
      painter.paint(sctx, card, t, 0.5);
    } catch (err) {
      add({ kind: 'excepción al dibujar', severity: 'error', profile: id, card: card.id, detail: `t=${t}: ${String((err as Error)?.message ?? err).slice(0, 200)}` });
      return;
    }
  }
  // 2) Estado final a tamaño real, sin grano ni cabecera: textos y píxeles.
  const big = createCanvas(W, H);
  const ctx = big.getContext('2d') as unknown as CanvasRenderingContext2D;
  REC.on = true;
  REC.target = big;
  REC.texts = [];
  REC.noGrain = true;
  try {
    painter.paint(ctx, card, 0, 1, { still: true, chrome: false });
  } catch (err) {
    add({ kind: 'excepción al dibujar', severity: 'error', profile: id, card: card.id, detail: `still: ${String((err as Error)?.message ?? err).slice(0, 200)}` });
  }
  REC.on = false;
  REC.noGrain = false;
  if (REC.nonFinite.length) add({ kind: 'coordenadas NaN', severity: 'error', profile: id, card: card.id, detail: [...new Set(REC.nonFinite)].slice(0, 4).join(' | ') });
  const texts = REC.texts.filter((t) => t.alpha > 0.05);
  checkTexts(id, card.id, texts);
  checkEmpty(id, card, ctx);
}

function checkTexts(id: string, cardId: string, texts: TextBox[]) {
  for (const t of texts) {
    if (/NaN|undefined|Infinity|null|\[object/.test(t.text)) add({ kind: 'texto roto', severity: 'error', profile: id, card: cardId, detail: t.text });
    if (t.text.includes('−') && !(cardId === 'distance' && /^−\d/.test(t.text)) && !/°[CF]/.test(t.text)) add({ kind: 'número negativo', severity: 'warn', profile: id, card: cardId, detail: t.text });
    if (!COVERED.test(t.text)) add({ kind: 'letras sin tipografía', severity: 'info', profile: id, card: cardId, detail: t.text.slice(0, 60) });
  }
  const runs = mergeRuns(texts);
  for (const r of runs) {
    const label = r.text.slice(0, 50);
    if (/(^|[\s(·])–($|[\s/)%·])/.test(r.text) || r.text.trim() === '–') add({ kind: 'valor vacío (–)', severity: 'warn', profile: id, card: cardId, detail: r.text });
    if (r.x0 < 88 || r.x1 > 1016) add({ kind: 'texto fuera de márgenes', severity: 'warn', profile: id, card: cardId, detail: `"${label}" x=${Math.round(r.x0)}..${Math.round(r.x1)}` });
    if (r.y0 < 160 || r.y1 > 1800) add({ kind: 'texto fuera de la zona útil', severity: 'warn', profile: id, card: cardId, detail: `"${label}" y=${Math.round(r.y0)}..${Math.round(r.y1)}` });
  }
  for (let i = 0; i < runs.length; i++)
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i], b = runs[j];
      const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (ix <= 2 || iy <= 2) continue;
      if (a.text === b.text && Math.abs(a.x0 - b.x0) < 2 && Math.abs(a.y0 - b.y0) < 2) continue;
      const areaMin = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
      if (ix * iy > areaMin * 0.12) add({ kind: 'textos que se pisan', severity: 'warn', profile: id, card: cardId, detail: `"${a.text.slice(0, 40)}" × "${b.text.slice(0, 40)}"` });
    }
}

interface Run {
  text: string;
  font: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  by: number;
}

/** Junta las letras dibujadas una a una (texto con espaciado) en palabras/líneas. */
function mergeRuns(texts: TextBox[]): Run[] {
  const sorted = [...texts].sort((a, b) => a.by - b.by || a.x0 - b.x0);
  const out: Run[] = [];
  for (const t of sorted) {
    const last = out[out.length - 1];
    const size = Number(/(\d+(?:\.\d+)?)px/.exec(t.font)?.[1] ?? 20);
    if (last && last.font === t.font && Math.abs(last.by - t.by) < 0.6 && t.x0 - last.x1 < size * 0.7 && t.x0 >= last.x0) {
      last.text += t.text;
      last.x1 = Math.max(last.x1, t.x1);
      last.y0 = Math.min(last.y0, t.y0);
      last.y1 = Math.max(last.y1, t.y1);
    } else out.push({ text: t.text, font: t.font, x0: t.x0, x1: t.x1, y0: t.y0, y1: t.y1, by: t.by });
  }
  return out;
}

function checkEmpty(id: string, card: Card, ctx: CanvasRenderingContext2D) {
  const bg = THEMES[card.theme].bg;
  const [br, bgc, bb] = [parseInt(bg.slice(1, 3), 16), parseInt(bg.slice(3, 5), 16), parseInt(bg.slice(5, 7), 16)];
  const y0 = 360, y1 = 1790;
  const img = ctx.getImageData(0, y0, W, y1 - y0).data;
  let run = 0, best = 0, bestEnd = 0;
  for (let y = 0; y < y1 - y0; y++) {
    let empty = true;
    for (let x = 60; x < W - 60; x += 3) {
      const k = (y * W + x) * 4;
      if (Math.abs(img[k] - br) + Math.abs(img[k + 1] - bgc) + Math.abs(img[k + 2] - bb) > 24) {
        empty = false;
        break;
      }
    }
    run = empty ? run + 1 : 0;
    if (run > best) {
      best = run;
      bestEnd = y + y0;
    }
  }
  if (best > 430) add({ kind: 'hueco vacío grande', severity: 'warn', profile: id, card: card.id, detail: `${best} px vacíos (y≈${bestEnd - best}–${bestEnd})` });
}

function fakePhotos(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const c = createCanvas(400 + i * 37, 300 + i * 53);
    const g = c.getContext('2d');
    g.fillStyle = `hsl(${i * 70},60%,50%)`;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  });
}

function sheet(name: string, painter: InstanceType<typeof CardPainter>, deck: Card[], traits: string[], s: WrappedStats) {
  const cw = 216, ch = 384, cols = 6, pad = 8, head = 70;
  const rows = Math.ceil(deck.length / cols);
  const c = createCanvas(cols * (cw + pad) + pad, head + rows * (ch + pad + 18) + pad);
  const g = c.getContext('2d') as unknown as CanvasRenderingContext2D;
  g.fillStyle = '#2a2a2a';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  g.font = '600 18px Archivo';
  g.fillText(`${name} · ${s.runs} carreras · ${Math.round(s.distance / 1000)} km · ${s.year}${s.isPartialYear ? ' (a medias)' : ''}`, pad, 26);
  g.font = '500 14px Archivo';
  g.fillText(traits.join(' · ').slice(0, 190), pad, 50);
  deck.forEach((card, i) => {
    const x = pad + (i % cols) * (cw + pad);
    const y = head + Math.floor(i / cols) * (ch + pad + 18);
    try {
      painter.paint(g, card, 0, cw / W, { still: true, offsetX: x, offsetY: y });
    } catch {
      /* ya se apuntó */
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#bbb';
    g.font = '600 13px Archivo';
    g.fillText(card.id, x, y + ch + 14);
  });
  writeFileSync(join(OUT, 'sheets', `${name}.png`), c.toBuffer('image/png'));
}

// ------------------------------------------------------------------ informe
const byKind = new Map<string, Issue[]>();
for (const i of issues) byKind.set(i.kind, [...(byKind.get(i.kind) ?? []), i]);
const lines: string[] = [];
lines.push(`Simulación: ${specs.length} atletas (${profilesWithRuns} con carreras) en ${Math.round((Date.now() - t0) / 1000)} s · ${issues.length} avisos en ${flagged.size} atletas`);
lines.push('');
lines.push('Tarjetas mostradas: ' + Object.entries(deckStats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
lines.push('');
for (const [kind, list] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const cards = new Map<string, number>();
  for (const i of list) cards.set(i.card, (cards.get(i.card) ?? 0) + 1);
  lines.push(`## ${kind} [${list[0].severity}] × ${list.length}  (${[...cards.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}:${n}`).join(', ')})`);
  const seen = new Set<string>();
  for (const i of list) {
    const key = `${i.card}|${i.detail.replace(/\d+/g, '#')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`   - ${i.profile} · ${i.card} · ${i.detail}`);
    if (seen.size >= 14) break;
  }
  lines.push('');
}
lines.push('## Barajas');
lines.push(...summaries);
writeFileSync(join(OUT, 'report.txt'), lines.join('\n'));
writeFileSync(join(OUT, 'report.json'), JSON.stringify(issues, null, 1));
console.log(lines.slice(0, lines.indexOf('## Barajas')).join('\n'));
