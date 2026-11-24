// Revisión visual automática de la web compilada, en los 12 idiomas, en móvil y en ordenador, con
// el navegador del sistema en modo invisible (Chrome o Edge; el mismo motor que verá la gente):
//   - nada se sale de la pantalla ni provoca scroll lateral,
//   - ningún texto es más ancho que su caja (palabras largas en alemán, ruso…),
//   - botones, píldoras y chips en una sola línea,
//   - la barra superior no se pisa,
//   - sin errores de JavaScript.
// Además recorre el flujo completo con el export de prueba en el móvil: subir → ajustes → historia →
// resultados → compartir, y la historia de ejemplo en el ordenador. Capturas en samples/web-check/.
// Uso: npm run check:web   (opciones: --only=es,ru  --zip=samples/otro.zip  --no-flow  --shots=all|issues)
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import { preview } from 'vite';
import { LANGS } from '../src/i18n/langs.ts';

const root = resolve(import.meta.dirname, '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
) as Record<string, string>;
const only = (args.only ? args.only.split(',') : [...LANGS]) as (typeof LANGS)[number][];
const zip = resolve(root, args.zip ?? 'samples/export_12345678.zip');
const shots = args.shots ?? 'all';
const outDir = join(root, 'samples/web-check');

const MOBILE = { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { width: 1280, height: 860, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

/** Revisión dentro de la página (texto plano: se evalúa tal cual en el navegador). */
const CHECK = String.raw`(() => {
  const issues = [];
  const vw = document.documentElement.clientWidth;
  const visible = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0;
  };
  const skip = (el) => el.closest('.gallery__strip, .skip, .hero__visual, [hidden], option, select, .story__bars, .toast');
  const label = (el) => {
    const cls = typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '';
    const text = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 34);
    return el.tagName.toLowerCase() + cls + ' «' + text + '»';
  };
  const out = (r) => r.right > vw + 0.5 || r.left < -0.5;
  // 1) Nada sobresale de la pantalla (solo se apunta el elemento más interno).
  for (const el of document.querySelectorAll('body *')) {
    if (skip(el) || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || !out(r)) continue;
    if ([...el.children].some((c) => visible(c) && out(c.getBoundingClientRect()))) continue;
    issues.push('se sale de la pantalla: ' + label(el) + ' [' + Math.round(r.left) + ', ' + Math.round(r.right) + '] de ' + vw);
  }
  if (document.documentElement.scrollWidth > vw + 1) issues.push('scroll lateral: ' + document.documentElement.scrollWidth + ' > ' + vw);
  // 2) Texto más ancho que su caja (salvo cajas que recortan o desplazan a propósito).
  for (const el of document.querySelectorAll('h1, h2, h3, p, a, button, summary, label, span, li, small, strong, em, b, div')) {
    if (skip(el) || !visible(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.overflowX !== 'visible') continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    if (el.scrollWidth > Math.ceil(r.width) + 1) issues.push('texto más ancho que su caja: ' + label(el) + ' ' + el.scrollWidth + ' > ' + Math.round(r.width));
  }
  // 3) Botones, selector de idioma y chips en una sola línea (la píldora "Compatible con Strava"
  //    puede ir en dos líneas equilibradas a propósito).
  for (const b of document.querySelectorAll('.btn, .lang, .chip, .linkish')) {
    if (skip(b) || !visible(b)) continue;
    const walker = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    const tops = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) if (r.width > 1) tops.push(r.top + r.height / 2);
    }
    const fs = parseFloat(getComputedStyle(b).fontSize) || 16;
    if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > fs * 0.8) issues.push('texto partido en varias líneas: ' + label(b));
  }
  // 4) Barra superior: nada se pisa.
  const bar = [...document.querySelectorAll('.topbar .logo, .topbar__nav > a, .topbar .lang')].filter(visible).map((e) => e.getBoundingClientRect());
  for (let i = 1; i < bar.length; i++) if (bar[i].left < bar[i - 1].right - 0.5) issues.push('barra superior: elementos solapados');
  return issues;
})()`;

type Report = Record<string, string[]>;

async function settle(page: Page, ms = 400) {
  await page.evaluate('document.fonts.ready.then(() => true)');
  await new Promise((r) => setTimeout(r, ms));
}

async function check(page: Page, report: Report, key: string, errors: string[], shotName: string) {
  await settle(page);
  const issues = ((await page.evaluate(CHECK)) as string[]).concat(errors.splice(0));
  report[key] = issues;
  if (shots === 'all' || issues.length) await page.screenshot({ path: join(outDir, `${shotName}.png`), fullPage: !key.includes('historia') && !key.includes('compartir') });
}

async function newPage(browser: Browser, view: typeof MOBILE, errors: string[]): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport(view);
  if (view.isMobile) await page.setUserAgent(ANDROID_UA);
  page.on('pageerror', (e) => errors.push(`error de JavaScript: ${(e as Error).message ?? e}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`consola: ${m.text().slice(0, 160)}`);
  });
  return page;
}

async function main() {
  const exe = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].find((p) => p && existsSync(p));
  if (!exe) throw new Error('No encuentro Chrome ni Edge: indica la ruta en CHROME_PATH');
  if (!existsSync(join(root, 'dist/index.html'))) throw new Error('Falta la web compilada: npm run build');
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const server = await preview({ root, logLevel: 'silent', preview: { port: 4399, strictPort: false, host: '127.0.0.1', open: false } });
  const base = server.resolvedUrls?.local[0] ?? 'http://127.0.0.1:4399/';
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-first-run', '--no-default-browser-check', '--lang=es-ES'] });
  const report: Report = {};
  const t0 = Date.now();
  try {
    for (const lang of only) {
      const errors: string[] = [];
      // Portada en ordenador y en móvil, con todas las preguntas abiertas.
      for (const [name, view] of [
        ['ordenador', DESKTOP],
        ['móvil', MOBILE],
      ] as const) {
        const page = await newPage(browser, view, errors);
        await page.goto(`${base}${lang}/`, { waitUntil: 'networkidle0' });
        await page.evaluate(`document.querySelectorAll('.faq details').forEach((d) => (d.open = true))`);
        await check(page, report, `${lang} · portada · ${name}`, errors, `${lang}-portada-${name === 'móvil' ? 'movil' : 'pc'}`);
        if (name === 'ordenador') {
          // Historia de ejemplo.
          await page.click('#demo-btn');
          await page.waitForSelector('.story', { visible: true, timeout: 20000 });
          await new Promise((r) => setTimeout(r, 1200));
          await check(page, report, `${lang} · historia de ejemplo · ${name}`, errors, `${lang}-demo-pc`);
        }
        await page.close();
      }
      if (args['no-flow'] || !existsSync(zip)) continue;
      // Recorrido completo en el móvil con el export de prueba.
      const page = await newPage(browser, MOBILE, errors);
      await page.goto(`${base}${lang}/`, { waitUntil: 'networkidle0' });
      const input = await page.$('#file-input');
      if (!input) throw new Error('No encuentro #file-input');
      await input.uploadFile(zip);
      await page.waitForFunction(`(() => { const b = document.querySelector('.panel__actions .btn--primary'); return !!b && !b.disabled; })()`, { timeout: 90000 });
      await page.evaluate(`document.getElementById('crear').scrollIntoView()`);
      await check(page, report, `${lang} · ajustes · móvil`, errors, `${lang}-ajustes-movil`);
      await page.click('.panel__actions .btn--primary');
      await page.waitForSelector('.story', { visible: true, timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500));
      await check(page, report, `${lang} · historia · móvil`, errors, `${lang}-historia-movil`);
      await page.click('.story__actions .btn--ghost');
      await page.waitForSelector('#results:not([hidden])', { timeout: 20000 });
      await check(page, report, `${lang} · resultados · móvil`, errors, `${lang}-resultados-movil`);
      await page.click('.results__card');
      await page.waitForSelector('.sheet', { visible: true, timeout: 20000 });
      await new Promise((r) => setTimeout(r, 1500));
      await check(page, report, `${lang} · compartir · móvil`, errors, `${lang}-compartir-movil`);
      await page.close();
      console.log(`${lang}: ${Object.entries(report).filter(([k, v]) => k.startsWith(lang + ' ') && v.length).length ? 'con avisos' : 'ok'}`);
    }
  } finally {
    await browser.close();
    await new Promise<void>((r) => server.httpServer.close(() => r()));
  }
  const bad = Object.entries(report).filter(([, v]) => v.length);
  console.log(`\n${Object.keys(report).length} pantallas revisadas en ${Math.round((Date.now() - t0) / 1000)} s · ${bad.length} con avisos · capturas en samples/web-check/`);
  for (const [k, v] of bad) {
    console.log(`\n${k}`);
    for (const i of [...new Set(v)]) console.log(`  - ${i}`);
  }
  process.exitCode = bad.length ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 2;
});
