/** Kit de dibujo para las tarjetas (lienzo lógico 1080×1920, formato historia). */

export const W = 1080;
export const H = 1920;
export const M = 96; // margen lateral
export const CW = W - 2 * M; // ancho útil

export type Ctx = CanvasRenderingContext2D;

export const COLORS = {
  orange: '#FC4C02',
  orangeSoft: '#FF8A50',
  orangeDeep: '#D83E00',
  ink: '#121212',
  ink2: '#1D1B19',
  paper: '#F3EEE6',
  paper2: '#E7E0D4',
  white: '#FFFFFF',
};

export type ThemeName = 'orange' | 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  bg: string;
  /** Texto principal / titulares */
  fg: string;
  /** Cifra protagonista */
  hero: string;
  /** Unidades y acentos */
  accent: string;
  /** Texto secundario */
  sub: string;
  /** Líneas y fondos tenues */
  faint: string;
  /** Resaltado dentro de párrafos */
  hl: string;
  /** Barras/elementos neutros */
  neutral: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  orange: {
    name: 'orange',
    bg: COLORS.orange,
    fg: COLORS.ink,
    hero: COLORS.white,
    accent: COLORS.ink,
    sub: 'rgba(18,18,18,0.72)',
    faint: 'rgba(18,18,18,0.13)',
    hl: COLORS.white,
    neutral: 'rgba(18,18,18,0.28)',
  },
  dark: {
    name: 'dark',
    bg: COLORS.ink,
    fg: COLORS.paper,
    hero: COLORS.orange,
    accent: COLORS.paper,
    sub: 'rgba(243,238,230,0.62)',
    faint: 'rgba(243,238,230,0.10)',
    hl: COLORS.orange,
    neutral: 'rgba(243,238,230,0.24)',
  },
  light: {
    name: 'light',
    bg: COLORS.paper,
    fg: COLORS.ink,
    hero: COLORS.orange,
    accent: COLORS.ink,
    sub: 'rgba(18,18,18,0.62)',
    faint: 'rgba(18,18,18,0.09)',
    hl: COLORS.orange,
    neutral: 'rgba(18,18,18,0.22)',
  },
};

export const FONT_DISPLAY = 'Anton, "Arial Narrow", Impact, sans-serif';
export const FONT_TEXT = 'Archivo, "Helvetica Neue", Arial, sans-serif';

export function setFont(ctx: Ctx, kind: 'display' | 'text', size: number, weight = 400) {
  ctx.font = kind === 'display' ? `${size}px ${FONT_DISPLAY}` : `${weight} ${size}px ${FONT_TEXT}`;
}

/**
 * Escrituras que no se pueden dibujar letra a letra (se unen o van de derecha a izquierda):
 * árabe, hebreo, devanagari, tailandés… Se dibujan de una vez, sin espaciado.
 */
const COMPLEX = /[\u0590-\u08FF\u0900-\u0DFF\u0E00-\u0E7F\u0F00-\u0FFF\u1000-\u109F\u1780-\u17FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** Anchura con espaciado entre letras manual (portátil a todos los navegadores). */
export function trackedWidth(ctx: Ctx, text: string, tracking: number): number {
  if (!tracking || COMPLEX.test(text)) return ctx.measureText(text).width;
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

export function drawTracked(ctx: Ctx, text: string, x: number, y: number, tracking: number, align: 'left' | 'right' | 'center' = 'left') {
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  const w = trackedWidth(ctx, text, tracking);
  let cx = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  if (!tracking || COMPLEX.test(text)) {
    ctx.fillText(text, cx, y);
  } else {
    for (const ch of text) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + tracking;
    }
  }
  ctx.textAlign = prevAlign;
  return w;
}

/** Tamaño de fuente para que `text` quepa en `maxWidth`. */
export function fitSize(ctx: Ctx, text: string, kind: 'display' | 'text', maxSize: number, maxWidth: number, weight = 400, minSize = 20, tracking = 0): number {
  setFont(ctx, kind, maxSize, weight);
  const w = trackedWidth(ctx, text, tracking * maxSize);
  if (w <= maxWidth) return maxSize;
  const size = Math.max(minSize, Math.floor((maxSize * maxWidth) / w));
  return size;
}

/** Medidas reales de un texto (alto de mayúsculas etc.). */
export function textBox(ctx: Ctx, text: string) {
  const m = ctx.measureText(text);
  return { w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
}

// ---------------- Texto enriquecido: "**resaltado**" ----------------

export interface Seg {
  text: string;
  hl: boolean;
}

export function parseRich(s: string): Seg[] {
  const out: Seg[] = [];
  const parts = s.split('**');
  parts.forEach((p, i) => {
    if (p) out.push({ text: p, hl: i % 2 === 1 });
  });
  return out;
}

export interface RichRun {
  text: string;
  hl: boolean;
  x: number;
  w: number;
}
export interface RichLine {
  runs: RichRun[];
  width: number;
}
export interface RichLayout {
  lines: RichLine[];
  size: number;
  lineHeight: number;
  weight: number;
  hlWeight: number;
  height: number;
}

export function layoutRich(ctx: Ctx, text: string, maxWidth: number, size: number, weight = 500, hlWeight = 700, lineHeight = 1.32): RichLayout {
  const segs = parseRich(text);
  // Tokens: palabras y espacios, conservando el estilo. Las piezas sin espacio entre medias
  // (p. ej. "**53 maratones**." -> "maratones" + ".") forman un grupo que no se parte.
  type Tok = { text: string; hl: boolean; space: boolean };
  const tokens: Tok[] = [];
  for (const sg of segs) {
    for (const p of sg.text.split(/(\s+)/)) {
      if (p) tokens.push({ text: p, hl: sg.hl, space: /^\s+$/.test(p) });
    }
  }
  const groups: (Tok[] | Tok)[] = [];
  for (const t of tokens) {
    const last = groups[groups.length - 1];
    if (t.space) groups.push(t);
    else if (Array.isArray(last)) last.push(t);
    else groups.push([t]);
  }
  // "56 km", "152 m", "154 ppm": el número y su unidad nunca se separan.
  const UNIT = /^(km|mi|m|ft|h|min|ppm|bpm|kcal|°c|°f)[.,;:!?)]*$/i;
  for (let i = 1; i < groups.length - 1; i++) {
    const prev = groups[i - 1], sp = groups[i], next = groups[i + 1];
    if (Array.isArray(prev) && !Array.isArray(sp) && Array.isArray(next) && /\d$/.test(prev[prev.length - 1].text) && UNIT.test(next[0].text)) {
      prev.push(sp, ...next);
      groups.splice(i, 2);
      i--;
    }
  }
  const widthOf = (t: string, hl: boolean) => {
    setFont(ctx, 'text', size, hl ? hlWeight : weight);
    return ctx.measureText(t).width;
  };
  const lines: RichLine[] = [];
  let cur: RichRun[] = [];
  let x = 0;
  const trimEnd = () => {
    while (cur.length && cur[cur.length - 1].text.trim() === '') {
      x -= cur[cur.length - 1].w;
      cur.pop();
    }
  };
  for (const g of groups) {
    if (!Array.isArray(g)) {
      if (cur.length) {
        const w = widthOf(' ', g.hl);
        cur.push({ text: ' ', hl: g.hl, x, w });
        x += w;
      }
      continue;
    }
    const widths = g.map((t) => widthOf(t.text, t.hl));
    const gw = widths.reduce((a, b) => a + b, 0);
    if (x + gw > maxWidth && cur.length) {
      trimEnd();
      lines.push({ runs: cur, width: x });
      cur = [];
      x = 0;
    }
    g.forEach((t, i) => {
      cur.push({ text: t.text, hl: t.hl, x, w: widths[i] });
      x += widths[i];
    });
  }
  trimEnd();
  if (cur.length) lines.push({ runs: cur, width: x });
  const lh = size * lineHeight;
  return { lines, size, lineHeight: lh, weight, hlWeight, height: lines.length ? (lines.length - 1) * lh + size : 0 };
}

/** Dibuja un párrafo; `y` es la línea base de la primera línea. */
export function drawRich(ctx: Ctx, lay: RichLayout, x: number, y: number, color: string, hlColor: string, align: 'left' | 'center' = 'left', lineProgress?: (i: number) => number) {
  lay.lines.forEach((line, i) => {
    const p = lineProgress ? lineProgress(i) : 1;
    if (p <= 0) return;
    const ox = align === 'center' ? x - line.width / 2 : x;
    ctx.save();
    ctx.globalAlpha *= p;
    const dy = (1 - p) * 18;
    for (const r of line.runs) {
      setFont(ctx, 'text', lay.size, r.hl ? lay.hlWeight : lay.weight);
      ctx.fillStyle = r.hl ? hlColor : color;
      ctx.fillText(r.text, ox + r.x, y + i * lay.lineHeight + dy);
    }
    ctx.restore();
  });
}

// ---------------- Formas ----------------

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Longitudes acumuladas de una polilínea [x0,y0,x1,y1,…]. */
export function cumulative(pts: ArrayLike<number>): Float64Array {
  const n = pts.length / 2;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const dx = pts[i * 2] - pts[i * 2 - 2];
    const dy = pts[i * 2 + 1] - pts[i * 2 - 1];
    cum[i] = cum[i - 1] + Math.sqrt(dx * dx + dy * dy);
  }
  return cum;
}

/** Traza (sin stroke) la polilínea hasta la longitud `len`. Devuelve el último punto. */
export function tracePartial(ctx: Ctx, pts: ArrayLike<number>, cum: Float64Array, len: number): [number, number] {
  const n = pts.length / 2;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  let last: [number, number] = [pts[0], pts[1]];
  for (let i = 1; i < n; i++) {
    if (cum[i] <= len) {
      ctx.lineTo(pts[i * 2], pts[i * 2 + 1]);
      last = [pts[i * 2], pts[i * 2 + 1]];
    } else {
      const seg = cum[i] - cum[i - 1];
      const f = seg > 0 ? (len - cum[i - 1]) / seg : 0;
      const x = pts[i * 2 - 2] + (pts[i * 2] - pts[i * 2 - 2]) * f;
      const y = pts[i * 2 - 1] + (pts[i * 2 + 1] - pts[i * 2 - 1]) * f;
      ctx.lineTo(x, y);
      last = [x, y];
      break;
    }
  }
  return last;
}

export function traceFull(ctx: Ctx, pts: ArrayLike<number>) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
}

// ---------------- Proyección de rutas ----------------

const D2R = Math.PI / 180;
export function mercY(lat: number): number {
  const l = Math.max(-85, Math.min(85, lat)) * D2R;
  return Math.log(Math.tan(Math.PI / 4 + l / 2)) / D2R;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Proyecta rutas (lat/lon) a una caja con Mercator, encuadrando de forma robusta
 * (percentiles: una salida lejana no encoge todo lo demás).
 */
export function projectRoutes(tracks: Float32Array[], box: Box, opts: { lo?: number; hi?: number; pad?: number } = {}): { paths: Float64Array[]; k: number } {
  const lo = opts.lo ?? 0;
  const hi = opts.hi ?? 1;
  // Rutas que cruzan el antimeridiano (Fiyi, Chukotka…): longitudes continuas alrededor de una referencia.
  let ref = NaN;
  for (const t of tracks) if (t.length >= 2 && Number.isFinite(t[1])) {
    ref = t[1];
    break;
  }
  const unwrap = (lon: number) => (Number.isFinite(ref) ? lon + 360 * Math.round((ref - lon) / 360) : lon);
  const xs: number[] = [];
  const ys: number[] = [];
  for (const t of tracks) {
    const step = Math.max(1, Math.floor(t.length / 2 / 200));
    for (let i = 0; i < t.length; i += 2 * step) {
      xs.push(unwrap(t[i + 1]));
      ys.push(mercY(t[i]));
    }
  }
  if (!xs.length) return { paths: [], k: 1 };
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  const q = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.max(0, Math.round(p * (arr.length - 1))))];
  let x0 = q(xs, lo), x1 = q(xs, hi), y0 = q(ys, lo), y1 = q(ys, hi);
  const pad = opts.pad ?? 0.04;
  const minSpan = 0.004;
  if (x1 - x0 < minSpan) {
    const c = (x0 + x1) / 2;
    x0 = c - minSpan / 2;
    x1 = c + minSpan / 2;
  }
  if (y1 - y0 < minSpan) {
    const c = (y0 + y1) / 2;
    y0 = c - minSpan / 2;
    y1 = c + minSpan / 2;
  }
  const spanX = (x1 - x0) * (1 + pad * 2);
  const spanY = (y1 - y0) * (1 + pad * 2);
  const k = Math.min(box.w / spanX, box.h / spanY);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const bx = box.x + box.w / 2, by = box.y + box.h / 2;
  const paths = tracks.map((t) => {
    const out = new Float64Array(t.length);
    for (let i = 0; i < t.length; i += 2) {
      out[i] = bx + (unwrap(t[i + 1]) - cx) * k;
      out[i + 1] = by - (mercY(t[i]) - cy) * k;
    }
    return out;
  });
  return { paths, k };
}

/** Ajusta una sola ruta a una caja (para miniaturas). */
export function fitRoute(t: Float32Array, box: Box, pad = 0.08): Float64Array {
  return projectRoutes([t], box, { pad }).paths[0];
}

// ---------------- Textura ----------------

let grain: HTMLCanvasElement | null = null;
export function grainPattern(ctx: Ctx): CanvasPattern | null {
  if (typeof document === 'undefined') return null;
  if (!grain) {
    grain = document.createElement('canvas');
    grain.width = grain.height = 160;
    const g = grain.getContext('2d')!;
    const img = g.createImageData(160, 160);
    let s = 1234567;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const v = s & 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  return ctx.createPattern(grain, 'repeat');
}

const capCache = new Map<string, number>();
/** Proporción alto-de-mayúscula / tamaño para la fuente display (medida real). */
export function capRatio(ctx: Ctx, kind: 'display' | 'text' = 'display', weight = 400): number {
  const k = `${kind}:${weight}:${ctx.font.includes('Anton') ? 'a' : 'x'}`;
  let r = capCache.get(k);
  if (r == null) {
    const prev = ctx.font;
    setFont(ctx, kind, 200, weight);
    const m = ctx.measureText('0H');
    r = m.actualBoundingBoxAscent / 200;
    ctx.font = prev;
    // Si la fuente aún no ha cargado, no cacheamos el valor de la de respaldo.
    if (typeof document !== 'undefined' && document.fonts && !document.fonts.check(kind === 'display' ? '200px Anton' : `${weight} 200px Archivo`)) return r || 0.72;
    capCache.set(k, r || 0.72);
  }
  return r;
}
