/**
 * Fechas de activities.csv en todos los idiomas: Strava las escribe con el formato del idioma de
 * la cuenta (estilo ICU, como Intl.DateTimeFormat). Se generan miles de fechas en ~50 idiomas y
 * varios estilos y se comprueba que el lector las entiende exactamente (año, mes, día, hora).
 *
 *   npx tsx scripts/sim/dates-fuzz.ts
 */
import { inferNumericOrder, parseDateParts } from '../../src/parse/dates';

const LOCALES = [
  'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-IE', 'en-NZ', 'en-ZA', 'es-ES', 'es-MX', 'es-419', 'es-AR', 'es-CO', 'es-US',
  'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'de-DE', 'de-AT', 'de-CH', 'it-IT', 'it-CH', 'pt-BR', 'pt-PT', 'nl-NL', 'nl-BE',
  'ja-JP', 'zh-CN', 'zh-TW', 'zh-HK', 'ko-KR', 'ru-RU', 'uk-UA', 'pl-PL', 'sv-SE', 'da-DK', 'nb-NO', 'fi-FI', 'cs-CZ',
  'sk-SK', 'tr-TR', 'id-ID', 'hu-HU', 'el-GR', 'ca-ES', 'eu-ES', 'gl-ES', 'ro-RO', 'hr-HR', 'sl-SI', 'vi-VN', 'he-IL',
  'ms-MY', 'fil-PH', 'lt-LT', 'lv-LV', 'et-EE', 'bg-BG', 'sr-Latn-RS', 'is-IS', 'th-TH', 'th-TH-u-ca-gregory',
];

const STYLES: Record<string, Intl.DateTimeFormatOptions> = {
  medium: { dateStyle: 'medium', timeStyle: 'medium' },
  short: { dateStyle: 'short', timeStyle: 'medium' },
  long: { dateStyle: 'long', timeStyle: 'medium' },
  parts: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' },
};

let seed = 12345;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const fails: Record<string, { n: number; total: number; ex: string[] }> = {};
let total = 0, bad = 0;
for (const loc of LOCALES) {
  for (const [style, opts] of Object.entries(STYLES)) {
    let f: Intl.DateTimeFormat;
    try {
      f = new Intl.DateTimeFormat(loc, { ...opts, timeZone: 'UTC' });
    } catch {
      continue;
    }
    const dates = Array.from({ length: 250 }, () => Math.floor(Date.UTC(2015, 0, 1) + rnd() * (Date.UTC(2027, 11, 31) - Date.UTC(2015, 0, 1))) - (Math.floor(rnd() * 1000)));
    const texts = dates.map((d) => f.format(new Date(Math.floor(d / 1000) * 1000)));
    const order = inferNumericOrder(texts, loc.startsWith('en'));
    const key = `${loc} ${style}`;
    for (let i = 0; i < dates.length; i++) {
      total++;
      const truth = new Date(Math.floor(dates[i] / 1000) * 1000);
      const p = parseDateParts(texts[i], order);
      const ok = p && p.y === truth.getUTCFullYear() && p.mo === truth.getUTCMonth() + 1 && p.d === truth.getUTCDate() && p.h === truth.getUTCHours() && p.mi === truth.getUTCMinutes() && p.s === truth.getUTCSeconds();
      if (!ok) {
        bad++;
        const e = (fails[key] ??= { n: 0, total: 0, ex: [] });
        e.n++;
        if (e.ex.length < 2) e.ex.push(`"${texts[i]}" → ${p ? `${p.y}-${p.mo}-${p.d} ${p.h}:${p.mi}:${p.s}` : 'null'} (real ${truth.toISOString().slice(0, 19)})`);
      }
      if (fails[key]) fails[key].total = dates.length;
    }
  }
}
console.log(`${total} fechas, ${bad} mal (${((bad / total) * 100).toFixed(2)} %)`);
for (const [k, v] of Object.entries(fails).sort((a, b) => b[1].n - a[1].n)) console.log(`  ${k.padEnd(22)} ${v.n}/${v.total}  ${v.ex.join('  |  ')}`);
