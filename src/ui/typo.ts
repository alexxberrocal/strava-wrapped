/**
 * Titulares en Anton con interlineado prieto: las mayúsculas con tilde (Á, Ñ, É, Ü, Й…) suben
 * un 25 % más que el resto y chocan con la línea de arriba ("DE TU AÑO" se leía mal), y la
 * cedilla (Ç) y las comas ("ERZÄHLT,") bajan y chocan con la de abajo. Cada palabra así se
 * envuelve en un <span> y, solo si no está en la primera línea (o, lo que baja, en la última),
 * gana el aire justo.
 * Se recalcula al cambiar de idioma y de tamaño de ventana.
 */

// Marcas combinantes que van encima / debajo de la letra (tras normalizar a NFD).
const UP = /[̀-̽̕̚-̈́͆͊-͌͐-͒͗͛ͣ-ͯ]/;
const DOWN = /[̖-̙̜-̳̹-̼͇ͅ-͉͍͎͓-͖͙͚]/;

/** Comas y puntos y coma: bajan de la línea base (en Anton, lo bastante para tocar la de abajo). */
const DESC_PUNCT = /[,;‚]/;

/** ¿La palabra (en mayúsculas) lleva marcas encima o debajo? */
export function accentNeeds(word: string): { up: boolean; down: boolean } {
  const d = word.toLocaleUpperCase().normalize('NFD');
  return { up: UP.test(d), down: DOWN.test(d) };
}

export const DISPLAY_SELECTOR = '.hero__title, .section-title, .step h3, .drop__title, .panel__title, .sheet__title, [data-accent-guard]';

/** Envuelve las palabras con tilde de los titulares y ajusta su aire. */
export function guardAccents(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(DISPLAY_SELECTOR).forEach((el) => {
    fitWidth(el);
    wrapWords(el);
    layout(el);
  });
}

/**
 * Titulares con palabras larguísimas ("HARDLOOPJAAR", "JAHRESRÜCKBLICK"…): si una no cabe en su
 * columna, se reduce el cuerpo de letra lo justo en vez de que se salga.
 */
export function fitWidth(el: HTMLElement): void {
  el.style.fontSize = '';
  for (let i = 0; i < 3; i++) {
    const box = el.clientWidth;
    if (!box || el.scrollWidth <= box + 1) return;
    const size = parseFloat(getComputedStyle(el).fontSize);
    el.style.fontSize = `${Math.floor(size * (box / el.scrollWidth) * 0.98 * 10) / 10}px`;
  }
}

function wrapWords(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const t of texts) {
    if (t.parentElement?.classList.contains('acc')) continue;
    const parts = t.data.split(/(\s+)/);
    const needs = (p: string) => p.trim() && (accentNeeds(p).up || accentNeeds(p).down || DESC_PUNCT.test(p));
    if (!parts.some(needs)) continue;
    const frag = document.createDocumentFragment();
    for (const p of parts) {
      const need = p.trim() ? accentNeeds(p) : { up: false, down: false };
      const punct = !!p.trim() && DESC_PUNCT.test(p);
      if (need.up || need.down || punct) {
        const s = document.createElement('span');
        s.className = 'acc';
        if (need.up) s.dataset.up = '1';
        if (need.down) s.dataset.down = '1';
        if (punct) s.dataset.punct = '1';
        s.textContent = p;
        frag.append(s);
      } else frag.append(p);
    }
    t.replaceWith(frag);
  }
}

function layout(el: HTMLElement) {
  const spans = [...el.querySelectorAll<HTMLElement>('span.acc')];
  if (!spans.length) return;
  for (const s of spans) s.classList.remove('acc-up', 'acc-down', 'acc-punct');
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
  if (!rects.length) return;
  const firstTop = Math.min(...rects.map((r) => r.top));
  const lastBottom = Math.max(...rects.map((r) => r.bottom));
  for (const s of spans) {
    const r = s.getBoundingClientRect();
    if (s.dataset.up && r.top > firstTop + 2) s.classList.add('acc-up');
    if (s.dataset.down && r.bottom < lastBottom - 2) s.classList.add('acc-down');
    else if (s.dataset.punct && r.bottom < lastBottom - 2) s.classList.add('acc-punct');
  }
}

let bound = false;
/** Recalcula al cambiar el tamaño de la ventana y cuando cargan las tipografías. */
export function watchAccents(): void {
  if (bound) return;
  bound = true;
  let timer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => guardAccents(), 150);
  });
  document.fonts?.ready.then(() => guardAccents()).catch(() => undefined);
}
