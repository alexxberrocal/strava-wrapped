/**
 * Entorno de dibujo en Node para el simulador: canvas real (Skia) con las mismas tipografías de la
 * web, y un "navegador estricto": lanza los mismos errores que Chrome/Safari ante radios negativos,
 * degradados con NaN… y apunta cada texto dibujado (con su caja real) para revisarlo después.
 */
import { createCanvas, GlobalFonts, Path2D, type Canvas } from '@napi-rs/canvas';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface TextBox {
  text: string;
  font: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Línea base (para agrupar letras dibujadas una a una). */
  by: number;
  alpha: number;
  stroke: boolean;
}

export const REC = {
  on: false,
  target: null as Canvas | null,
  texts: [] as TextBox[],
  /** Llamadas con coordenadas NaN/Infinity (el navegador las ignora en silencio: son fallos). */
  nonFinite: [] as string[],
  /** Sin grano: así se puede medir qué píxeles son fondo. */
  noGrain: false,
  /** Sin textos en el lienzo vigilado: queda solo el dibujo (para ver si algo pasa por debajo de las letras). */
  noText: false,
};

let ready = false;

export function setupCanvasEnv(root: string) {
  if (ready) return;
  ready = true;
  for (const [pkg, family] of [
    ['anton', 'Anton'],
    ['archivo', 'Archivo'],
  ]) {
    const dir = join(root, 'node_modules', '@fontsource', pkg, 'files');
    for (const f of readdirSync(dir)) if (f.endsWith('-normal.woff2')) GlobalFonts.registerFromPath(join(dir, f), family);
  }
  // Titulares en cirílico, chino, japonés y coreano: los mismos alias que la web (scripts/gen-fonts.ts).
  for (const [pkg, family, weight] of [
    ['oswald', 'MRY Display Cyr', '700'],
    ['noto-sans-sc', 'MRY Display SC', '900'],
    ['noto-sans-jp', 'MRY Display JP', '900'],
    ['noto-sans-kr', 'MRY Display KR', '900'],
  ]) {
    const dir = join(root, 'node_modules', '@fontsource', pkg, 'files');
    for (const f of readdirSync(dir)) if (f.endsWith(`-${weight}-normal.woff2`)) GlobalFonts.registerFromPath(join(dir, f), family);
  }
  const g = globalThis as Record<string, unknown>;
  g.Path2D = Path2D;
  g.document = {
    createElement(tag: string) {
      if (tag !== 'canvas') throw new Error(`createElement(${tag}) no soportado en el simulador`);
      return createCanvas(1, 1);
    },
    fonts: { check: () => true, load: async () => [] },
  };
  strictBrowser();
}

type AnyFn = (...args: unknown[]) => unknown;

function strictBrowser() {
  const probe = createCanvas(2, 2).getContext('2d');
  const proto = Object.getPrototypeOf(probe) as Record<string, AnyFn>;
  const wrap = (name: string, check: (self: unknown, args: unknown[]) => void) => {
    const orig = proto[name];
    if (typeof orig !== 'function') return;
    proto[name] = function (this: unknown, ...args: unknown[]) {
      check(this, args);
      return orig.apply(this, args);
    };
  };
  const finiteArgs = (name: string, n: number) => (_self: unknown, args: unknown[]) => {
    for (let i = 0; i < Math.min(n, args.length); i++) {
      if (typeof args[i] === 'number' && !Number.isFinite(args[i] as number)) {
        REC.nonFinite.push(`${name}(${args.slice(0, n).map((a) => (typeof a === 'number' ? (Number.isFinite(a) ? Math.round(a) : String(a)) : typeof a)).join(', ')})`);
        return;
      }
    }
  };
  // Igual que el navegador: radio negativo = excepción (IndexSizeError).
  wrap('arc', (s, a) => {
    finiteArgs('arc', 5)(s, a);
    if ((a[2] as number) < 0) throw new RangeError(`IndexSizeError: arc con radio negativo (${a[2]})`);
  });
  wrap('arcTo', (s, a) => {
    finiteArgs('arcTo', 5)(s, a);
    if ((a[4] as number) < 0) throw new RangeError(`IndexSizeError: arcTo con radio negativo (${a[4]})`);
  });
  wrap('ellipse', (s, a) => {
    finiteArgs('ellipse', 7)(s, a);
    if ((a[2] as number) < 0 || (a[3] as number) < 0) throw new RangeError('IndexSizeError: ellipse con radio negativo');
  });
  for (const name of ['createLinearGradient', 'createRadialGradient']) {
    wrap(name, (_s, a) => {
      if (a.some((v) => typeof v === 'number' && !Number.isFinite(v))) throw new TypeError(`${name}: valor no finito`);
      if (name === 'createRadialGradient' && ((a[2] as number) < 0 || (a[5] as number) < 0)) throw new RangeError('IndexSizeError: radio negativo');
    });
  }
  for (const [name, n] of [['moveTo', 2], ['lineTo', 2], ['fillRect', 4], ['strokeRect', 4], ['rect', 4], ['quadraticCurveTo', 4], ['bezierCurveTo', 6], ['translate', 2], ['scale', 2], ['rotate', 1]] as [string, number][]) {
    wrap(name, finiteArgs(name, n));
  }
  wrap('drawImage', (_s, a) => {
    const img = a[0] as { width: number; height: number };
    if (!img || !img.width || !img.height) throw new Error('InvalidStateError: drawImage de un lienzo de 0 px');
  });
  const grad = Object.getPrototypeOf(probe.createLinearGradient(0, 0, 1, 1)) as Record<string, AnyFn>;
  const addStop = grad.addColorStop;
  grad.addColorStop = function (this: unknown, ...args: unknown[]) {
    const off = args[0] as number;
    if (!(off >= 0 && off <= 1)) throw new RangeError(`IndexSizeError: addColorStop(${off})`);
    return addStop.apply(this, args);
  };
  const createPattern = proto.createPattern;
  proto.createPattern = function (this: unknown, ...args: unknown[]) {
    if (REC.noGrain) return null;
    return createPattern.apply(this, args);
  };
  // Registro de textos con su caja real (tras la transformación actual).
  for (const name of ['fillText', 'strokeText']) {
    const orig = proto[name];
    proto[name] = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
      const [text, x, y] = args as [string, number, number];
      if (typeof text === 'string' && (!Number.isFinite(x) || !Number.isFinite(y))) REC.nonFinite.push(`${name}("${text}", ${x}, ${y})`);
      if (REC.on && (this as unknown as { canvas: Canvas }).canvas === REC.target && typeof text === 'string' && text.trim()) {
        const m = this.measureText(text);
        const lx0 = x - m.actualBoundingBoxLeft, lx1 = x + m.actualBoundingBoxRight;
        const ly0 = y - m.actualBoundingBoxAscent, ly1 = y + m.actualBoundingBoxDescent;
        const t = this.getTransform();
        const pts = [
          [lx0, ly0],
          [lx1, ly0],
          [lx0, ly1],
          [lx1, ly1],
        ].map(([px, py]) => [t.a * px + t.c * py + t.e, t.b * px + t.d * py + t.f]);
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        REC.texts.push({
          text,
          font: this.font,
          x0: Math.min(...xs),
          x1: Math.max(...xs),
          y0: Math.min(...ys),
          y1: Math.max(...ys),
          by: t.b * x + t.d * y + t.f,
          alpha: this.globalAlpha,
          stroke: name === 'strokeText',
        });
      }
      if (REC.noText && (this as unknown as { canvas: Canvas }).canvas === REC.target) return undefined;
      return orig.apply(this, args);
    };
  }
}

export { createCanvas };
