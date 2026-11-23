import './styles/main.css';
import { BRAND } from './config';
import { applySiteLang, detectLang, detectUnits, saveLang, setSiteLang, siteLang } from './i18n/site';
import { Fmt, type Lang } from './i18n/format';
import { ensureFonts } from './render/fonts';
import { CardPainter, type Card, type DeckEnv } from './render/card';
import { buildDeck } from './render/deck';
import { H, W } from './render/kit';
import { loadCountries } from './geo/countries';
import { Flow } from './ui/flow';
import { MiniPlayer } from './ui/mini';

const units = detectUnits();
setSiteLang(detectLang());
applySiteLang();

const strava = document.getElementById('strava-link') as HTMLAnchorElement | null;
if (strava) strava.href = BRAND.stravaExportUrl;

const flow = new Flow(document.getElementById('flow')!, document.getElementById('results')!, () => units);
document.getElementById('demo-btn')?.addEventListener('click', () => void flow.playDemo(units));

// ---------------- Idioma ----------------
const langButtons = document.querySelectorAll<HTMLButtonElement>('.lang button');
function setLang(lang: Lang) {
  setSiteLang(lang);
  saveLang(lang);
  applySiteLang();
  langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  void refreshDemo();
}
langButtons.forEach((b) => {
  b.setAttribute('aria-pressed', String(b.dataset.lang === siteLang()));
  b.addEventListener('click', () => setLang(b.dataset.lang as Lang));
});

// ---------------- Demo en portada y galería ----------------
const HERO_IDS = ['intro', 'distance', 'heatmap', 'calendar', 'countries', 'records', 'archetype', 'summary'];
const GALLERY_IDS = ['intro', 'distance', 'time', 'calendar', 'elevation', 'records', 'heatmap', 'countries', 'allruns', 'habits', 'heart', 'archetype', 'summary'];
let mini: MiniPlayer | null = null;
let galleryToken = 0;

async function demoDeck(): Promise<{ cards: Card[]; painter: CardPainter }> {
  const lang = siteLang();
  const [{ demoStats }, , countries] = await Promise.all([import('./demo/demo'), ensureFonts(), loadCountries().catch(() => null)]);
  const stats = demoStats(lang);
  const env: DeckEnv = { fmt: new Fmt(lang, units), stats, countries, photos: [], brand: BRAND.name, domain: BRAND.domain };
  return { cards: buildDeck(env), painter: new CardPainter(env) };
}

async function refreshDemo() {
  const { cards, painter } = await demoDeck();
  const byId = new Map(cards.map((c) => [c.id, c]));
  const hero = HERO_IDS.map((id) => byId.get(id)).filter((c): c is Card => !!c);
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (canvas) {
    if (!mini) mini = new MiniPlayer(canvas, hero, painter);
    else mini.setCards(hero, painter);
  }
  renderGallery(
    GALLERY_IDS.map((id) => byId.get(id)).filter((c): c is Card => !!c),
    painter,
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

void refreshDemo();

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__flow = flow;
}
