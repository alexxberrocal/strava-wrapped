import { describe, expect, it } from 'vitest';
import { inferNumericOrder, parseDateParts } from '../src/parse/dates';
import { plausibleEffort } from '../src/parse/track';
import { implausibleRun, previousYearTotals } from '../src/app/enrich';
import { sunPhase } from '../src/stats/sun';
import { computeStats, pickHabit } from '../src/stats/compute';
import { localTimeOf } from '../src/stats/time';
import { projectRoutes } from '../src/render/kit';
import { buildDeck, cardSkipReason } from '../src/render/deck';
import { Fmt } from '../src/i18n/format';
import { habitTitle, marathonsLabel, yearDelta } from '../src/render/cards/common';
import type { CsvActivity } from '../src/parse/activitiesCsv';
import type { Activity, WrappedStats } from '../src/stats/types';
import type { DeckEnv } from '../src/render/card';

// Idiomas de Strava (support.strava.com: "Supported Languages on Strava") y, por si acaso, coreano.
const STRAVA_LOCALES = ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'it-IT', 'pt-PT', 'pt-BR', 'es-ES', 'es-419', 'zh-CN', 'zh-TW', 'ru-RU', 'nl-NL', 'ja-JP', 'id-ID', 'cs-CZ', 'th-TH', 'fil-PH', 'da-DK', 'ms-MY', 'nb-NO', 'pl-PL', 'sv-SE', 'tr-TR', 'vi-VN', 'ko-KR'];

describe('fechas en todos los idiomas de Strava', () => {
  for (const loc of STRAVA_LOCALES) {
    it(loc, () => {
      const f = new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' });
      const dates = Array.from({ length: 80 }, (_, i) => Math.floor((Date.UTC(2016, 0, 1) + i * 4_123_457_000 + (i % 24) * 3_600_000) / 1000) * 1000);
      const texts = dates.map((d) => f.format(new Date(d)));
      const order = inferNumericOrder(texts, loc.startsWith('en'));
      dates.forEach((d, i) => {
        const p = parseDateParts(texts[i], order);
        expect(p, texts[i]).not.toBeNull();
        expect(Date.UTC(p!.y, p!.mo - 1, p!.d, p!.h, p!.mi, p!.s), texts[i]).toBe(d);
      });
    });
  }
  it('formatos especiales', () => {
    expect(parseDateParts('28.5.2023 klo 18.02.06')).toEqual({ y: 2023, mo: 5, d: 28, h: 18, mi: 2, s: 6 });
    expect(parseDateParts('29 mai 2015, 02 h 24 min 35 s')).toEqual({ y: 2015, mo: 5, d: 29, h: 2, mi: 24, s: 35 });
    expect(parseDateParts('2024/12/22 凌晨12:40:57')).toEqual({ y: 2024, mo: 12, d: 22, h: 0, mi: 40, s: 57 });
    expect(parseDateParts('2025/2/23 晚上8:31:53')).toEqual({ y: 2025, mo: 2, d: 23, h: 20, mi: 31, s: 53 });
    expect(parseDateParts('23 Ogo 2026, 11:36:28 PTG')).toEqual({ y: 2026, mo: 8, d: 23, h: 23, mi: 36, s: 28 });
    expect(parseDateParts('21.12.16, 00:24:53')).toEqual({ y: 2016, mo: 12, d: 21, h: 0, mi: 24, s: 53 });
    expect(parseDateParts('9 май 2024 г. в 3:28:37')).toEqual({ y: 2024, mo: 5, d: 9, h: 3, mi: 28, s: 37 });
  });
});

describe('el sol de verdad', () => {
  it('hora dorada, noche y amanecer según lugar y fecha', () => {
    expect(sunPhase(Date.UTC(2026, 5, 21, 19, 30), 40.42, -3.7)).toBe('golden'); // Madrid, 21:30 en junio
    expect(sunPhase(Date.UTC(2026, 11, 21, 18, 0), 40.42, -3.7)).toBe('dark'); // Madrid, 19:00 en diciembre
    expect(sunPhase(Date.UTC(2026, 11, 21, 7, 30), 40.42, -3.7)).toBe('sunrise');
    expect(sunPhase(Date.UTC(2026, 5, 21, 12, 15), 40.42, -3.7)).toBe('day');
  });
  it('perfil horario: dorada, sin horario o franja', () => {
    const tod = { dawn: 2, morning: 3, midday: 1, afternoon: 6, evening: 5, night: 3 };
    const sun = { outdoor: 20, golden: 9, sunrise: 0, dark: 5, evening: 0, eveningGolden: 0, eveningDark: 0 };
    expect(pickHabit(tod, 'afternoon', 20, sun).key).toBe('golden');
    expect(pickHabit(tod, 'afternoon', 20, null).key).toBe('anytime');
    // Tardes de 19 a 22 h, unas con el sol cayendo y otras ya de noche: "entre dos luces".
    const eve = { dawn: 1, morning: 2, midday: 1, afternoon: 2, evening: 12, night: 2 };
    expect(pickHabit(eve, 'evening', 20, { outdoor: 20, golden: 5, sunrise: 0, dark: 8, evening: 12, eveningGolden: 5, eveningDark: 6 }).key).toBe('twilight');
    expect(pickHabit(eve, 'evening', 20, { outdoor: 20, golden: 1, sunrise: 0, dark: 12, evening: 12, eveningGolden: 1, eveningDark: 11 }).key).toBe('evening');
    expect(pickHabit({ ...tod, dawn: 14 }, 'dawn', 30, null)).toEqual({ key: 'dawn', share: 14 / 30 });
  });
});

describe('datos imposibles', () => {
  it('marcas más rápidas que el récord del mundo', () => {
    expect(plausibleEffort(1000, 125)).toBe(false);
    expect(plausibleEffort(1000, 150)).toBe(true);
    expect(plausibleEffort(42195, 7000)).toBe(false);
    expect(plausibleEffort(5000, 5 * 3600)).toBe(false); // 5 km en 5 h: el reloj siguió en marcha
  });
  it('bicis o coches apuntados como carrera', () => {
    expect(implausibleRun({ distance: 60000, moving: 7200, elapsed: 7500 })).toBe(true);
    expect(implausibleRun({ distance: 10000, moving: 1500, elapsed: 1500 })).toBe(true); // 2:30/km en 10 km
    expect(implausibleRun({ distance: 10000, moving: 2400, elapsed: 2400 })).toBe(false);
    expect(implausibleRun({ distance: 0, moving: 0, elapsed: 0 })).toBe(false);
  });
});

function row(id: string, startUtc: number, distance: number): CsvActivity {
  return {
    id, startUtc, name: 'Run', typeRaw: 'Run', category: 'run', elapsed: distance * 0.3, moving: distance * 0.3, distance, elevGain: NaN, elevHigh: NaN, elevLow: NaN,
    maxSpeed: NaN, avgSpeed: NaN, maxHr: NaN, avgHr: NaN, avgCadence: NaN, calories: NaN, avgTemp: NaN, gear: '', filename: '', commute: false, race: false, steps: NaN, media: [],
  };
}

describe('comparación con el año anterior', () => {
  const all = [row('a', Date.UTC(2025, 1, 1, 9), 10000), row('b', Date.UTC(2025, 5, 1, 9), 10000), row('c', Date.UTC(2025, 9, 1, 9), 10000), row('d', Date.UTC(2025, 11, 1, 9), 10000)];
  const types = new Set(['Run']);
  it('año en curso: mismas fechas del año anterior', () => {
    const p = previousYearTotals(all, 2026, types, { mo: 10, d: 15 }, 'UTC');
    expect(p).toEqual({ year: 2025, distance: 30000, runs: 3, moving: 9000, partial: true });
  });
  it('año completo', () => {
    expect(previousYearTotals(all, 2026, types, null, 'UTC')!.distance).toBe(40000);
  });
  it('textos: sube, baja, se multiplica o queda igual', () => {
    const es = new Fmt('es', 'metric');
    expect(yearDelta(es, 1120, { year: 2025, distance: 1000, partial: false })).toMatchObject({ value: '+12 %', caption: 'VS 2025', up: true });
    expect(yearDelta(es, 650, { year: 2025, distance: 1000, partial: true })).toMatchObject({ value: '−35 %', caption: 'VS 2025 A ESTAS ALTURAS', up: false });
    expect(yearDelta(es, 2100, { year: 2025, distance: 1000, partial: false })!.value).toBe('×2,1');
    expect(yearDelta(new Fmt('en', 'metric'), 1001, { year: 2025, distance: 1000, partial: false })!.value).toBe('SAME');
  });
});

describe('textos', () => {
  it('singular y plural', () => {
    expect(marathonsLabel(new Fmt('es', 'metric'), 1.02)).toBe('1 maratón');
    expect(marathonsLabel(new Fmt('es', 'metric'), 1.4)).toBe('1,4 maratones');
    expect(marathonsLabel(new Fmt('en', 'metric'), 53)).toBe('53 marathons');
  });
  it('el perfil horario no repite el título del perfil runner', () => {
    const es = new Fmt('es', 'metric');
    expect(habitTitle(es, 'dawn')).toEqual(['ALMA', 'MADRUGADORA']);
    expect(habitTitle(es, 'dawn', true)).not.toEqual(['ALMA', 'MADRUGADORA']);
  });
});

describe('antimeridiano', () => {
  it('una ruta que cruza los 180° se dibuja continua (Fiyi)', () => {
    const t = new Float32Array([-16.8, 179.995, -16.801, 179.999, -16.802, -179.998, -16.803, -179.994]);
    const { paths } = projectRoutes([t], { x: 0, y: 0, w: 1000, h: 1000 });
    const xs = [paths[0][0], paths[0][2], paths[0][4], paths[0][6]];
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    expect(xs[3] - xs[0]).toBeLessThan(1000);
  });
});

// ------------------------------------------------------------------ pantallas que se muestran
function runAct(i: number, opts: Partial<CsvActivity> = {}): Activity {
  const c = { ...row(`r${i}`, Date.UTC(2026, 0, 3 + i * 2, 8), 8000), ...opts };
  return { id: c.id, csv: c, category: 'run', startUtc: c.startUtc, offsetMin: 60, tz: null, local: localTimeOf(c.startUtc, 60), track: null, country: null, city: null, indoor: true };
}

function statsOf(runs: Activity[]): WrappedStats {
  return computeStats({ year: 2026, name: 'Ana', lang: 'es', runs, others: [], prev: null, periodEnd: localTimeOf(Date.UTC(2026, 10, 24), 60), trimMeters: 250 });
}

const envOf = (s: WrappedStats): DeckEnv => ({ fmt: new Fmt('es', 'metric'), stats: s, countries: null, photos: [], brand: 'RUNRECAP', domain: 'runrecap.app' });

describe('pantallas inteligentes', () => {
  it('con una sola carrera, solo lo que tiene sentido', () => {
    expect(buildDeck(envOf(statsOf([runAct(0)]))).map((c) => c.id)).toEqual(['intro', 'distance', 'summary']);
  });
  it('sin zapatillas registradas no hay tarjeta de zapatillas', () => {
    const env = envOf(statsOf(Array.from({ length: 40 }, (_, i) => runAct(i))));
    expect(cardSkipReason('shoes', env)).not.toBeNull();
  });
  it('zapatillas apuntadas en 2 carreras de 40: tampoco', () => {
    const env = envOf(statsOf(Array.from({ length: 40 }, (_, i) => runAct(i, i < 2 ? { gear: 'Pegasus', distance: 30000 } : {}))));
    expect(cardSkipReason('shoes', env)).not.toBeNull();
  });
  it('zapatillas de verdad: sí', () => {
    const env = envOf(statsOf(Array.from({ length: 40 }, (_, i) => runAct(i, { gear: i % 2 ? 'Pegasus' : 'Clifton' }))));
    expect(cardSkipReason('shoes', env)).toBeNull();
  });
  it('cinta sin GPS ni desnivel: sin mapas ni montañas', () => {
    const env = envOf(statsOf(Array.from({ length: 60 }, (_, i) => runAct(i))));
    for (const id of ['heatmap', 'countries', 'allruns', 'elevation'] as const) expect(cardSkipReason(id, env), id).not.toBeNull();
  });
});
