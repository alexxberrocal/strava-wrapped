import { ease, prog } from './anim';
import type { Frame } from './card';
import { COLORS, H, W, drawRich, drawTracked, fitSize, layoutRich, roundRect, setFont, trackedWidth, type RichLayout } from './kit';

/** Color de acento para etiquetas según el tema. */
export function accentOf(f: Frame): string {
  return f.theme.name === 'orange' ? COLORS.ink : COLORS.orange;
}

/** Etiqueta de sección: raya + texto en mayúsculas espaciado. */
export function kicker(f: Frame, text: string, x: number, y: number, start = 0, color?: string) {
  const p = ease.outCubic(prog(f.t, start, 700));
  if (p <= 0) return;
  const { ctx } = f;
  const c = color ?? accentOf(f);
  ctx.save();
  ctx.fillStyle = c;
  ctx.fillRect(x, y - 12, 46 * p, 6);
  ctx.globalAlpha *= p;
  setFont(ctx, 'text', 28, 800);
  drawTracked(ctx, text.toUpperCase(), x + 64 - (1 - p) * 20, y, 5.5);
  ctx.restore();
}

/** Revela contenido deslizándolo hacia arriba desde detrás de una "máscara" horizontal. */
export function maskReveal(f: Frame, top: number, height: number, p: number, draw: () => void) {
  if (p <= 0) return;
  const { ctx } = f;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, W, height);
  ctx.clip();
  ctx.translate(0, (1 - p) * height);
  draw();
  ctx.restore();
}

export interface HeroOpts {
  color?: string;
  unitColor?: string;
  start?: number;
  dur?: number;
  unitScale?: number;
  align?: 'left' | 'center';
  tracking?: number;
  /** Texto final (cuando la cifra cuenta hacia arriba) para fijar el tamaño desde el principio. */
  fit?: string;
}

/**
 * Cifra protagonista en Anton con su unidad pequeña pegada (como "311H").
 * `y` = línea base. Devuelve el ancho total.
 */
export function heroNumber(f: Frame, value: string, unit: string, x: number, y: number, size0: number, o: HeroOpts = {}): number {
  const { ctx, theme } = f;
  const start = o.start ?? 0;
  const p = ease.outQuint(prog(f.t, start, o.dur ?? 900));
  // Cifras muy largas (ultrafondistas): se reduce el tamaño para no salirse.
  const maxW = o.align === 'center' ? W - 120 : W - x - 70;
  setFont(ctx, 'display', size0);
  let w0 = trackedWidth(ctx, o.fit ?? value, (o.tracking ?? -0.01) * size0);
  if (unit) {
    const us0 = size0 * (o.unitScale ?? 0.3);
    setFont(ctx, 'display', us0);
    w0 += trackedWidth(ctx, unit, us0 * 0.02) + size0 * 0.04;
  }
  const size = w0 > maxW ? Math.floor((size0 * maxW) / w0) : size0;
  setFont(ctx, 'display', size);
  const tr = (o.tracking ?? -0.01) * size;
  const wv = trackedWidth(ctx, value, tr);
  const us = size * (o.unitScale ?? 0.3);
  setFont(ctx, 'display', us);
  const wu = unit ? trackedWidth(ctx, unit, us * 0.02) + size * 0.04 : 0;
  const total = wv + wu;
  const x0 = o.align === 'center' ? x - total / 2 : x;
  maskReveal(f, y - size * 1.02, size * 1.12, p, () => {
    setFont(ctx, 'display', size);
    ctx.fillStyle = o.color ?? theme.hero;
    drawTracked(ctx, value, x0, y, tr);
    if (unit) {
      setFont(ctx, 'display', us);
      ctx.fillStyle = o.unitColor ?? o.color ?? theme.hero;
      drawTracked(ctx, unit, x0 + wv + size * 0.04, y, us * 0.02);
    }
  });
  return total;
}

/** Titular en Anton, varias líneas que suben escalonadas. `y` = base de la primera línea. */
export function headline(f: Frame, lines: string[], x: number, y: number, size0: number, o: { color?: string; start?: number; stagger?: number; lineHeight?: number; align?: 'left' | 'center'; colors?: (string | undefined)[]; maxWidth?: number } = {}) {
  const { ctx, theme } = f;
  // Nunca se sale del lienzo: todas las líneas comparten el tamaño que quepa.
  const maxW = o.maxWidth ?? (o.align === 'center' ? W - 2 * 60 : W - x - 70);
  const lhK = o.lineHeight ?? 0.98;
  const lay = f.memo(`hl:${lines.join('|')}:${size0}:${maxW}:${lhK}`, () => {
    const size = Math.min(size0, ...lines.map((l) => fitSize(ctx, l.toUpperCase(), 'display', size0, maxW, 400, 20, 0.005)));
    setFont(ctx, 'display', size);
    const m = lines.map((l) => ctx.measureText(l.toUpperCase()));
    const ys = lines.map((_, i) => i * size * lhK);
    // En Anton las mayúsculas con tilde (Á, Ñ, Ó…) suben un 25 % más que el resto y chocarían con
    // la línea de arriba: se separan lo justo, mitad hacia arriba y mitad hacia abajo.
    for (let i = 1; i < lines.length; i++) {
      const need = m[i - 1].actualBoundingBoxDescent + size * 0.07 + m[i].actualBoundingBoxAscent;
      const deficit = need - (ys[i] - ys[i - 1]);
      if (deficit > 0) {
        for (let k = 0; k < i; k++) ys[k] -= deficit / 2;
        for (let k = i; k < lines.length; k++) ys[k] += deficit / 2;
      }
    }
    return { size, ys };
  });
  const size = lay.size;
  const lh = size * lhK;
  lines.forEach((line, i) => {
    const p = ease.outQuint(prog(f.t, (o.start ?? 0) + i * (o.stagger ?? 110), 850));
    const by = y + lay.ys[i];
    maskReveal(f, by - size * 1.2, size * 1.34, p, () => {
      setFont(ctx, 'display', size);
      ctx.fillStyle = o.colors?.[i] ?? o.color ?? theme.fg;
      drawTracked(ctx, line.toUpperCase(), x, by, size * 0.005, o.align === 'center' ? 'center' : 'left');
    });
  });
  return lines.length * lh;
}

/**
 * Línea base del titular que va bajo una cifra protagonista: `gap` por debajo, o más si la cifra
 * baja (la coma de "42,2") a la vez que la primera línea del titular sube (tildes: "1 MARATÓN").
 */
export function belowHero(f: Frame, heroText: string, heroSize: number, base: number, line0: string, hs: number, gap = 150): number {
  const { ctx } = f;
  return f.memo(`below:${heroText}:${heroSize}:${line0}:${hs}:${gap}`, () => {
    setFont(ctx, 'display', heroSize);
    const desc = Math.max(0, ctx.measureText(heroText).actualBoundingBoxDescent);
    setFont(ctx, 'display', hs);
    const asc = ctx.measureText(line0.toUpperCase()).actualBoundingBoxAscent;
    return base + Math.max(gap, desc + asc + hs * 0.22);
  });
}

/** Párrafo con **resaltados**; las líneas aparecen una tras otra. `y` = base de la primera línea. */
export function paragraph(f: Frame, text: string, x: number, y: number, width: number, size = 38, o: { start?: number; color?: string; hl?: string; align?: 'left' | 'center'; weight?: number } = {}): RichLayout {
  const { ctx, theme } = f;
  const lay = f.memo(`para:${text}:${width}:${size}`, () => layoutRich(ctx, text, width, size, o.weight ?? 500, 800, 1.34));
  const start = o.start ?? 0;
  drawRich(ctx, lay, x, y, o.color ?? theme.fg, o.hl ?? theme.hl, o.align ?? 'left', (i) => ease.outCubic(prog(f.t, start + i * 90, 600)));
  return lay;
}

/** Fundido + desplazamiento vertical para cualquier bloque. */
export function fadeUp(f: Frame, start: number, draw: () => void, dur = 650, dy = 26) {
  const p = ease.outCubic(prog(f.t, start, dur));
  if (p <= 0) return;
  const { ctx } = f;
  ctx.save();
  ctx.globalAlpha *= p;
  ctx.translate(0, (1 - p) * dy);
  draw();
  ctx.restore();
}

/** Valor que cuenta hacia arriba. */
export function counting(f: Frame, value: number, start: number, dur = 1500): number {
  return value * ease.outExpo(prog(f.t, start, dur));
}

/** Píldora con texto (p. ej. "+23 % vs 2025"). */
export function pill(f: Frame, text: string, x: number, y: number, o: { bg: string; fg: string; size?: number; start?: number; align?: 'left' | 'right' | 'center' }) {
  const { ctx } = f;
  const p = ease.outBack(prog(f.t, o.start ?? 0, 600));
  if (p <= 0) return 0;
  const size = o.size ?? 28;
  setFont(ctx, 'text', size, 800);
  const tw = trackedWidth(ctx, text, 1.5);
  const w = tw + size * 1.3;
  const h = size * 1.75;
  const x0 = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
  ctx.save();
  ctx.translate(x0 + w / 2, y + h / 2);
  ctx.scale(p, p);
  ctx.fillStyle = o.bg;
  roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = o.fg;
  ctx.textBaseline = 'middle';
  drawTracked(ctx, text, -tw / 2, 1, 1.5);
  ctx.restore();
  return w;
}

/** Línea decorativa que "entra" en la tarjeta (motivo de ruta). */
export function ribbon(f: Frame, pts: Float64Array, cum: Float64Array, p: number, color: string, width: number, endDot = true) {
  if (p <= 0 || pts.length < 4) return;
  const { ctx } = f;
  const total = cum[cum.length - 1];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = pts.length / 2;
  const len = total * p;
  ctx.moveTo(pts[0], pts[1]);
  let lx = pts[0], ly = pts[1];
  for (let i = 1; i < n; i++) {
    if (cum[i] <= len) {
      ctx.lineTo(pts[i * 2], pts[i * 2 + 1]);
      lx = pts[i * 2];
      ly = pts[i * 2 + 1];
    } else {
      const seg = cum[i] - cum[i - 1];
      const k = seg > 0 ? (len - cum[i - 1]) / seg : 0;
      lx = pts[i * 2 - 2] + (pts[i * 2] - pts[i * 2 - 2]) * k;
      ly = pts[i * 2 - 1] + (pts[i * 2 + 1] - pts[i * 2 - 1]) * k;
      ctx.lineTo(lx, ly);
      break;
    }
  }
  ctx.stroke();
  if (endDot) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lx, ly, width * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const CARD_H = H;
