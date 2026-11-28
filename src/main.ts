import './styles/main.css';
import { BRAND } from './config';
import { applySiteLang, detectLang, detectUnits, loadSiteStrings, pathLang, saveLang, setSiteLang, siteLang } from './i18n/site';
import { Fmt } from './i18n/format';
import { isLang, type Lang } from './i18n/langs';
import { ensureCardAssets, ensureScriptFonts, preloadDeckText } from './render/fonts';
import { CardPainter, type Card, type DeckEnv } from './render/card';
import { buildDeck } from './render/deck';
import { H, W } from './render/kit';
import { loadCountries } from './geo/countries';
import { fillAds } from './ui/ads';
import { Flow } from './ui/flow';
import { MiniPlayer } from './ui/mini';
import { watchAccents } from './ui/typo';

// En pantallas táctiles no se "arrastra": cambia el texto de la zona de subida.
if (window.matchMedia?.('(pointer: coarse)').matches) {
  document.querySelector('.drop__title')?.setAttribute('data-i18n', 'drop.titleTouch');
  document.querySelector('.drop__sub')?.setAttribute('data-i18n', 'drop.subTouch');
}

const strava = document.getElementById('strava-link') as HTMLAnchorElement | null;
if (strava) strava.href = BRAND.stravaExportUrl;

const flow = new Flow(document.getElementById('flow')!, document.getElementById('results')!, () => detectUnits());
document.getElementById('demo-btn')?.addEventListener('click', () => void flow.playDemo(detectUnits()));

// ---------------- Idioma ----------------
// Menú propio (<details> con enlaces a la página de cada idioma): sin JavaScript navega; con él,
// cambia el idioma sin recargar (y sin perder el archivo que ya esté cargado).
const langMenu = document.getElementById('lang-menu') as HTMLDetailsElement | null;
const langCode = document.getElementById('lang-code');
const langBtn = langMenu?.querySelector<HTMLElement>('summary') ?? null;
const langLinks = () => [...(langMenu?.querySelectorAll<HTMLAnchorElement>('a[data-lang]') ?? [])];

function syncPicker(lang: Lang) {
  if (langCode) langCode.textContent = lang.toUpperCase();
  for (const a of langLinks()) {
    if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
}

/** La URL refleja el idioma: /fr/ → /de/ en las páginas de idioma; sin ?lang= viejo que lo pise al recargar. */
function syncUrl(lang: Lang) {
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  if (pathLang(url.pathname)) url.pathname = url.pathname.replace(/\/[a-z]{2}\/(index\.html)?$/, `/${lang}/`);
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

let langToken = 0;
/** Último cambio de idioma que llegó a aplicarse (si no coincide con langToken, hay uno en curso). */
let langApplied = 0;

async function useLang(lang: Lang, chosen: boolean) {
  // Si se elige otro idioma mientras este se descarga, manda el último (antes podía quedarse el
  // idioma anterior con el botón marcando otro).
  const token = ++langToken;
  syncPicker(lang);
  await loadSiteStrings(lang);
  if (token !== langToken) return;
  langApplied = token;
  setSiteLang(lang);
  applySiteLang();
  syncPicker(lang);
  if (chosen) {
    saveLang(lang);
    syncUrl(lang);
  }
  // Titulares de la web en cirílico/CJK con su tipografía (Anton solo tiene alfabeto latino).
  void ensureScriptFonts('', lang);
  void refreshDemo();
  // Con un archivo ya cargado, sus ajustes y sus pantallas también cambian de idioma.
  void flow.relocalize();
}

function closeLangMenu(focus = false) {
  if (!langMenu?.open) return;
  langMenu.open = false;
  if (focus) langBtn?.focus();
}

langMenu?.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-lang]');
  if (!a) return;
  // Con Ctrl/Cmd/Mayús (otra pestaña o ventana), el enlace hace lo suyo.
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  closeLangMenu(true);
  const lang = a.dataset.lang;
  // También si se vuelve a elegir el actual mientras otro se descarga: manda la última pulsación.
  if (isLang(lang) && (lang !== siteLang() || langToken !== langApplied)) void useLang(lang, true);
});
// Al abrirlo, el foco va al idioma actual; flechas para moverse, Escape o un toque fuera para cerrar.
langMenu?.addEventListener('toggle', () => {
  if (langMenu.open) (langLinks().find((a) => a.getAttribute('aria-current')) ?? langLinks()[0])?.focus({ preventScroll: true });
});
langMenu?.addEventListener('keydown', (e) => {
  if (!langMenu.open) return;
  const links = langLinks();
  const i = links.indexOf(document.activeElement as HTMLAnchorElement);
  const step = e.key === 'ArrowDown' ? 2 : e.key === 'ArrowUp' ? -2 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeLangMenu(true);
  } else if (e.key === 'Home' || e.key === 'End') {
    e.preventDefault();
    links[e.key === 'Home' ? 0 : links.length - 1]?.focus();
  } else if (step && i >= 0) {
    e.preventDefault();
    links[Math.max(0, Math.min(links.length - 1, i + step))]?.focus();
  }
});
document.addEventListener('pointerdown', (e) => {
  if (langMenu?.open && !langMenu.contains(e.target as Node)) closeLangMenu();
});
langMenu?.addEventListener('focusout', (e) => {
  const to = (e as FocusEvent).relatedTarget as Node | null;
  if (to && !langMenu.contains(to)) closeLangMenu();
});

// ---------------- Demo en portada y galería ----------------
const HERO_IDS = ['intro', 'distance', 'heatmap', 'calendar', 'countries', 'records', 'archetype', 'summary'];
const GALLERY_IDS = ['intro', 'distance', 'time', 'calendar', 'elevation', 'records', 'heatmap', 'countries', 'allruns', 'habits', 'heart', 'archetype', 'summary'];
let mini: MiniPlayer | null = null;
let galleryToken = 0;

let demoToken = 0;

async function refreshDemo() {
  const token = ++demoToken;
  const lang = siteLang();
  const countriesP = loadCountries().catch(() => null);
  const [{ demoStats }] = await Promise.all([import('./demo/demo'), ensureCardAssets(lang)]);
  if (token !== demoToken) return;
  const stats = demoStats(lang);
  const make = (countries: Awaited<typeof countriesP>) => {
    const env: DeckEnv = { fmt: new Fmt(lang, detectUnits()), stats, countries, photos: [], brand: BRAND.name, domain: BRAND.domain };
    return { cards: buildDeck(env), painter: new CardPainter(env) };
  };
  const apply = (d: { cards: Card[]; painter: CardPainter }, keep: boolean) => {
    const byId = new Map(d.cards.map((c) => [c.id, c]));
    const hero = HERO_IDS.map((id) => byId.get(id)).filter((c): c is Card => !!c);
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
    if (canvas) {
      if (!mini) mini = new MiniPlayer(canvas, hero, d.painter);
      else mini.setCards(hero, d.painter, keep);
    }
    return byId;
  };
  // 1) La demo arranca ya; 2) cuando llega el mapa del mundo se añaden las tarjetas con mapa.
  const first = make(null);
  await preloadDeckText(first.painter, first.cards, lang);
  if (token !== demoToken) return;
  apply(first, false);
  const countries = await countriesP;
  if (token !== demoToken) return;
  const full = make(countries);
  await preloadDeckText(full.painter, full.cards, lang);
  if (token !== demoToken) return;
  const byId = apply(full, true);
  renderGallery(
    GALLERY_IDS.map((id) => byId.get(id)).filter((c): c is Card => !!c),
    full.painter,
  );
}

function renderGallery(cards: Card[], painter: CardPainter) {
  const strip = document.getElementById('gallery');
  if (!strip) return;
  const token = ++galleryToken;
  strip.replaceChildren();
  const imgs = cards.map(() => {
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    const item = document.createElement('div');
    item.className = 'gallery__item';
    item.append(img);
    strip.append(item);
    return img;
  });
  const draw = async () => {
    const c = document.createElement('canvas');
    const width = 300;
    c.width = Math.round(width * Math.min(2, window.devicePixelRatio || 1));
    c.height = Math.round((c.width * H) / W);
    const ctx = c.getContext('2d')!;
    const local = painter.clone();
    for (let i = 0; i < cards.length; i++) {
      if (token !== galleryToken) return;
      local.paint(ctx, cards[i], 0, c.width / W, { still: true });
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.9));
      if (blob && token === galleryToken) {
        const prev = imgs[i].src;
        imgs[i].src = URL.createObjectURL(blob);
        if (prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      }
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
  };
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      void draw();
    }
  }, { rootMargin: '300px' });
  io.observe(strip);
}


// Arranque: idioma (y con él la demo de la portada).
void useLang(detectLang(), false).finally(() => {
  watchAccents();
  fillAds();
});

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__flow = flow;
  // /?sample carga el export de prueba (npm run sample) para probar el flujo completo.
  const sample = new URLSearchParams(location.search).get('sample');
  if (sample != null) {
    void fetch(`./__sample.zip${sample ? `?name=${encodeURIComponent(sample)}` : ''}`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('npm run sample'))))
      .then((b) => {
        document.getElementById('crear')?.scrollIntoView();
        void flow.start({ kind: 'zip', file: new File([b], 'export_12345678.zip', { type: 'application/zip' }) });
      })
      .catch((e) => console.warn(e));
  }
}
