import { LOCALE, NO_CASE, type Lang } from '../i18n/langs';
import type { Card, CardPainter } from './card';
import { COLORS, H, W, drawTracked, roundRect, setFont, trackedWidth, type Ctx } from './kit';

/** Textos de la imagen de vista previa (los de la portada de la web en ese idioma). */
export interface SocialTexts {
  lang: Lang;
  /** hero.kicker */
  kicker: string;
  /** hero.title (HTML con <br> y <em>) */
  title: string;
  /** hero.compat ("Compatible con Strava · Proyecto independiente") */
  compat: string;
  domain: string;
}

export const SOCIAL_W = 1200;
export const SOCIAL_H = 630;

type Box = { name: string; x0: number; y0: number; x1: number; y1: number };

/**
 * Imagen que acompaña al enlace en WhatsApp, Instagram o X (1200×630): titular de la portada a la
 * izquierda y tres tarjetas de la demo a la derecha. Devuelve los problemas de composición que
 * encuentre (textos que se pisan, que tocan las tarjetas o el círculo, o que se salen): vacío = bien.
 */
export function paintSocial(g: Ctx, painter: CardPainter, deck: Card[], t: SocialTexts, makeCanvas: (w: number, h: number) => HTMLCanvasElement): string[] {
  const { lang } = t;
  const upper = (s: string) => (NO_CASE.has(lang) ? s : s.toLocaleUpperCase(LOCALE[lang]));
  const boxes: Box[] = [];
  const record = (name: string, text: string, x: number, y: number, tracking: number) => {
    const m = g.measureText(text);
    const w = trackedWidth(g, text, tracking);
    boxes.push({ name, x0: x, y0: y - m.actualBoundingBoxAscent, x1: x + w, y1: y + m.actualBoundingBoxDescent });
  };

  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, SOCIAL_W, SOCIAL_H);
  const circle = { x: 1010, y: 330, r: 330 };
  g.fillStyle = COLORS.orange;
  g.beginPath();
  g.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
  g.fill();

  // Tres tarjetas de la demo, giradas.
  const pick = ['intro', 'heatmap', 'summary'].map((id) => deck.find((c) => c.id === id)).filter((c): c is Card => !!c);
  const cw = 236, ch = (cw * H) / W;
  const pos = [
    { x: 760, y: 150, r: -0.1 },
    { x: 1065, y: 170, r: 0.09 },
    { x: 912, y: 118, r: 0 },
  ];
  const cards: Box[] = [];
  pick.forEach((card, i) => {
    const c = makeCanvas(cw * 2, Math.round(ch * 2));
    painter.clone().paint(c.getContext('2d')!, card, 0, c.width / W, { still: true });
    const p = pos[i];
    const hw = Math.abs((cw / 2) * Math.cos(p.r)) + Math.abs((ch / 2) * Math.sin(p.r));
    const hh = Math.abs((cw / 2) * Math.sin(p.r)) + Math.abs((ch / 2) * Math.cos(p.r));
    cards.push({ name: card.id, x0: p.x - hw, y0: p.y + ch / 2 - hh, x1: p.x + hw, y1: p.y + ch / 2 + hh });
    g.save();
    g.translate(p.x, p.y + ch / 2);
    g.rotate(p.r);
    g.shadowColor = 'rgba(0,0,0,0.35)';
    g.shadowBlur = 40;
    g.shadowOffsetY = 18;
    roundRect(g, -cw / 2, -ch / 2, cw, ch, 16);
    g.fillStyle = '#000';
    g.fill();
    g.shadowColor = 'transparent';
    g.save();
    g.clip();
    g.drawImage(c, -cw / 2, -ch / 2, cw, ch);
    g.restore();
    g.restore();
  });

  // Columna de texto: de X a lo más a la izquierda de las tarjetas, con aire.
  const X = 68;
  const maxW = Math.min(...cards.map((c) => c.x0)) - 36 - X;
  const fit = (text: string, kind: 'display' | 'text', size: number, weight: number, track: number, min: number) => {
    let s = size;
    for (; s > min; s -= 1) {
      setFont(g, kind, s, weight);
      if (trackedWidth(g, text, track * s) <= maxW) break;
    }
    return s;
  };

  // Antetítulo.
  const kick = upper(t.kicker);
  const track = NO_CASE.has(lang) ? 0 : 0.2;
  const ks = fit(kick, 'text', 22, 800, track, 14);
  g.fillStyle = COLORS.orange;
  g.fillRect(X, 104, 40, 6);
  setFont(g, 'text', ks, 800);
  drawTracked(g, kick, X + 56, 114, track * ks);
  record('antetítulo', kick, X + 56, 114, track * ks);

  // Titular: las líneas del de la portada; la que va en <em>, en naranja. Cabe a lo ancho y a lo
  // alto (entre el antetítulo y el pie): los ideogramas son más altos que las mayúsculas latinas.
  const lines = t.title.split(/<br\s*\/?>/i).map((l) => ({ text: upper(l.replace(/<[^>]+>/g, '').trim()), hl: /<em>/i.test(l) }));
  const layout = (sz: number) => {
    setFont(g, 'display', sz);
    const m = lines.map((l) => g.measureText(l.text));
    const ys = [150 + m[0].actualBoundingBoxAscent];
    for (let i = 1; i < lines.length; i++) ys.push(ys[i - 1] + Math.max(sz * 0.94, m[i - 1].actualBoundingBoxDescent + Math.max(10, sz * 0.1) + m[i].actualBoundingBoxAscent));
    return { ys, end: ys[ys.length - 1] + m[m.length - 1].actualBoundingBoxDescent };
  };
  let size = Math.min(...lines.map((l) => fit(l.text, 'display', 104, 400, 0.005, 40)));
  let lay = layout(size);
  while (lay.end > 548 && size > 40) lay = layout((size -= 2));
  setFont(g, 'display', size);
  lines.forEach((l, i) => {
    g.fillStyle = l.hl ? COLORS.orange : COLORS.ink;
    drawTracked(g, l.text, X - 2, lay.ys[i], size * 0.005);
    record(`titular ${i + 1}`, l.text, X - 2, lay.ys[i], size * 0.005);
  });

  // Pie: dominio y "Compatible con Strava".
  const footTrack = NO_CASE.has(lang) ? 0.05 : 0.16;
  const foot = `${t.domain.toUpperCase()}  ·  ${upper(t.compat.split(' · ')[0])}`;
  const fs = fit(foot, 'text', 22, 800, footTrack, 14);
  setFont(g, 'text', fs, 800);
  g.fillStyle = COLORS.ink;
  drawTracked(g, foot, X, 592, footTrack * fs);
  record('pie', foot, X, 592, footTrack * fs);

  // Comprobaciones.
  const issues: string[] = [];
  const hit = (a: Box, b: Box, gap: number) => a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 + gap && b.y0 < a.y1 + gap;
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    if (a.x0 < 24 || a.y0 < 24 || a.x1 > SOCIAL_W - 24 || a.y1 > SOCIAL_H - 20) issues.push(`${a.name} fuera de margen`);
    for (let j = i + 1; j < boxes.length; j++) if (hit(a, boxes[j], 6)) issues.push(`${a.name} pisa ${boxes[j].name}`);
    for (const c of cards) if (hit(a, c, 12)) issues.push(`${a.name} toca la tarjeta ${c.name}`);
    const nx = Math.max(a.x0, Math.min(circle.x, a.x1)), ny = Math.max(a.y0, Math.min(circle.y, a.y1));
    if (Math.hypot(nx - circle.x, ny - circle.y) < circle.r + 8) issues.push(`${a.name} toca el círculo`);
  }
  if (pick.length < 3) issues.push(`faltan tarjetas (${pick.length}/3)`);
  return issues;
}
