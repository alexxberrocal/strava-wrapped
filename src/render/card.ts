import type { Countries } from '../geo/countries';
import type { Fmt } from '../i18n/format';
import type { WrappedStats } from '../stats/types';
import { SCRIPT } from '../i18n/langs';
import { COLORS, FONT_TEXT, H, M, THEMES, W, drawTracked, grainPattern, setFont, useScript, type Ctx, type Theme, type ThemeName } from './kit';

export interface DeckEnv {
  fmt: Fmt;
  stats: WrappedStats;
  countries: Countries | null;
  photos: ImageBitmap[];
  brand: string;
  domain: string;
}

export interface Frame {
  ctx: Ctx;
  /** Milisegundos desde que aparece la tarjeta. */
  t: number;
  /** Píxeles de dispositivo por unidad lógica. */
  scale: number;
  theme: Theme;
  env: DeckEnv;
  /** Estado final sin animación (imagen para compartir). */
  still: boolean;
  /** Capa cacheada del tamaño de la tarjeta (se regenera si cambia la escala). */
  layer(key: string, draw: (g: Ctx) => void): HTMLCanvasElement;
  /** Memoria por tarjeta para cálculos caros. */
  memo<T>(key: string, make: () => T): T;
}

export interface Card {
  id: string;
  theme: ThemeName;
  /** Tiempo en pantalla antes de pasar a la siguiente (ms). */
  duration: number;
  render(f: Frame): void;
}

interface CardState {
  scale: number;
  layers: Map<string, HTMLCanvasElement>;
  memo: Map<string, unknown>;
}

/** Dibuja tarjetas en un canvas a cualquier resolución (pantalla, PNG 1080×1920, vídeo). */
export class CardPainter {
  private states = new WeakMap<Card, { memo: Map<string, unknown>; byScale: Map<number, CardState> }>();

  constructor(private env: DeckEnv) {}

  /** Pintor independiente (cachés propias) con los mismos datos: para exportar sin interferir con la pantalla. */
  clone(): CardPainter {
    return new CardPainter(this.env);
  }

  get deckEnv(): DeckEnv {
    return this.env;
  }

  private state(card: Card, scale: number): CardState {
    let entry = this.states.get(card);
    if (!entry) {
      entry = { memo: new Map(), byScale: new Map() };
      this.states.set(card, entry);
    }
    const key = Math.round(scale * 10000) / 10000;
    let s = entry.byScale.get(key);
    if (!s) {
      s = { scale, layers: new Map(), memo: entry.memo };
      entry.byScale.set(key, s);
      // Como mucho 3 resoluciones vivas por tarjeta.
      if (entry.byScale.size > 3) entry.byScale.delete(entry.byScale.keys().next().value as number);
    }
    return s;
  }

  paint(ctx: Ctx, card: Card, t: number, scale: number, opts: { still?: boolean; chrome?: boolean | 'left'; offsetX?: number; offsetY?: number } = {}) {
    useScript(SCRIPT[this.env.fmt.lang]);
    const st = this.state(card, scale);
    const theme = THEMES[card.theme];
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, opts.offsetX ?? 0, opts.offsetY ?? 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);
    const frame: Frame = {
      ctx,
      t: opts.still ? 1e9 : t,
      scale,
      theme,
      env: this.env,
      still: !!opts.still,
      layer: (key, draw) => {
        let c = st.layers.get(key);
        if (!c) {
          c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(W * scale));
          c.height = Math.max(1, Math.round(H * scale));
          const g = c.getContext('2d')!;
          g.setTransform(scale, 0, 0, scale, 0, 0);
          draw(g);
          st.layers.set(key, c);
        }
        return c;
      },
      memo: <T,>(key: string, make: () => T): T => {
        if (!st.memo.has(key)) st.memo.set(key, make());
        return st.memo.get(key) as T;
      },
    };
    ctx.save();
    card.render(frame);
    ctx.restore();
    if (opts.chrome !== false) drawChrome(ctx, theme, this.env, opts.chrome === 'left');
    drawGrain(ctx, theme);
    ctx.restore();
  }
}

function drawChrome(ctx: Ctx, theme: Theme, env: DeckEnv, leftOnly = false) {
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = theme.sub;
  setFont(ctx, 'text', 25, 800);
  drawTracked(ctx, env.brand, M, 132, 5);
  if (!leftOnly) {
    setFont(ctx, 'text', 25, 700);
    const name = env.stats.name ? `${env.stats.name.toUpperCase()} · ${env.stats.year}` : String(env.stats.year);
    drawTracked(ctx, name, W - M, 132, 4, 'right');
  }
  // Marca de agua
  ctx.font = `600 25px ${FONT_TEXT}`;
  ctx.fillStyle = theme.sub;
  drawTracked(ctx, env.domain, W / 2, 1828, 2, 'center');
  ctx.restore();
}

function drawGrain(ctx: Ctx, theme: Theme) {
  const pat = grainPattern(ctx);
  if (!pat) return;
  ctx.save();
  // "overlay" con ruido centrado en gris medio: textura sin desplazar el color.
  ctx.globalAlpha = theme.name === 'dark' ? 0.07 : 0.09;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export { COLORS };
