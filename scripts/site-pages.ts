// Páginas estáticas de la web, generadas al compilar a partir del index.html ya construido:
//   - la portada de cada idioma (/es/, /en/, /ca/…) con textos, título, descripción y vista previa
//     (Open Graph) ya traducidos: WhatsApp, Instagram, X o Google no ejecutan el JavaScript;
//   - las páginas de texto de cada idioma (guía, cómo se calcula, sobre el proyecto, aviso legal,
//     privacidad y cookies), sin JavaScript;
//   - sitemap.xml, robots.txt, 404.html, licenses.txt, ads.txt, security.txt y las cabeceras de
//     seguridad (_headers, formato de Cloudflare Pages).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADS, BRAND, LEGAL_UPDATED, OWNER } from '../src/config.ts';
import { LANGS, LOCALE, OG_LOCALE, type Lang } from '../src/i18n/langs.ts';
import { polishSite } from '../src/i18n/polish.ts';
import { PAGE_IDS, PAGE_SLUG, type Block, type Cond, type PageId, type PagesContent } from '../src/i18n/pages/types.ts';
import { es, type SiteKey, type SiteMessages } from '../src/i18n/site/es.ts';
import en from '../src/i18n/site/en.ts';
import ca from '../src/i18n/site/ca.ts';
import fr from '../src/i18n/site/fr.ts';
import de from '../src/i18n/site/de.ts';
import it from '../src/i18n/site/it.ts';
import pt from '../src/i18n/site/pt.ts';
import nl from '../src/i18n/site/nl.ts';
import ru from '../src/i18n/site/ru.ts';
import zh from '../src/i18n/site/zh.ts';
import ja from '../src/i18n/site/ja.ts';
import ko from '../src/i18n/site/ko.ts';
import pagesEs from '../src/i18n/pages/es.ts';
import pagesEn from '../src/i18n/pages/en.ts';
import pagesCa from '../src/i18n/pages/ca.ts';
import pagesFr from '../src/i18n/pages/fr.ts';
import pagesDe from '../src/i18n/pages/de.ts';
import pagesIt from '../src/i18n/pages/it.ts';
import pagesPt from '../src/i18n/pages/pt.ts';
import pagesNl from '../src/i18n/pages/nl.ts';
import pagesRu from '../src/i18n/pages/ru.ts';
import pagesZh from '../src/i18n/pages/zh.ts';
import pagesJa from '../src/i18n/pages/ja.ts';
import pagesKo from '../src/i18n/pages/ko.ts';

const DICTS: Record<Lang, SiteMessages> = { es, en, ca, fr, de, it, pt, nl, ru, zh, ja, ko };
export const PAGES: Record<Lang, PagesContent> = { es: pagesEs, en: pagesEn, ca: pagesCa, fr: pagesFr, de: pagesDe, it: pagesIt, pt: pagesPt, nl: pagesNl, ru: pagesRu, zh: pagesZh, ja: pagesJa, ko: pagesKo };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Lo que cambia de un despliegue a otro: dirección pública, publicidad y datos del titular. */
export interface SiteCfg {
  siteUrl: string;
  ads: { client: string; slots: { home: string; results: string; page: string } };
  owner: { name: string; nif: string; address: string; email: string };
  /** Fecha de la última revisión de los textos legales (AAAA-MM-DD). */
  updated: string;
}

export const siteCfg = (siteUrl: string): SiteCfg => ({ siteUrl, ads: ADS, owner: OWNER, updated: LEGAL_UPDATED });

/** Imagen de vista previa de cada idioma (1200×630, `npm run og`). */
export const ogImage = (lang: Lang) => `og-${lang}.jpg`;

/** Código de idioma para hreflang (el chino de la web es simplificado). */
const hreflang = (l: Lang) => (l === 'zh' ? 'zh-Hans' : l);

// ------------------------------------------------------------------ publicidad (apagada si no hay `client`)

const adsOn = (cfg: SiteCfg) => !!cfg.ads.client;

/** Script de AdSense (trae el aviso de consentimiento homologado de Google) y el botón que lo reabre. */
function adsHead(cfg: SiteCfg): string {
  if (!adsOn(cfg)) return '';
  return (
    `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(cfg.ads.client)}" crossorigin="anonymous"></script>\n` +
    // "Preferencias de privacidad" (pie de todas las páginas): vuelve a abrir el aviso de Google.
    `    <script>document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-consent]');if(!b)return;window.googlefc=window.googlefc||{};googlefc.callbackQueue=googlefc.callbackQueue||[];googlefc.callbackQueue.push(googlefc.showRevocationMessage)});</script>`
  );
}

/** Un hueco de anuncio. `push`: lo activa la propia página (las de texto no llevan la aplicación). */
function adUnit(cfg: SiteCfg, slot: keyof SiteCfg['ads']['slots'], push = false): string {
  const id = cfg.ads.slots[slot];
  if (!adsOn(cfg) || !id) return '';
  return (
    `<aside class="ad ad--${slot}"><div class="wrap"><span class="ad__label" data-i18n="ads.label">Publicidad</span>` +
    `<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(cfg.ads.client)}" data-ad-slot="${esc(id)}" data-ad-format="auto" data-full-width-responsive="true"></ins>` +
    (push ? '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>' : '') +
    '</div></aside>'
  );
}

/**
 * Marcas del index.html que dependen de la configuración: dirección pública, script de anuncios,
 * huecos de anuncio y botón de consentimiento. Vale para desarrollo y para el build.
 */
export function applySiteConfig(html: string, cfg: SiteCfg): string {
  return html
    .replaceAll('%SITE_URL%', cfg.siteUrl)
    .replace(/[ \t]*<!--ads:head-->\n?/, adsOn(cfg) ? `    ${adsHead(cfg)}\n` : '')
    .replace(/[ \t]*<!--ads:home-->\n?/, adUnit(cfg, 'home') ? `      ${adUnit(cfg, 'home')}\n` : '')
    .replace(/[ \t]*<!--ads:results-->\n?/, adUnit(cfg, 'results') ? `      ${adUnit(cfg, 'results')}\n` : '')
    .replace(/[ \t]*<!--ads:consent-->\n?/, adsOn(cfg) ? '          <button type="button" class="linkish" data-consent data-i18n="footer.consent">Preferencias de privacidad</button>\n' : '');
}

// ------------------------------------------------------------------ portadas de cada idioma

/**
 * Traduce el HTML. `dir` = carpeta de la página respecto a la raíz ('' para la raíz, 'en/',
 * 'en/guide/'…), para corregir las rutas relativas, la URL canónica y los enlaces entre páginas.
 */
export function localizeHtml(html: string, lang: Lang, siteUrl: string, dir: string, cfg: SiteCfg = siteCfg(siteUrl), slug = ''): string {
  const d = polishSite(lang, DICTS[lang]);
  const t = (k: string) => (k === 'faq.a9' && adsOn(cfg) ? d['faq.a9ads'] : d[k as SiteKey]) ?? '';
  const pageUrl = siteUrl + dir;
  const rel = '../'.repeat(dir.split('/').filter(Boolean).length);
  let out = html;
  const meta = (attr: 'name' | 'property', key: string, value: string) => {
    out = out.replace(new RegExp(`(<meta ${attr}="${key.replace(/[.:]/g, '\\$&')}" content=")[^"]*(")`), (_m, a: string, b: string) => a + esc(value) + b);
  };
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${LOCALE[lang]}"`);
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(t('meta.title'))}</title>`);
  meta('name', 'description', t('meta.description'));
  meta('property', 'og:title', t('meta.title'));
  meta('property', 'og:description', t('meta.description'));
  meta('property', 'og:url', pageUrl);
  meta('property', 'og:image', siteUrl + ogImage(lang));
  meta('property', 'og:image:alt', t('meta.title'));
  meta('property', 'og:locale', OG_LOCALE[lang]);
  meta('name', 'twitter:title', t('meta.title'));
  meta('name', 'twitter:description', t('meta.description'));
  meta('name', 'twitter:image', siteUrl + ogImage(lang));
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${pageUrl}$2`);
  // Datos estructurados (schema.org) con la descripción y la URL del idioma.
  out = out.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_m, a: string, json: string, b: string) => {
    const data = JSON.parse(json) as Record<string, unknown>;
    data.url = pageUrl;
    data.description = t('meta.description');
    data.inLanguage = LOCALE[lang];
    return a + JSON.stringify(data) + b;
  });
  // Textos: data-i18n (texto), data-i18n-html (HTML de nuestro diccionario), data-i18n-aria.
  out = out.replace(/(<([a-z][a-z0-9]*)\b[^>]*?\sdata-i18n="([\w.]+)"[^>]*>)[\s\S]*?(<\/\2>)/g, (_m, open: string, _tag, key: string, close: string) => open + esc(t(key)) + close);
  out = out.replace(/(<([a-z][a-z0-9]*)\b[^>]*?\sdata-i18n-html="([\w.]+)"[^>]*>)[\s\S]*?(<\/\2>)/g, (_m, open: string, _tag, key: string, close: string) => open + t(key) + close);
  out = out.replace(/<[a-z][a-z0-9]*\b[^>]*\sdata-i18n-aria="([\w.]+)"[^>]*>/g, (tag, key: string) => tag.replace(/aria-label="[^"]*"/, `aria-label="${esc(t(key))}"`));
  // Enlaces a las páginas de texto de este idioma (guía, aviso legal…).
  out = out.replace(/(<a\b[^>]*?\sdata-page="(\w+)"[^>]*?\shref=")[^"]*(")/g, (_m, a: string, id: string, b: string) => `${a}${rel}${lang}/${PAGE_SLUG[id as PageId] ?? ''}/${b}`);
  // Menú de idiomas: cada enlace lleva a esta misma página en su idioma, y el actual va marcado.
  out = out.replace(/<a\b([^>]*?)\sdata-lang="([a-z]{2})"([^>]*)>/g, (_m, pre: string, l: string, post: string) => {
    const attrs = `${pre}${post}`.replace(/\saria-current="[^"]*"/, '').replace(/\shref="[^"]*"/, '');
    return `<a data-lang="${l}" href="${rel}${l}/${slug ? `${slug}/` : ''}"${attrs}${l === lang ? ' aria-current="true"' : ''}>`;
  });
  out = out.replace(/(<span class="lang__code"[^>]*>)[^<]*(<\/span>)/, `$1${lang.toUpperCase()}$2`);
  // Rutas relativas desde la subcarpeta.
  if (rel) out = out.replace(/\s(src|href)="\.\//g, ` $1="${rel}`);
  return out;
}

// ------------------------------------------------------------------ páginas de texto

/** ¿Se cumple la condición de un bloque? */
function on(when: Cond | undefined, cfg: SiteCfg): boolean {
  if (!when) return true;
  if (when === 'ads') return adsOn(cfg);
  if (when === 'noads') return !adsOn(cfg);
  if (when === 'nif') return !!cfg.owner.nif;
  return !!cfg.owner.address;
}

interface Ctx {
  lang: Lang;
  cfg: SiteCfg;
  /** Camino hasta la raíz de la web desde la página ('../../'). */
  rel: string;
}

const fillVars = (s: string, cfg: SiteCfg) =>
  s.replace(/\{(brand|domain|owner|nif|address|email)\}/g, (_m, k: string) =>
    k === 'brand' ? BRAND.text : k === 'domain' ? BRAND.domain : k === 'owner' ? cfg.owner.name : k === 'nif' ? cfg.owner.nif : k === 'address' ? cfg.owner.address : cfg.owner.email,
  );

/** Texto sin marcas (para <title> y descripciones). */
export const plainText = (s: string, cfg: SiteCfg) => fillVars(s, cfg).replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

function linkHref(target: string, c: Ctx): { href: string; external: boolean } {
  const [name, anchor = ''] = target.split('#');
  const hash = anchor ? `#${anchor}` : '';
  if (name === 'home') return { href: `${c.rel}${c.lang}/${hash}`, external: false };
  if (name.startsWith('page:')) {
    const slug = PAGE_SLUG[name.slice(5) as PageId];
    if (!slug) throw new Error(`Página desconocida en un enlace: ${target}`);
    return { href: `${c.rel}${c.lang}/${slug}/${hash}`, external: false };
  }
  if (name === 'strava') return { href: BRAND.stravaExportUrl, external: true };
  if (name === 'mail') return { href: `mailto:${c.cfg.owner.email}`, external: false };
  if (name === 'licenses') return { href: `${c.rel}licenses.txt`, external: false };
  if (/^https:\/\//.test(target)) return { href: target, external: true };
  throw new Error(`Destino de enlace desconocido: ${target}`);
}

/** Detalles tipográficos del idioma: "100 %" sin partir y espacios finos del francés. */
const polished = (text: string, lang: Lang) => polishSite(lang, { t: text }).t;

/** Negritas y enlaces de un texto (todo lo demás se escapa). */
function inline(text: string, c: Ctx): string {
  return esc(polished(fillVars(text, c.cfg), c.lang))
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, target: string) => {
      const { href, external } = linkHref(target.replace(/&amp;/g, '&'), c);
      return `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
}

type Part = { type: 'p' | 'ul' | 'ol'; items: string[] };

/** Bloques → párrafos y listas (los bloques de lista seguidos forman una sola lista). */
export function blockParts(blocks: Block[], cfg: SiteCfg): Part[] {
  const parts: Part[] = [];
  for (const b of blocks) {
    const text = typeof b === 'string' ? b : on(b.when, cfg) ? b.text : null;
    if (text == null) continue;
    const lines = text.split('\n');
    const type = lines.every((l) => l.startsWith('- ')) ? 'ul' : lines.every((l) => /^\d+\. /.test(l)) ? 'ol' : 'p';
    if (type === 'p') {
      parts.push({ type, items: [text] });
      continue;
    }
    const items = lines.map((l) => l.replace(/^(- |\d+\. )/, ''));
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.items.push(...items);
    else parts.push({ type, items });
  }
  return parts;
}

function bodyHtml(blocks: Block[], c: Ctx): string {
  return blockParts(blocks, c.cfg)
    .map((p) => (p.type === 'p' ? `<p>${inline(p.items[0], c)}</p>` : `<${p.type}>${p.items.map((i) => `<li>${inline(i, c)}</li>`).join('')}</${p.type}>`))
    .join('\n          ');
}

/** Fecha larga en el idioma de la página ("28 de noviembre de 2026"). */
function longDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

/**
 * Una página de texto, a partir del index.html construido (misma cabecera, hoja de estilos y pie
 * que la portada), sin la aplicación: es HTML puro.
 */
export function pageHtml(builtIndex: string, lang: Lang, id: PageId, cfg: SiteCfg): string {
  const doc = PAGES[lang][id];
  const slug = PAGE_SLUG[id];
  const dir = `${lang}/${slug}/`;
  const c: Ctx = { lang, cfg, rel: '../../' };
  const d = polishSite(lang, DICTS[lang]);
  const plain = (t: string) => polished(plainText(t, cfg), lang);
  const title = `${plain(doc.title)} · ${BRAND.text}`;
  const desc = plain(doc.description);
  let out = localizeHtml(builtIndex, lang, cfg.siteUrl, dir, cfg, slug);
  const meta = (attr: 'name' | 'property', key: string, value: string) => {
    out = out.replace(new RegExp(`(<meta ${attr}="${key.replace(/[.:]/g, '\\$&')}" content=")[^"]*(")`), (_m, a: string, b: string) => a + esc(value) + b);
  };
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  meta('name', 'description', desc);
  meta('property', 'og:title', title);
  meta('property', 'og:description', desc);
  meta('property', 'og:image:alt', title);
  meta('name', 'twitter:title', title);
  meta('name', 'twitter:description', desc);
  // La misma página en cada idioma (sin idioma claro: inglés).
  out = out.replace(/(<link rel="alternate" hreflang="([^"]+)" href=")[^"]*(")/g, (_m, a: string, hl: string, b: string) => {
    const l = hl === 'x-default' ? 'en' : hl === 'zh-Hans' ? 'zh' : hl;
    return `${a}${cfg.siteUrl}${l}/${slug}/${b}`;
  });
  // Sin la aplicación: fuera su script, la redirección de idioma y los datos de "aplicación web".
  out = out
    .replace(/\s*<script type="module"[^>]*><\/script>/g, '')
    .replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
    .replace(/\s*<!--lang-redirect-->/, '');
  const home = '../';
  const cta = `<a class="btn btn--primary" href="${home}#crear"><span>${esc(d['hero.cta'])}</span> <span aria-hidden="true">→</span></a>`;
  // Saltar al contenido, logotipo a la portada y, en la barra, solo el botón de crear.
  out = out.replace(/<a class="skip"[^>]*>[\s\S]*?<\/a>/, `<a class="skip" href="#contenido">${esc(plain(doc.title))}</a>`);
  out = out.replace(/(<a class="logo" href=")[^"]*(")/, `$1${home}$2`);
  // En la barra: el botón de crear en lugar de los enlaces a las secciones de la portada; el menú de
  // idiomas se queda (es un <details> con enlaces: funciona sin JavaScript).
  out = out.replace(/(<nav class="topbar__nav">)\s*<a href="#como"[^>]*>[\s\S]*?<\/a>\s*<a href="#faq"[^>]*>[\s\S]*?<\/a>/, `$1\n          ${cta.replace('btn btn--primary', 'btn btn--primary btn--small')}`);
  const sections = doc.sections
    .filter((s) => on(s.when, cfg))
    .map((s) => `<section${s.id ? ` id="${s.id}"` : ''}>\n          <h2>${inline(s.h, c)}</h2>\n          ${bodyHtml(s.body, c)}\n        </section>`)
    .join('\n        ');
  const updated = id === 'legal' || id === 'privacy' ? `\n        <p class="doc__updated">${esc(polished(PAGES[lang].ui.updated.replace('{date}', longDate(cfg.updated, lang)), lang))}</p>` : '';
  const ad = id === 'legal' || id === 'privacy' ? '' : adUnit(cfg, 'page', true);
  const main = `<main id="contenido" class="doc">
      <article class="wrap doc__inner">
        <p class="kicker">${esc(plain(doc.kicker))}</p>
        <h1 class="doc__title">${esc(plain(doc.title))}</h1>
        <p class="doc__lead">${inline(doc.lead, c)}</p>
        ${sections}${updated}
        <p class="doc__cta">${cta}</p>
      </article>${ad ? `\n      ${ad}` : ''}
    </main>`;
  out = out.replace(/<main>[\s\S]*<\/main>/, () => main);
  return out;
}

// ------------------------------------------------------------------ sitemap, robots, 404

export function sitemap(siteUrl: string): string {
  const alternates = (path: string, xDefault: string) =>
    LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${hreflang(l)}" href="${siteUrl}${l}/${path}"/>`).join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefault}"/>`;
  const entry = (loc: string, alt: string) => `  <url>\n    <loc>${loc}</loc>\n${alt}\n  </url>`;
  const homeAlt = alternates('', siteUrl);
  const urls = [entry(siteUrl, homeAlt), ...LANGS.map((l) => entry(`${siteUrl}${l}/`, homeAlt))];
  for (const id of PAGE_IDS) {
    const path = `${PAGE_SLUG[id]}/`;
    const alt = alternates(path, `${siteUrl}en/${path}`);
    for (const l of LANGS) urls.push(entry(`${siteUrl}${l}/${path}`, alt));
  }
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    urls.join('\n') +
    '\n</urlset>\n'
  );
}

export const robots = (siteUrl: string) => `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`;

/** Página 404 (la sirve el alojamiento para cualquier ruta que no exista). Sin dependencias. */
export function notFound(siteUrl: string): string {
  const rows = (['es', 'en', 'ca', 'fr', 'de', 'it', 'pt'] as const)
    .map((l) => `<a href="${siteUrl}${l}/" lang="${l}">${esc(DICTS[l]['hero.cta'])}</a>`)
    .join('');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>404 · ${BRAND.text}</title>
<link rel="icon" type="image/svg+xml" href="${siteUrl}favicon.svg" />
<style>
  :root { color-scheme: light; }
  body { margin: 0; min-height: 100svh; display: grid; place-items: center; background: #f3eee6; color: #121212;
    font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; text-align: center; padding: 24px; }
  .num { font: 900 clamp(96px, 26vw, 200px)/0.9 Impact, 'Arial Narrow', system-ui, sans-serif; color: #fc4c02; letter-spacing: -0.02em; }
  p { margin: 18px 0 28px; font-weight: 600; }
  nav { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 560px; }
  a { display: inline-block; padding: 12px 20px; border-radius: 999px; background: #121212; color: #f3eee6; text-decoration: none; font-weight: 800; }
  a:first-child { background: #fc4c02; color: #fff; }
</style>
</head>
<body>
<main>
  <div class="num">404</div>
  <p>Esta página no existe · This page doesn’t exist</p>
  <nav>${rows}</nav>
</main>
</body>
</html>
`;
}

// ------------------------------------------------------------------ cabeceras, ads.txt, licencias

/** Huella de un script en línea para la política de seguridad (CSP). */
export const scriptHash = (code: string) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`;

/**
 * Cabeceras de seguridad y de caché (fichero `_headers` de Cloudflare Pages). Sin publicidad, la web
 * solo puede cargar y enviar cosas a sí misma (y la medición de visitas de Cloudflare); `inline` son
 * los scripts en línea permitidos (la redirección de idioma de la raíz). Con publicidad, Google
 * necesita cargar scripts y marcos de muchos dominios: se mantiene el resto de protecciones.
 */
export function headersFile(cfg: SiteCfg, inline: string[] = []): string {
  const csp = adsOn(cfg)
    ? ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'", 'upgrade-insecure-requests']
    : [
        "default-src 'self'",
        // 'wasm-unsafe-eval': el lector de .zip descomprime con WebAssembly en los navegadores que no
        // traen descompresión propia (no permite ejecutar texto como código).
        `script-src 'self' 'wasm-unsafe-eval' https://static.cloudflareinsights.com ${inline.map(scriptHash).join(' ')}`.trim(),
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data:",
        "media-src 'self' blob:",
        "font-src 'self'",
        "connect-src 'self' blob: data: https://cloudflareinsights.com",
        "worker-src 'self' blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ];
  return `/*
  Content-Security-Policy: ${csp.join('; ')}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Cross-Origin-Opener-Policy: same-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/data/*
  Cache-Control: public, max-age=604800
`;
}

/** ads.txt: declara que Google vende la publicidad de este dominio (lo exige AdSense). */
export const adsTxt = (cfg: SiteCfg) => (adsOn(cfg) ? `google.com, ${cfg.ads.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n` : '');

/** security.txt (RFC 9116): a quién avisar de un fallo de seguridad. Caduca al año del build. */
export function securityTxt(cfg: SiteCfg, now = new Date()): string {
  const expires = new Date(now.getTime() + 364 * 86400000).toISOString().replace(/\.\d+Z$/, 'Z');
  return `Contact: mailto:${cfg.owner.email}\nExpires: ${expires}\nPreferred-Languages: es, en\nCanonical: ${cfg.siteUrl}.well-known/security.txt\n`;
}

/** Software y datos de terceros que van en la web, con su licencia completa. */
const THIRD_PARTY: [pkg: string, use: string][] = [
  ['@fontsource/anton', 'Tipografía Anton (titulares)'],
  ['@fontsource/archivo', 'Tipografía Archivo (texto)'],
  ['@fontsource/oswald', 'Tipografía Oswald (titulares en cirílico)'],
  ['@fontsource/noto-sans-sc', 'Tipografía Noto Sans SC (titulares en chino)'],
  ['@fontsource/noto-sans-jp', 'Tipografía Noto Sans JP (titulares en japonés)'],
  ['@fontsource/noto-sans-kr', 'Tipografía Noto Sans KR (titulares en coreano)'],
  ['@zip.js/zip.js', 'Lectura y creación de archivos .zip'],
  ['fflate', 'Descompresión de ficheros .gz'],
  ['mediabunny', 'Creación de vídeo MP4 en el navegador (se usa sin modificar; código fuente: https://github.com/Vanilagy/mediabunny)'],
  ['d3-geo', 'Proyecciones de mapas'],
  ['d3-array', 'Utilidades de d3-geo'],
  ['internmap', 'Utilidades de d3-array'],
  ['topojson-client', 'Lectura de mapas TopoJSON'],
  ['tz-lookup', 'Zona horaria a partir de coordenadas'],
  ['world-atlas', 'Fronteras de países, a partir de Natural Earth'],
];

export function licensesText(root: string): string {
  const out: string[] = [
    `${BRAND.text} (${BRAND.domain}) — software y datos de terceros`,
    '',
    'Datos:',
    '- Natural Earth (naturalearthdata.com): fronteras de países. Dominio público.',
    '- GeoNames (geonames.org), cities15000: ciudades. Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/).',
    '',
    'Strava es una marca registrada de Strava, Inc. Esta web es independiente: no está afiliada, patrocinada ni respaldada por Strava, Inc.',
    '',
  ];
  for (const [pkg, use] of THIRD_PARTY) {
    const dir = join(root, 'node_modules', pkg);
    const meta = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { version: string; license?: string };
    const file = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license'].map((f) => join(dir, f)).find((f) => existsSync(f));
    if (!file) throw new Error(`Falta el fichero de licencia de ${pkg}`);
    out.push('='.repeat(78), `${pkg} ${meta.version} — ${use}`, `Licencia: ${meta.license ?? 'ver texto'}`, '='.repeat(78), '', readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trim(), '');
  }
  return out.join('\n');
}
