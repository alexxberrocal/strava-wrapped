import type { Card, CardPainter } from '../render/card';
import { H, THEMES, W } from '../render/kit';

/** Reproductor en bucle para la portada (dentro del móvil). Solo anima cuando se ve. */
export class MiniPlayer {
  private ctx: CanvasRenderingContext2D;
  private index = 0;
  private t = 0;
  private last = 0;
  private raf = 0;
  private visible = true;
  private reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  private io: IntersectionObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    private cards: Card[],
    private painter: CardPainter,
    private perCard = 5200,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.io = new IntersectionObserver((entries) => {
      this.visible = entries.some((e) => e.isIntersecting);
      if (this.visible) this.kick();
    });
    this.io.observe(canvas);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.kick();
  }

  setCards(cards: Card[], painter: CardPainter) {
    this.cards = cards;
    this.painter = painter;
    this.index = 0;
    this.t = 0;
    this.kick();
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    this.draw();
  }

  private kick() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (!this.visible || !this.cards.length) return;
    const dt = Math.min(100, now - this.last);
    this.last = now;
    if (!this.reduced) {
      this.t += dt;
      if (this.t > this.perCard) {
        this.t = 0;
        this.index = (this.index + 1) % this.cards.length;
      }
    } else this.t = 1e9;
    this.draw();
    if (!this.reduced || this.t < 1e9) this.raf = requestAnimationFrame(this.loop);
  };

  private draw() {
    const card = this.cards[this.index];
    if (!card) return;
    const cw = this.canvas.width, ch = this.canvas.height;
    const scale = Math.min(cw / W, ch / H);
    const oy = (ch - H * scale) / 2;
    const ox = (cw - W * scale) / 2;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = THEMES[card.theme].bg;
    ctx.fillRect(0, 0, cw, ch);
    this.painter.paint(ctx, card, this.reduced ? 0 : this.t, scale, { still: this.reduced, offsetX: ox, offsetY: oy });
    // Barras de progreso tipo "stories"
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = this.cards.length;
    const pad = cw * 0.06, gap = cw * 0.012, top = Math.max(oy, ch * 0.035) + ch * 0.012;
    const bw = (cw - pad * 2 - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const x = pad + i * (bw + gap);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x, top, bw, Math.max(2, ch * 0.004));
      const f = i < this.index ? 1 : i === this.index ? Math.min(1, this.t / this.perCard) : 0;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, top, bw * f, Math.max(2, ch * 0.004));
    }
  }
}
