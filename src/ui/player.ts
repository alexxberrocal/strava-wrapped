import type { Card, CardPainter } from '../render/card';
import { THEMES, W } from '../render/kit';
import { BRAND } from '../config';
import { tr } from '../i18n/site';
import { ICONS, h, iconButton } from './dom';

export interface PlayerOptions {
  cards: Card[];
  painter: CardPainter;
  start?: number;
  demo?: boolean;
  onShare(card: Card, index: number): void;
  onClose(index: number): void;
  /** Al tocar "siguiente" en la última tarjeta. */
  onFinish?(): void;
}

const FADE_MS = 280;

/** Visor a pantalla completa estilo "stories": barras de progreso, toques, mantener para pausar, teclado. */
export class StoryPlayer {
  private root!: HTMLElement;
  private frame!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private fills: HTMLElement[] = [];
  private pauseBtn!: HTMLButtonElement;
  private index = 0;
  private t = 0;
  private paused = false;
  private held = false;
  private holdTimer = 0;
  private suppressClick = false;
  private raf = 0;
  private last = 0;
  private scale = 1;
  private from: HTMLCanvasElement | null = null;
  private fromAt = 0;
  private fromDir = 1;
  private pushedState = false;
  private down: { x: number; y: number; at: number } | null = null;
  private ro: ResizeObserver | null = null;
  private closed = false;

  constructor(private o: PlayerOptions) {}

  open() {
    const o = this.o;
    this.index = Math.max(0, Math.min(o.cards.length - 1, o.start ?? 0));
    this.canvas = h('canvas', { class: 'story__canvas', 'aria-hidden': 'true' });
    const bars = h('div', { class: 'story__bars' });
    this.fills = o.cards.map(() => {
      const fill = h('i');
      bars.append(h('div', { class: 'story__bar' }, fill));
      return fill;
    });
    this.pauseBtn = iconButton('pause', tr('story.pause'), () => this.togglePause());
    const top = h('div', { class: 'story__top' }, this.pauseBtn, iconButton('close', tr('story.close'), () => this.close()));
    const prevTap = h('button', { type: 'button', class: 'story__tap story__tap--prev', 'aria-label': tr('story.prev'), onclick: () => this.tap(-1) });
    const nextTap = h('button', { type: 'button', class: 'story__tap story__tap--next', 'aria-label': tr('story.next'), onclick: () => this.tap(1) });
    this.frame = h('div', { class: 'story__frame' }, this.canvas, bars, top, prevTap, nextTap, o.demo ? h('div', { class: 'story__badge' }, tr('story.demo')) : null);
    const shareBtn = h('button', { type: 'button', class: 'btn btn--primary', html: `${ICONS.share}<span>${tr('story.share')}</span>`, onclick: () => this.share() });
    shareBtn.querySelector('svg')!.setAttribute('width', '20');
    const allBtn = h('button', { type: 'button', class: 'btn btn--ghost', html: `<span>${tr('story.all')}</span>`, onclick: () => this.close() });
    const actions = h('div', { class: 'story__actions' }, shareBtn, allBtn);
    const stage = h('div', { class: 'story__stage' }, this.frame, actions);
    this.root = h(
      'div',
      { class: 'story', role: 'dialog', 'aria-modal': 'true', 'aria-label': BRAND.text },
      stage,
      iconButton('prev', tr('story.prev'), () => this.go(this.index - 1), 'story__nav story__nav--prev'),
      iconButton('next', tr('story.next'), () => this.tap(1), 'story__nav story__nav--next'),
    );
    document.body.append(this.root);
    document.body.classList.add('is-locked');
    this.ctx = this.canvas.getContext('2d')!;

    this.frame.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    window.addEventListener('keydown', this.onKey);
    document.addEventListener('visibilitychange', this.onVis);
    window.addEventListener('popstate', this.onPop);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.frame);
    try {
      history.pushState({ story: true }, '');
      this.pushedState = true;
    } catch {
      /* nada */
    }
    this.resize();
    this.applyTheme();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    (shareBtn as HTMLElement).focus({ preventScroll: true });
  }

  get current(): number {
    return this.index;
  }

  private resize() {
    const rect = this.frame.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const hh = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== hh) {
      this.canvas.width = w;
      this.canvas.height = hh;
    }
    this.scale = w / W;
  }

  private applyTheme() {
    const card = this.o.cards[this.index];
    const bg = THEMES[card.theme].bg;
    const narrow = window.matchMedia('(max-width: 700px)').matches;
    this.root.style.background = narrow ? bg : `color-mix(in srgb, ${bg} 22%, #0b0b0b)`;
    this.root.dataset.theme = card.theme;
    this.fills.forEach((f, i) => {
      f.style.width = i < this.index ? '100%' : '0%';
    });
  }

  private loop = (now: number) => {
    if (this.closed) return;
    const dt = Math.min(100, now - this.last);
    this.last = now;
    const card = this.o.cards[this.index];
    if (!this.paused && !this.held) {
      this.t += dt;
      if (this.t >= card.duration) {
        if (this.index < this.o.cards.length - 1) this.go(this.index + 1, true);
        else this.t = card.duration;
      }
    }
    this.paint(now);
    this.raf = requestAnimationFrame(this.loop);
  };

  private paint(now: number) {
    const card = this.o.cards[this.index];
    // Sin el nombre de la cabecera: ahí van los controles del visor (en la imagen exportada sí sale).
    this.o.painter.paint(this.ctx, card, this.t, this.scale, { chrome: 'left' });
    if (this.from) {
      const p = (now - this.fromAt) / FADE_MS;
      if (p >= 1) this.from = null;
      else {
        const e = 1 - (1 - p) ** 3;
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = 1 - e;
        this.ctx.drawImage(this.from, -this.fromDir * e * this.canvas.width * 0.08, 0);
        this.ctx.restore();
      }
    }
    const fill = this.fills[this.index];
    if (fill) fill.style.width = `${Math.min(100, (this.t / card.duration) * 100)}%`;
  }

  go(i: number, auto = false) {
    if (i < 0) {
      this.t = 0;
      return;
    }
    if (i >= this.o.cards.length) {
      this.o.onFinish ? this.o.onFinish() : this.close();
      return;
    }
    if (i === this.index) return;
    // Instantánea para el fundido.
    const snap = document.createElement('canvas');
    snap.width = this.canvas.width;
    snap.height = this.canvas.height;
    snap.getContext('2d')!.drawImage(this.canvas, 0, 0);
    this.from = snap;
    this.fromAt = performance.now();
    this.fromDir = i > this.index ? 1 : -1;
    this.index = i;
    this.t = 0;
    if (!auto) this.paused = false;
    this.updatePauseIcon();
    this.applyTheme();
  }

  private tap(dir: 1 | -1) {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    if (dir < 0 && this.t > 1200) {
      this.t = 0;
      return;
    }
    this.go(this.index + dir);
  }

  togglePause() {
    this.paused = !this.paused;
    this.updatePauseIcon();
  }

  private updatePauseIcon() {
    this.pauseBtn.innerHTML = this.paused ? ICONS.play : ICONS.pause;
    this.pauseBtn.setAttribute('aria-label', this.paused ? tr('story.play') : tr('story.pause'));
  }

  pause() {
    this.paused = true;
    this.updatePauseIcon();
  }

  private share() {
    this.pause();
    this.o.onShare(this.o.cards[this.index], this.index);
  }

  private onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('.story__top')) return;
    this.down = { x: e.clientX, y: e.clientY, at: performance.now() };
    window.clearTimeout(this.holdTimer);
    this.holdTimer = window.setTimeout(() => {
      this.held = true;
    }, 220);
  };

  private onUp = (e: PointerEvent) => {
    window.clearTimeout(this.holdTimer);
    const d = this.down;
    this.down = null;
    if (this.held) {
      this.held = false;
      this.suppressClick = true;
      setTimeout(() => (this.suppressClick = false), 60);
    }
    if (d && e.clientY - d.y > 110 && Math.abs(e.clientX - d.x) < 90) {
      this.suppressClick = true;
      this.close();
    }
  };

  private onKey = (e: KeyboardEvent) => {
    if (document.querySelector('.sheet')) return;
    if (e.key === 'ArrowRight') this.go(this.index + 1);
    else if (e.key === 'ArrowLeft') this.go(this.index - 1);
    else if (e.key === 'Escape') this.close();
    else if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      this.togglePause();
    } else return;
    e.preventDefault();
  };

  private onVis = () => {
    if (document.hidden) this.pause();
  };

  private onPop = () => {
    this.pushedState = false;
    this.close();
  };

  close() {
    if (this.closed) return;
    this.closed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('keydown', this.onKey);
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('popstate', this.onPop);
    if (this.pushedState) {
      this.pushedState = false;
      try {
        history.back();
      } catch {
        /* nada */
      }
    }
    this.root.remove();
    document.body.classList.remove('is-locked');
    this.o.onClose(this.index);
  }
}
