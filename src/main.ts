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
const picker = document.getElementById('lang-select') as HTMLSelectElement | null;
const pickerCode = document.getElementById('lang-code');

function syncPicker(lang: Lang) {
  if (picker) picker.value = lang;
  if (pickerCode) pickerCode.textContent = lang.toUpperCase();
}

/** La URL refleja el idioma: /fr/ → /de/ en las páginas de idioma; sin ?lang= viejo que lo pise al recargar. */
function syncUrl(lang: Lang) {
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  if (pathLang(url.pathname)) url.pathname = url.pathname.replace(/\/[a-z]{2}\/(index\.html)?$/, `/${lang}/`);
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

async function useLang(lang: Lang, chosen: boolean) {
  await loadSiteStrings(lang);
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
}

picker?.addEventListener('change', () => {
  if (isLang(picker.value) && picker.value !== siteLang()) void useLang(picker.value, true);
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
void useLang(detectLang(), false).finally(() => watchAccents());

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
