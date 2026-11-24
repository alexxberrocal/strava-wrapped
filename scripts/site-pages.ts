// Páginas estáticas de cada idioma (/es/, /en/, /ca/…) a partir del index.html compilado: textos,
// título, descripción y vista previa (Open Graph) ya traducidos en el HTML. Así WhatsApp, Instagram,
// X o Google (que no ejecutan el JavaScript de la web) enseñan la tarjeta del enlace en el idioma
// de quien lo comparte. También genera sitemap.xml, robots.txt y 404.html con la URL pública.
import { LANGS, LOCALE, OG_LOCALE, type Lang } from '../src/i18n/langs.ts';
import { polishSite } from '../src/i18n/polish.ts';
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

const DICTS: Record<Lang, SiteMessages> = { es, en, ca, fr, de, it, pt, nl, ru, zh, ja, ko };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Imagen de vista previa de cada idioma (1200×630, generada con dev.html?og&lang=xx). */
export const ogImage = (lang: Lang) => `og-${lang}.jpg`;

/**
 * Traduce el HTML. `dir` = carpeta de la página respecto a la raíz ('' para la raíz, 'en/'…), para
 * corregir las rutas relativas y la URL canónica.
 */
export function localizeHtml(html: string, lang: Lang, siteUrl: string, dir: string): string {
  const d = polishSite(lang, DICTS[lang]);
  const t = (k: string) => d[k as SiteKey] ?? '';
  const pageUrl = siteUrl + dir;
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
  // El idioma marcado en el selector.
  out = out.replace(/<option value="([a-z]{2})"( selected)?>/g, (_m, v: string) => `<option value="${v}"${v === lang ? ' selected' : ''}>`);
  out = out.replace(/(<span class="lang__code"[^>]*>)[^<]*(<\/span>)/, `$1${lang.toUpperCase()}$2`);
  // Rutas relativas desde la subcarpeta del idioma.
  if (dir) out = out.replace(/\s(src|href)="\.\//g, ' $1="../');
  return out;
}

export function sitemap(siteUrl: string): string {
  // El chino de la web es simplificado: zh-Hans.
  const alt = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l === 'zh' ? 'zh-Hans' : l}" href="${siteUrl}${l}/"/>`).join('\n');
  const entry = (loc: string) => `  <url>\n    <loc>${loc}</loc>\n${alt}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}"/>\n  </url>`;
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    [siteUrl, ...LANGS.map((l) => `${siteUrl}${l}/`)].map(entry).join('\n') +
    '\n</urlset>\n'
  );
}

export const robots = (siteUrl: string) => `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`;

/** Página 404 (GitHub Pages la sirve para cualquier ruta que no exista). Sin dependencias. */
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
<title>404 · RUNRECAP</title>
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
