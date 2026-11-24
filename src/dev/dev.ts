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
 * Imagen de vista previa del enlace (1200×630, JPEG ligero para WhatsApp) en el idioma pedido:
 * public/og-xx.jpg. Con lang=es también regenera los iconos.
 */
async function renderSocial(painter: CardPainter, deck: import('../render/card').Card[], lang: Lang) {
  const { COLORS, setFont, drawTracked, trackedWidth } = await import('../render/kit');
  const { LOCALE, NO_CASE } = await import('../i18n/langs');
  await loadSiteStrings(lang);
  const upper = (t: string) => (NO_CASE.has(lang) ? t : t.toLocaleUpperCase(LOCALE[lang]));
  const og = document.createElement('canvas');
  og.width = 1200;
  og.height = 630;
  const g = og.getContext('2d')!;
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = COLORS.orange;
  g.beginPath();
  g.arc(1010, 330, 330, 0, Math.PI * 2);
  g.fill();
  const pick = ['intro', 'heatmap', 'summary'].map((id) => deck.find((c) => c.id === id)!).filter(Boolean);
  const cw = 236, ch = (cw * H) / W;
  const pos = [
    { x: 760, y: 150, r: -0.1 },
    { x: 1065, y: 170, r: 0.09 },
    { x: 912, y: 118, r: 0 },
  ];
  pick.forEach((card, i) => {
    const c = document.createElement('canvas');
    c.width = cw * 2;
    c.height = Math.round(ch * 2);
    painter.clone().paint(c.getContext('2d')!, card, 0, c.width / W, { still: true });
    const p = pos[i];
    g.save();
    g.translate(p.x, p.y + ch / 2);
    g.rotate(p.r);
    g.shadowColor = 'rgba(0,0,0,0.35)';
    g.shadowBlur = 40;
    g.shadowOffsetY = 18;
    g.beginPath();
    g.roundRect(-cw / 2, -ch / 2, cw, ch, 16);
    g.fillStyle = '#000';
    g.fill();
    g.shadowColor = 'transparent';
    g.save();
    g.clip();
    g.drawImage(c, -cw / 2, -ch / 2, cw, ch);
    g.restore();
    g.restore();
  });
  const X = 68, MAXW = 535;
  const fit = (text: string, kind: 'display' | 'text', size: number, weight: number, track: number, min: number) => {
    let s = size;
    for (; s > min; s -= 1) {
      setFont(g, kind, s, weight);
      if (trackedWidth(g, text, track * s) <= MAXW) break;
    }
    return s;
  };
  // Antetítulo.
  const kick = upper(tr('hero.kicker', {}, lang));
  const track = NO_CASE.has(lang) ? 0 : 0.2;
  const ks = fit(kick, 'text', 22, 800, track, 14);
  g.fillStyle = COLORS.orange;
  g.fillRect(X, 104, 40, 6);
  setFont(g, 'text', ks, 800);
  drawTracked(g, kick, X + 56, 114, track * ks);
  // Titular: las líneas del de la portada; la que va en <em>, en naranja.
  const raw = tr('hero.title', {}, lang).split(/<br\s*\/?>/i);
  const lines = raw.map((l) => ({ text: upper(l.replace(/<[^>]+>/g, '').trim()), hl: /<em>/i.test(l) }));
  // Cabe a lo ancho (535 px) y a lo alto (entre el antetítulo y el pie): los ideogramas son más altos.
  const layout = (sz: number) => {
    setFont(g, 'display', sz);
    const m = lines.map((l) => g.measureText(l.text));
    const ys = [150 + m[0].actualBoundingBoxAscent];
    for (let i = 1; i < lines.length; i++) ys.push(ys[i - 1] + Math.max(sz * 0.94, m[i - 1].actualBoundingBoxDescent + sz * 0.07 + m[i].actualBoundingBoxAscent));
    return { ys, end: ys[ys.length - 1] + m[m.length - 1].actualBoundingBoxDescent };
  };
  let size = Math.min(...lines.map((l) => fit(l.text, 'display', 104, 400, 0.005, 40)));
  let lay = layout(size);
  while (lay.end > 548 && size > 40) lay = layout((size -= 2));
  setFont(g, 'display', size);
  lines.forEach((l, i) => {
    g.fillStyle = l.hl ? COLORS.orange : COLORS.ink;
    drawTracked(g, l.text, X - 2, lay.ys[i], size * 0.005);
  });
  // Pie: dominio y "Compatible con Strava".
  const foot = `${BRAND.domain.toUpperCase()}  ·  ${upper(tr('hero.compat', {}, lang).split(' · ')[0])}`;
  const fs = fit(foot, 'text', 22, 800, NO_CASE.has(lang) ? 0.05 : 0.16, 14);
  setFont(g, 'text', fs, 800);
  g.fillStyle = COLORS.ink;
  drawTracked(g, foot, X, 592, (NO_CASE.has(lang) ? 0.05 : 0.16) * fs);
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
