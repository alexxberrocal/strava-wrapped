// Genera public/og-xx.jpg: la imagen que acompaña al enlace al compartirlo (WhatsApp, Instagram,
// X…), 1200×630, en los 12 idiomas, con el mismo código de dibujo que la web (src/render/social.ts)
// y las tarjetas de la demo. Comprueba que ningún texto pise a otro, a las tarjetas o al círculo, y
// que cada imagen pese menos de 300 KB (WhatsApp no enseña las más pesadas). Uso: npm run og
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, setupCanvasEnv } from './sim/env';

const ROOT = process.cwd();
setupCanvasEnv(ROOT);

const { LANGS } = await import('../src/i18n/langs');
const { Fmt, registerCardMessages } = await import('../src/i18n/format');
const { loadSiteStrings, tr } = await import('../src/i18n/site');
const { demoStats } = await import('../src/demo/demo');
const { buildDeck } = await import('../src/render/deck');
const { CardPainter } = await import('../src/render/card');
const { Countries } = await import('../src/geo/countries');
const { paintSocial, SOCIAL_W, SOCIAL_H } = await import('../src/render/social');
const { BRAND } = await import('../src/config');

const countries = new Countries(JSON.parse(readFileSync(join(ROOT, 'public/data/countries.json'), 'utf8')));
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
let failed = 0;

for (const lang of LANGS) {
  if (only && !only.includes(lang)) continue;
  if (lang !== 'es') registerCardMessages(lang, (await import(`../src/i18n/cards/${lang}.ts`)).default);
  await loadSiteStrings(lang);
  const stats = demoStats(lang);
  const env = { fmt: new Fmt(lang, 'metric'), stats, countries, photos: [], brand: BRAND.name, domain: BRAND.domain };
  const deck = buildDeck(env);
  const canvas = createCanvas(SOCIAL_W, SOCIAL_H);
  const issues = paintSocial(
    canvas.getContext('2d') as unknown as CanvasRenderingContext2D,
    new CardPainter(env),
    deck,
    { lang, kicker: tr('hero.kicker', {}, lang), title: tr('hero.title', {}, lang), compat: tr('hero.compat', {}, lang), domain: BRAND.domain },
    (w, h) => createCanvas(w, h) as unknown as HTMLCanvasElement,
  );
  const jpg = canvas.toBuffer('image/jpeg', 86);
  if (jpg.length > 300 * 1024) issues.push(`pesa ${Math.round(jpg.length / 1024)} KB (máx. 300)`);
  writeFileSync(join(ROOT, 'public', `og-${lang}.jpg`), jpg);
  console.log(`og-${lang}.jpg  ${String(Math.round(jpg.length / 1024)).padStart(3)} KB  ${issues.length ? '✗ ' + issues.join(' · ') : 'ok'}`);
  if (issues.length) failed++;
}
process.exitCode = failed ? 1 : 0;
