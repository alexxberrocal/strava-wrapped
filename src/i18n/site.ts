import { ADS, BRAND } from '../config';
import { guardAccents } from '../ui/typo';
import { LOCALE, isLang, langFromTag, type Lang } from './langs';
import { PAGE_SLUG, type PageId } from './pages/types';
import { polishSite as polish } from './polish';
import { es, type SiteKey, type SiteMessages } from './site/es';
import en from './site/en';

export type { SiteKey } from './site/es';

/**
 * Textos de la web (las tarjetas llevan los suyos en ./cards). Español e inglés van en el
 * paquete principal; el resto de idiomas se descarga al elegirlo. Claves usadas en index.html
 * con data-i18n (texto), data-i18n-html (HTML de nuestro diccionario) y data-i18n-aria.
 */
const dicts = new Map<Lang, SiteMessages>([
  ['es', polish('es', es)],
  ['en', polish('en', en)],
]);
const loaders: Partial<Record<Lang, () => Promise<{ default: SiteMessages }>>> = {
  ca: () => import('./site/ca'),
  fr: () => import('./site/fr'),
  de: () => import('./site/de'),
  it: () => import('./site/it'),
  pt: () => import('./site/pt'),
  nl: () => import('./site/nl'),
  ru: () => import('./site/ru'),
  zh: () => import('./site/zh'),
  ja: () => import('./site/ja'),
  ko: () => import('./site/ko'),
};

/** Descarga los textos de un idioma (sin red se queda el de respaldo). */
export async function loadSiteStrings(lang: Lang): Promise<void> {
  if (dicts.has(lang)) return;
  const load = loaders[lang];
  if (!load) return;
  try {
    dicts.set(lang, polish(lang, (await load()).default));
  } catch {
    /* sin red: se usa el respaldo */
  }
}

let current: Lang = 'es';

export function setSiteLang(lang: Lang) {
  current = lang;
}
export function siteLang(): Lang {
  return current;
}

/** Porcentaje de progreso con el formato del idioma ("45 %", "45%"…). */
export function pctLabel(x: number): string {
  return new Intl.NumberFormat(LOCALE[current], { style: 'percent', maximumFractionDigits: 0 }).format(Math.max(0, Math.min(1, x)));
}

export function tr(key: SiteKey, vars: Record<string, string | number> = {}, lang: Lang = current): string {
  // Con publicidad, la respuesta sobre cookies es otra.
  if (key === 'faq.a9' && ADS.client) key = 'faq.a9ads';
  // Respaldo si un idioma no ha podido descargarse: catalán → español; el resto → inglés.
  const fallback = lang === 'ca' ? dicts.get('es')! : dicts.get('en')!;
  let s = dicts.get(lang)?.[key] ?? fallback[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Aplica traducciones a los elementos con data-i18n (texto) y data-i18n-html (HTML de confianza: nuestro diccionario). */
export function applySiteLang(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    el.textContent = tr(el.dataset.i18n as SiteKey);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    el.innerHTML = tr(el.dataset.i18nHtml as SiteKey);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', tr(el.dataset.i18nAria as SiteKey));
  });
  // Enlaces a las páginas de texto (guía, aviso legal…) del idioma elegido.
  root.querySelectorAll<HTMLAnchorElement>('a[data-page]').forEach((a) => {
    const slug = PAGE_SLUG[a.dataset.page as PageId];
    if (slug) a.setAttribute('href', `${pathLang() ? '../' : ''}${current}/${slug}/`);
  });
  if (root === document) {
    document.documentElement.lang = LOCALE[current];
    document.title = tr('meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', tr('meta.description'));
  }
  // Tildes de los titulares (Á, Ñ…) sin chocar con la línea de arriba.
  guardAccents(root);
}

const STORE_KEY = `${BRAND.slug}.lang`;

/** Carpeta de idioma de la página (/en/, /fr/…), si la hay. */
export function pathLang(pathname = location.pathname): Lang | null {
  const m = pathname.match(/\/([a-z]{2})\/(?:index\.html)?$/);
  return m && isLang(m[1]) ? m[1] : null;
}

/**
 * Idioma inicial: el del enlace (?lang= o la carpeta /en/, /fr/…: es el de la vista previa que se
 * vio al compartirlo), el elegido antes en el selector, o el primero del navegador que tengamos.
 */
export function detectLang(): Lang {
  const fromUrl = langFromTag(new URLSearchParams(location.search).get('lang')) ?? pathLang();
  if (fromUrl) return fromUrl;
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* sin almacenamiento */
  }
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const lang = langFromTag(tag);
    if (lang) return lang;
  }
  return 'en';
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(STORE_KEY, lang);
  } catch {
    /* nada */
  }
}

/** Millas para quien navega con región de EE. UU., Liberia o Myanmar (en-US, es-US…); si no, km. */
export function detectUnits(): 'metric' | 'imperial' {
  const tag = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  const region = tag.split(/[-_]/)[1];
  return region === 'us' || region === 'lr' || region === 'mm' || tag === 'my' ? 'imperial' : 'metric';
}
