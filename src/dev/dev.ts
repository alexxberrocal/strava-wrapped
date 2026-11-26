// Página de desarrollo: dibuja todas las tarjetas con datos de demo.
// Parámetros: ?card=id&t=ms&w=540&lang=en&units=imperial&play
// Casos extremos: &case=ultra | tiny | nogps | longname | partial | down
// Imágenes para compartir el enlace: ?og&lang=xx guarda public/og-xx.jpg (y los iconos).
import { ensureCardAssets, preloadDeckText } from '../render/fonts';
import { buildDeck } from '../render/deck';
import { CardPainter, type DeckEnv } from '../render/card';
import { demoActivities } from '../demo/demo';
import { computeStats } from '../stats/compute';
import { localTimeOf } from '../stats/time';
import { Fmt } from '../i18n/format';
import { isLang, type Lang } from '../i18n/langs';
import { loadSiteStrings, tr } from '../i18n/site';
import { loadCountries } from '../geo/countries';
import { BRAND } from '../config';
import { H, W } from '../render/kit';
import type { Activity } from '../stats/types';

function statsFor(lang: Lang, kase: string | null) {
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
    prev: kase === 'tiny' ? null : kase === 'down' ? { year: 2025, distance: 2_480_000, runs: 260, moving: 840_000, partial: true } : { year: 2025, distance: 1_999_000, runs: 176, moving: 640_000, partial: true },
    periodEnd: localTimeOf(kase === 'partial' ? Date.UTC(2026, 2, 3) : d.exportDate, 60),
    trimMeters: 250,
  });
}

async function main() {
  const q = new URLSearchParams(location.search);
  const qLang = q.get('lang');
  const lang: Lang = isLang(qLang) ? qLang : 'es';
  const units = (q.get('units') as 'metric' | 'imperial') ?? 'metric';
  const countries = await loadCountries().catch(() => null);
  const stats = statsFor(lang, q.get('case'));
  await ensureCardAssets(lang, stats.name);
  const env: DeckEnv = { fmt: new Fmt(lang, units), stats, countries, photos: [], brand: BRAND.name, domain: BRAND.domain };
  const deck = buildDeck(env);
  const painter = new CardPainter(env);
  await preloadDeckText(painter, deck, lang, stats.name);
  if (q.has('og')) {
    await renderSocial(painter, deck, lang);
    return;
  }
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

/**
 * Imagen de vista previa del enlace en el navegador (la de verdad la genera `npm run og`, que
 * comprueba solapes): public/og-xx.jpg. Con lang=es también regenera los iconos.
 */
async function renderSocial(painter: CardPainter, deck: import('../render/card').Card[], lang: Lang) {
  const { COLORS } = await import('../render/kit');
  const { paintSocial, SOCIAL_W, SOCIAL_H } = await import('../render/social');
  await loadSiteStrings(lang);
  const og = document.createElement('canvas');
  og.width = SOCIAL_W;
  og.height = SOCIAL_H;
  const issues = paintSocial(og.getContext('2d')!, painter, deck, { lang, kicker: tr('hero.kicker', {}, lang), title: tr('hero.title', {}, lang), compat: tr('hero.compat', {}, lang), domain: BRAND.domain }, (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }));
  if (issues.length) console.warn('Vista previa:', issues.join(' · '));
  const save = async (canvas: HTMLCanvasElement, name: string) => {
    const type = name.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), type, 0.86));
    await fetch(`/__save?name=${name}`, { method: 'POST', body: blob });
    return blob.size;
  };
  const bytes = await save(og, `og-${lang}.jpg`);
  const icon = (size: number) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const k = c.getContext('2d')!;
    k.fillStyle = COLORS.orange;
    k.fillRect(0, 0, size, size);
    k.scale(size / 64, size / 64);
    k.strokeStyle = '#fff';
    k.fillStyle = '#fff';
    k.lineCap = 'round';
    k.lineWidth = 6;
    k.beginPath();
    k.moveTo(14, 46);
    k.bezierCurveTo(22, 44, 24, 32, 32, 30);
    k.bezierCurveTo(40, 28, 44, 38, 52, 28);
    k.stroke();
    k.beginPath();
    k.arc(14, 46, 6, 0, Math.PI * 2);
    k.fill();
    k.lineWidth = 5;
    k.beginPath();
    k.arc(51, 28, 6.5, 0, Math.PI * 2);
    k.stroke();
    return c;
  };
  if (lang === 'es') {
    await save(icon(180), 'apple-touch-icon.png');
    await save(icon(512), 'icon-512.png');
  }
  document.body.append(og);
  document.title = `OG listo ${lang} ${Math.round(bytes / 1024)} KB`;
}
