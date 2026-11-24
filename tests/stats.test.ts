import { describe, expect, it } from 'vitest';
import type { CsvActivity } from '../src/parse/activitiesCsv';
import type { TrackSummary } from '../src/parse/track';
import { computeStats, trimTrack, timeOfDayOf } from '../src/stats/compute';
import { localTimeOf, weekIndex } from '../src/stats/time';
import { greatCircleKm, pickDestination, pickLandmark } from '../src/stats/equivalences';
import { pickDefaultYear } from '../src/app/pipeline';
import type { Activity } from '../src/stats/types';

function csv(p: Partial<CsvActivity> & { id: string; startUtc: number }): CsvActivity {
  return {
    name: 'Run', typeRaw: 'Run', category: 'run', elapsed: 3000, moving: 3000, distance: 10000, elevGain: 50,
    elevHigh: 700, elevLow: 600, maxSpeed: NaN, avgSpeed: NaN, maxHr: 170, avgHr: 150, avgCadence: NaN,
    calories: 700, avgTemp: NaN, gear: 'Pegasus', filename: '', commute: false, race: false, steps: NaN, media: [],
    ...p,
  };
}

function track(id: string, lat: number, lon: number, efforts: Record<string, number> = {}): TrackSummary {
  const pts = 40;
  const tr = new Float32Array(pts * 2);
  const cum = new Float32Array(pts);
  for (let i = 0; i < pts; i++) {
    tr[i * 2] = lat + i * 0.001;
    tr[i * 2 + 1] = lon;
    cum[i] = i * 111;
  }
  const hist = new Uint16Array(256);
  hist[150] = 1800;
  hist[175] = 600;
  hist[190] = 10;
  return {
    id, ok: true, startUtc: null, localOffsetMin: null, sport: 'running', subSport: null, hasGps: true,
    start: [lat, lon], end: [lat + 0.039, lon], track: tr, trackCum: cum, bbox: [lat, lon, lat + 0.039, lon],
    efforts, hrHist: hist, maxHr: 190, avgHr: 155, altMax: 720, altMin: 600, tempAvg: NaN, tempMin: NaN,
    tempMax: NaN, steps: NaN, gpsDistance: 4300,
  };
}

function act(c: CsvActivity, offsetMin: number, t: TrackSummary | null, country: string | null): Activity {
  return {
    id: c.id, csv: c, category: c.category, startUtc: c.startUtc, offsetMin, tz: null,
    local: localTimeOf(c.startUtc, offsetMin), track: t, country, city: country ? { name: 'Madrid', cc: 'ES', lat: 40.4, lon: -3.7, pop: 3000 } : null,
    indoor: !t,
  };
}

describe('time helpers', () => {
  it('local time with offset crosses midnight correctly', () => {
    const l = localTimeOf(Date.UTC(2025, 11, 31, 23, 30), 60);
    expect(l.key).toBe('2026-01-01');
    expect(l.h).toBe(0);
    expect(l.doy).toBe(0);
    expect(l.dow).toBe(3); // jueves
  });
  it('week index (lunes a domingo)', () => {
    // 2026-01-01 es jueves -> semana 0 hasta el domingo 4
    expect(weekIndex(2026, 0)).toBe(0);
    expect(weekIndex(2026, 3)).toBe(0);
    expect(weekIndex(2026, 4)).toBe(1);
  });
  it('time of day buckets', () => {
    expect(timeOfDayOf(6)).toBe('dawn');
    expect(timeOfDayOf(10)).toBe('morning');
    expect(timeOfDayOf(13)).toBe('midday');
    expect(timeOfDayOf(17)).toBe('afternoon');
    expect(timeOfDayOf(20)).toBe('evening');
    expect(timeOfDayOf(23)).toBe('night');
    expect(timeOfDayOf(2)).toBe('night');
  });
});

describe('computeStats', () => {
  const runs: Activity[] = [];
  // 10 días seguidos en enero a las 07:00 locales (+60) en Madrid
  for (let i = 0; i < 10; i++) {
    const c = csv({ id: `a${i}`, startUtc: Date.UTC(2026, 0, 5 + i, 6, 0), distance: 10000, moving: 3000 });
    runs.push(act(c, 60, track(c.id, 40.4, -3.7, i === 3 ? { '1000': 240, '5000': 1300 } : { '1000': 260 }), 'ES'));
  }
  // Una larga en abril (Lisboa) y una de cinta sin GPS en agosto por la tarde
  const long = csv({ id: 'long', startUtc: Date.UTC(2026, 3, 12, 8, 0), distance: 30000, moving: 10000, elevGain: 400 });
  runs.push(act(long, 60, track('long', 38.72, -9.14, { '1000': 250, '5000': 1350, '10000': 2800, '21097.5': 6400 }), 'PT'));
  const tm = csv({ id: 'tm', startUtc: Date.UTC(2026, 7, 3, 18, 0), distance: 5000, moving: 1500, gear: 'Clifton' });
  runs.push(act(tm, 120, null, null));
  const ride = act(csv({ id: 'r', startUtc: Date.UTC(2026, 4, 1, 9), typeRaw: 'Ride', category: 'ride', distance: 50000, moving: 7200 }), 120, null, null);

  const s = computeStats({
    year: 2026, name: 'Alex', lang: 'es', runs, others: [ride],
    prev: { year: 2025, distance: 100000, runs: 10, moving: 30000, partial: false },
    periodEnd: localTimeOf(Date.UTC(2026, 10, 21, 12), 60), trimMeters: 250,
  });

  it('totals', () => {
    expect(s.runs).toBe(12);
    expect(s.distance).toBe(135000);
    expect(s.moving).toBe(41500);
    expect(s.elevation).toBe(50 * 11 + 400);
    expect(s.avgPace).toBeCloseTo(41500 / 135000);
  });
  it('period: partial year until export date', () => {
    expect(s.isPartialYear).toBe(true);
    expect(s.periodEnd.key).toBe('2026-11-21');
    expect(s.daysInPeriod).toBe(325);
  });
  it('streak and best week', () => {
    expect(s.activeDays).toBe(12);
    expect(s.longestStreak.days).toBe(10);
    expect(localTimeOf(Date.UTC(2026, 0, 1) + s.longestStreak.startDoy * 864e5, 0).key).toBe('2026-01-05');
    expect(s.bestWeek!.distance).toBe(70000); // lunes 5 a domingo 11
    expect(s.bestWeek!.runs).toBe(7);
  });
  it('months, weekdays and hours', () => {
    expect(s.months[0].runs).toBe(10);
    expect(s.months[3].distance).toBe(30000);
    expect(s.bestMonth).toBe(0);
    expect(s.hours[7]).toBe(10);
    expect(s.timeOfDay).toBe('dawn');
    expect(s.earlyShare).toBeCloseTo(10 / 12); // la larga empieza a las 9:00
    expect(s.earliest!.minutes).toBe(7 * 60);
    expect(s.latest!.minutes).toBe(20 * 60);
  });
  it('records and best efforts', () => {
    expect(s.longestRun!.id).toBe('long');
    expect(s.efforts.find((e) => e.target === 1000)!.time).toBe(240);
    expect(s.efforts.find((e) => e.target === 1000)!.run.id).toBe('a3');
    expect(s.efforts.find((e) => e.target === 21097.5)!.run.id).toBe('long');
    expect(s.efforts.some((e) => e.target === 42195)).toBe(false);
    expect(s.biggestClimb!.id).toBe('long');
  });
  it('heart rate zones', () => {
    expect(s.hr).not.toBeNull();
    expect(s.hr!.beats).toBeCloseTo((150 * 41500) / 60);
    expect(s.hr!.max).toBeGreaterThanOrEqual(175);
    const total = s.hr!.zones.reduce((a, z) => a + z.seconds, 0);
    expect(total).toBe(s.hr!.zoneSeconds);
  });
  it('places, home and privacy trimming', () => {
    expect(s.countries.map((c) => c.code)).toEqual(['ES', 'PT']);
    expect(s.indoorRuns).toBe(1);
    expect(s.gpsRuns).toBe(11);
    expect(s.home!.runs).toBe(10);
    expect(s.home!.name).toBe('Madrid');
    // 40 puntos cada 111 m: se recortan ~250 m por cada lado
    expect(s.home!.tracks[0].length / 2).toBe(36); // 34 puntos interiores + 2 interpolados
    expect(s.routes).toHaveLength(11);
  });
  it('shoes, others, archetype', () => {
    expect(s.shoes[0]).toMatchObject({ name: 'Pegasus', runs: 11 });
    expect(s.shoes[1].name).toBe('Clifton');
    expect(s.others).toHaveLength(1);
    expect(s.others[0].category).toBe('ride');
    expect(s.archetype.key).toBe('earlybird');
  });
});

describe('trimTrack', () => {
  it('returns null when the route is too short', () => {
    const tr = new Float32Array([0, 0, 0, 0.001]);
    expect(trimTrack(tr, new Float32Array([0, 111]), 250)).not.toBeNull();
    expect(trimTrack(new Float32Array([0, 0]), new Float32Array([0]), 250)).toBeNull();
  });
});

describe('equivalences', () => {
  it('destination within reach, not overshooting', () => {
    const madrid = { lat: 40.4168, lon: -3.7038 };
    const d = pickDestination(madrid, 1100, 'es')!;
    expect(d.km).toBeLessThanOrEqual(1100);
    expect(d.km).toBeGreaterThan(1000);
    expect(d.name).toBe('París');
    expect(pickDestination(madrid, 30, 'es')).toBeNull();
    expect(greatCircleKm(40.4168, -3.7038, 41.3874, 2.1686)).toBeCloseTo(505, -1);
  });
  it('landmarks', () => {
    expect(pickLandmark(27286)!.landmark.key).toBe('everest');
    expect(pickLandmark(27286)!.times).toBeCloseTo(3.08, 2);
    expect(pickLandmark(5000)!.landmark.key).toBe('montblanc');
    expect(pickLandmark(900)!.landmark.key).toBe('burj');
    expect(pickLandmark(100)!.landmark.key).toBe('eiffel');
  });
});

describe('default year', () => {
  const years = [
    { year: 2026, runs: 120, distance: 1, activities: 1 },
    { year: 2025, runs: 200, distance: 1, activities: 1 },
  ];
  it('November -> current year', () => {
    expect(pickDefaultYear(years, Date.UTC(2026, 10, 21))).toBe(2026);
  });
  it('January -> previous year', () => {
    expect(pickDefaultYear([{ year: 2027, runs: 3, distance: 1, activities: 1 }, ...years], Date.UTC(2027, 0, 10))).toBe(2026);
  });
});
