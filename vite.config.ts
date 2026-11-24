/// <reference types="vitest/config" />
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { LANGS } from './src/i18n/langs.ts';
import { localizeHtml, notFound, robots, sitemap } from './scripts/site-pages.ts';

/**
 * URL pública de la web (con barra final): enlaces al compartir, vista previa en WhatsApp/redes,
 * sitemap. En GitHub Actions la fija el workflow (variable SITE_URL del repositorio o la de Pages).
 */
const SITE_URL = (process.env.VITE_SITE_URL || 'https://runrecap.app/').replace(/\/?$/, '/');

/**
 * Metadatos con la URL pública y, al compilar, una página estática por idioma (/en/, /ca/…) con
 * los textos y la vista previa ya traducidos, más sitemap.xml, robots.txt y 404.html.
 */
function sitePages(): Plugin {
  return {
    name: 'site-pages',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', SITE_URL) },
    writeBundle: {
      sequential: true,
      order: 'post',
      handler(opts, bundle) {
        const dir = opts.dir ?? resolve(import.meta.dirname, 'dist');
        const file = join(dir, 'index.html');
        if (!existsSync(file)) return;
        const html = readFileSync(file, 'utf8');
        // Tipografía de titulares de cada escritura (src/render/fonts.ts), enlazada ya en el HTML
        // de su idioma: los titulares salen bien desde el primer pintado.
        const scriptCss = (name: string) => Object.keys(bundle).find((f) => new RegExp(`^assets/${name}-[\\w-]+\\.css$`).test(f));
        const FONT_CSS: Partial<Record<(typeof LANGS)[number], string | undefined>> = { ru: scriptCss('cyr'), zh: scriptCss('sc'), ja: scriptCss('ja'), ko: scriptCss('ko') };
        for (const lang of LANGS) {
          mkdirSync(join(dir, lang), { recursive: true });
          let page = localizeHtml(html, lang, SITE_URL, `${lang}/`).replace(/\s*<!--lang-redirect-->/, '');
          const css = FONT_CSS[lang];
          if (css) page = page.replace('</head>', `  <link rel="stylesheet" href="../${css}" />\n  </head>`);
          writeFileSync(join(dir, lang, 'index.html'), page);
        }
        // La raíz: en español para quien no ejecuta JavaScript (buscadores, vistas previas); el
        // resto pasa a la carpeta de su idioma antes de pintar nada.
        const root = localizeHtml(html, 'es', SITE_URL, '').replace('<!--lang-redirect-->', LANG_REDIRECT);
        writeFileSync(file, root);
        writeFileSync(join(dir, 'sitemap.xml'), sitemap(SITE_URL));
        writeFileSync(join(dir, 'robots.txt'), robots(SITE_URL));
        writeFileSync(join(dir, '404.html'), notFound(SITE_URL));
      },
    },
  };
}

/** Redirección de la raíz al idioma de la persona: ?lang=, el elegido antes o el del navegador. */
const LANG_REDIRECT = `<script>(function(){try{var L=${JSON.stringify(LANGS)};function p(t){if(!t)return null;t=String(t).toLowerCase().split(/[-_]/)[0];if(t==='va'||t==='val')t='ca';if(t==='gl'||t==='eu')t='es';return L.indexOf(t)>=0?t:null}var l=p(new URLSearchParams(location.search).get('lang'));if(!l){try{l=p(localStorage.getItem('runrecap.lang'))}catch(e){}}if(!l){var n=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];for(var i=0;i<n.length&&!l;i++)l=p(n[i])}location.replace((l||'en')+'/'+location.search+location.hash)}catch(e){}})();</script>`;

/** Solo en desarrollo: sirve el export de prueba (npm run sample) en /__sample.zip. */
function sampleExport(): Plugin {
  return {
    name: 'sample-export',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__sample.zip', (req, res) => {
        // ?name=otro -> samples/otro.zip (solo letras, números, guiones)
        const name = (new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'export_12345678').replace(/[^\w-]/g, '');
        const file = resolve(import.meta.dirname, 'samples', `${name}.zip`);
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.end('Ejecuta primero: npm run sample');
          return;
        }
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Length', String(statSync(file).size));
        createReadStream(file).pipe(res);
      });
      // Guarda imágenes generadas en el navegador (og-xx.jpg, apple-touch-icon.png) en /public.
      server.middlewares.use('/__save', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? '';
        if (req.method !== 'POST' || !/^((apple-touch-icon|icon-512)\.png|og-[a-z]{2}\.jpg)$/.test(name)) {
          res.statusCode = 400;
          res.end('no');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          writeFileSync(resolve(import.meta.dirname, 'public', name), Buffer.concat(chunks));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier hosting estático (raíz o subcarpeta).
  base: './',
  plugins: [sampleExport(), sitePages()],
  define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(SITE_URL) },
  worker: { format: 'es' },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
