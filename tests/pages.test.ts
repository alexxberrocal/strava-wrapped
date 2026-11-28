import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGS } from '../src/i18n/langs';
import { PAGE_IDS, PAGE_SLUG, type Block } from '../src/i18n/pages/types';
import { PAGES, adsTxt, applySiteConfig, headersFile, localizeHtml, pageHtml, scriptHash, securityTxt, siteCfg, sitemap, type SiteCfg } from '../scripts/site-pages';

const SITE = 'https://ejemplo.test/';
const noAds: SiteCfg = {
  ...siteCfg(SITE),
  ads: { client: '', slots: { home: '', results: '', page: '' } },
  owner: { name: 'Ana Prueba', nif: '', address: '', email: 'hola@ejemplo.test' },
};
const withAds: SiteCfg = {
  ...noAds,
  ads: { client: 'ca-pub-1234567890123456', slots: { home: '1111111111', results: '2222222222', page: '3333333333' } },
  owner: { ...noAds.owner, nif: '00000000T', address: 'Calle Falsa 123, 08001 Barcelona' },
};
const indexHtml = readFileSync(resolve(import.meta.dirname, '..', 'index.html'), 'utf8');

const textOf = (b: Block) => (typeof b === 'string' ? b : b.text);
const whenOf = (b: Block) => (typeof b === 'string' ? '' : b.when);
const kindOf = (t: string) => {
  const lines = t.split('\n');
  if (lines.every((l) => l.startsWith('- '))) return `ul${lines.length}`;
  if (lines.every((l) => /^\d+\. /.test(l))) return `ol${lines.length}`;
  return 'p';
};
const linksOf = (t: string) => [...t.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]).sort();
const varsOf = (t: string) => [...new Set([...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

/** La forma de una página: secciones, condiciones, tipo de cada bloque, enlaces y variables. */
function shape(lang: (typeof LANGS)[number], id: (typeof PAGE_IDS)[number]) {
  return PAGES[lang][id].sections.map((s) => ({
    id: s.id ?? '',
    when: s.when ?? '',
    body: s.body.map((b) => ({ when: whenOf(b), kind: kindOf(textOf(b)), links: linksOf(textOf(b)), vars: varsOf(textOf(b)) })),
  }));
}

describe('páginas de texto en los 12 idiomas', () => {
  for (const lang of LANGS) {
    it(lang, () => {
      const pages = PAGES[lang];
      expect(pages.ui.updated).toContain('{date}');
      for (const id of PAGE_IDS) {
        const doc = pages[id];
        for (const t of [doc.title, doc.description, doc.kicker, doc.lead]) expect(t.trim(), `${lang} ${id}`).not.toBe('');
        // Misma estructura que el español: secciones, listas, enlaces y variables.
        expect(shape(lang, id), `${lang} ${id}: estructura`).toEqual(shape('es', id));
        expect(varsOf(doc.title), `${lang} ${id}: variables del título`).toEqual(varsOf(PAGES.es[id].title));
        // Traducida de verdad (no una copia de otro idioma).
        if (lang !== 'es') expect(doc.lead, `${lang} ${id}: sin traducir`).not.toBe(PAGES.es[id].lead);
        if (lang !== 'en') expect(doc.lead, `${lang} ${id}: sin traducir`).not.toBe(PAGES.en[id].lead);
        for (const cfg of [noAds, withAds]) {
          const html = pageHtml(applySiteConfig(indexHtml, cfg), lang, id, cfg);
          const main = /<main[\s\S]*<\/main>/.exec(html)![0];
          // Sin marcas ni variables sin resolver, y sin la aplicación.
          expect(main, `${lang} ${id}`).not.toMatch(/\*\*|\]\(|\{\w+\}/);
          expect(html).not.toContain('type="module"');
          expect(html).not.toContain('<!--');
          expect(html).toContain(`<link rel="canonical" href="${SITE}${lang}/${PAGE_SLUG[id]}/" />`);
          expect(html).toContain(`hreflang="x-default" href="${SITE}en/${PAGE_SLUG[id]}/"`);
          expect(main).toContain('<h1 class="doc__title">');
          expect(main).toContain('href="../#crear"');
          // Los enlaces del pie llevan a las páginas de este idioma.
          expect(html).toContain(`href="../../${lang}/${PAGE_SLUG.privacy}/"`);
          // Y la lista de idiomas, a la misma página en los demás.
          for (const other of LANGS) if (other !== lang) expect(html).toContain(`href="../../${other}/${PAGE_SLUG[id]}/"`);
        }
      }
    });
  }

  it('el aviso legal enseña el NIF y el domicilio solo si están rellenados', () => {
    const empty = pageHtml(applySiteConfig(indexHtml, noAds), 'es', 'legal', noAds);
    expect(empty).toContain('Ana Prueba');
    expect(empty).not.toContain('NIF');
    expect(empty).not.toContain('Domicilio');
    const full = pageHtml(applySiteConfig(indexHtml, withAds), 'es', 'legal', withAds);
    expect(full).toContain('<b>NIF:</b> 00000000T');
    expect(full).toContain('<b>Domicilio:</b> Calle Falsa 123, 08001 Barcelona');
    // Una sola lista con todos los datos del titular.
    expect(/<ul>(?:<li>.*?<\/li>){5}<\/ul>/.test(full)).toBe(true);
  });

  it('francés con sus espacios finos y enlaces externos seguros', () => {
    const fr = pageHtml(applySiteConfig(indexHtml, noAds), 'fr', 'guide', noAds);
    expect(fr).toContain('Android :');
    expect(fr).toContain('href="https://www.strava.com/athlete/download_my_account" target="_blank" rel="noopener noreferrer"');
    expect(fr).toContain('href="mailto:hola@ejemplo.test"');
  });
});

describe('publicidad: apagada por defecto y preparada', () => {
  it('sin publicidad no hay nada de Google ni marcas sin resolver', () => {
    const home = localizeHtml(applySiteConfig(indexHtml, noAds), 'es', SITE, 'es/', noAds);
    expect(home).not.toMatch(/adsbygoogle|googlesyndication|data-consent|<!--ads/);
    expect(home).toContain('No usamos cookies.');
    const privacy = pageHtml(applySiteConfig(indexHtml, noAds), 'es', 'privacy', noAds);
    expect(privacy).toContain('no muestra publicidad ni usa cookies de terceros');
    expect(privacy).not.toContain('AdSense');
    expect(adsTxt(noAds)).toBe('');
  });

  it('con publicidad: script, huecos, consentimiento, textos legales y ads.txt', () => {
    const home = localizeHtml(applySiteConfig(indexHtml, withAds), 'de', SITE, 'de/', withAds);
    expect(home).toContain('adsbygoogle.js?client=ca-pub-1234567890123456');
    expect(home).toContain('data-ad-slot="1111111111"');
    expect(home).toContain('data-ad-slot="2222222222"');
    expect(home).toContain('data-consent');
    expect(home).toContain('Datenschutz-Einstellungen');
    expect(home).toContain('>Anzeige<');
    // El hueco de resultados va dentro de la sección de resultados (oculta hasta ver la historia).
    expect(/<section class="results"[\s\S]*data-ad-slot="2222222222"[\s\S]*?<\/section>/.test(home)).toBe(true);
    const privacy = pageHtml(applySiteConfig(indexHtml, withAds), 'es', 'privacy', withAds);
    expect(privacy).toContain('Google AdSense');
    expect(privacy).not.toContain('no muestra publicidad');
    // Las páginas legales no llevan anuncios; las de contenido, uno al final.
    expect(privacy).not.toContain('data-ad-slot');
    expect(pageHtml(applySiteConfig(indexHtml, withAds), 'es', 'guide', withAds)).toContain('data-ad-slot="3333333333"');
    expect(adsTxt(withAds)).toBe('google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n');
  });

  it('cabeceras de seguridad', () => {
    const code = 'alert(1)';
    const strict = headersFile(noAds, [code]);
    expect(strict).toContain("default-src 'self'");
    expect(strict).toContain(scriptHash(code));
    expect(strict).toContain("frame-ancestors 'none'");
    expect(strict).toContain('X-Content-Type-Options: nosniff');
    expect(strict).toContain('Strict-Transport-Security');
    const ads = headersFile(withAds, [code]);
    expect(ads).not.toContain('default-src');
    expect(ads).toContain("frame-ancestors 'none'");
    expect(securityTxt(noAds, new Date('2026-11-28T00:00:00Z'))).toContain('Expires: 2027-11-27T00:00:00Z');
  });

  it('sitemap con las páginas de texto', () => {
    const xml = sitemap(SITE);
    for (const l of LANGS) for (const id of PAGE_IDS) expect(xml).toContain(`<loc>${SITE}${l}/${PAGE_SLUG[id]}/</loc>`);
    expect(xml.match(/<url>/g)!.length).toBe(1 + LANGS.length * (1 + PAGE_IDS.length));
  });
});
