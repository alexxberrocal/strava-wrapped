// Página de desarrollo: dibuja todas las tarjetas con datos de demo.
// Parámetros: ?card=id&t=ms&w=540&lang=en&units=imperial&play
// Casos extremos: &case=ultra | tiny | nogps | longname | partial
import { ensureFonts } from '../render/fonts';
import { buildDeck } from '../render/deck';
import { CardPainter, type DeckEnv } from '../render/card';
import { demoActivities } from '../demo/demo';
import { computeStats } from '../stats/compute';
import { localTimeOf } from '../stats/time';
import { Fmt } from '../i18n/format';
import { loadCountries } from '../geo/countries';
import { BRAND } from '../config';
import { H, W } from '../render/kit';
import type { Activity } from '../stats/types';

function statsFor(lang: 'es' | 'en', kase: string | null) {
  const d = demoActivities(lang);
  let runs: Activity[] = d.runs;
  let name = d.name;
  if (kase === 'ultra') {
    runs = runs.map((r) => ({ ...r, csv: { ...r.csv, distance: r.csv.distance * 6.5, moving: r.csv.moving * 6, elevGain: r.csv.elevGain * 9, calories: r.csv.calories * 6 } }));
    name = 'Kilian';
  } else if (kase === 'tiny') runs = runs.slice(0, 3);
  else if (kase === 'nogps') runs = runs.map((r) => ({ ...r, track: null, country: null, city: null, indoor: true }));
  else if (kase === 'longname') name = 'Maximiliano Alejandro';
  else if (kase === 'partial') runs = runs.filter((r) => r.local.mo <= 2);
  return computeStats({
    year: 2026,
    name,
    lang,
    runs,
    others: kase === 'tiny' ? [] : d.others,
    prev: kase === 'tiny' ? null : { year: 2025, distance: 1_386_000, runs: 151, moving: 466_000 },
    periodEnd: localTimeOf(kase === 'partial' ? Date.UTC(2026, 2, 3) : d.exportDate, 60),
    trimMeters: 250,
  });
}

async function main() {
  const q = new URLSearchParams(location.search);
  const lang = (q.get('lang') as 'es' | 'en') ?? 'es';
  const units = (q.get('units') as 'metric' | 'imperial') ?? 'metric';
  await ensureFonts();
  const countries = await loadCountries().catch(() => null);
  const stats = statsFor(lang, q.get('case'));
  await ensureFonts(stats.name);
  const env: DeckEnv = { fmt: new Fmt(lang, units), stats, countries, photos: [], brand: BRAND.name, domain: BRAND.domain };
  const deck = buildDeck(env);
  const painter = new CardPainter(env);
  const only = q.get('card');
  const t = q.has('t') ? Number(q.get('t')) : null;
  const width = Number(q.get('w') ?? (only ? 540 : 270));
  const grid = document.getElementById('grid')!;
  const animate = q.has('play');
  (window as unknown as Record<string, unknown>).__deck = deck.map((c) => c.id);
  for (const card of deck) {
    if (only && card.id !== only) continue;
    const fig = document.createElement('figure');
    const canvas = document.createElement('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(((width * H) / W) * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${(width * H) / W}px`;
    const cap = document.createElement('figcaption');
    cap.textContent = card.id;
    fig.append(canvas, cap);
    grid.append(fig);
    const ctx = canvas.getContext('2d')!;
    const scale = canvas.width / W;
    if (animate) {
      const t0 = performance.now();
      const loop = () => {
        painter.paint(ctx, card, (performance.now() - t0) % (card.duration + 1500), scale);
        requestAnimationFrame(loop);
      };
      loop();
    } else painter.paint(ctx, card, t ?? 0, scale, { still: t == null });
  }
  document.title = `Dev · ${deck.length} tarjetas`;
}
main().catch((e) => {
  document.body.textContent = String(e?.stack ?? e);
});
