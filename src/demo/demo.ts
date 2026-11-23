import type { CsvActivity } from '../parse/activitiesCsv';
import { emptyTrack, pushPoint } from '../parse/decoded';
import { summarizeTrack } from '../parse/track';
import { computeStats } from '../stats/compute';
import { localTimeOf } from '../stats/time';
import type { Activity, WrappedStats } from '../stats/types';
import { generateAthlete, type Athlete, type SynthPoint } from './generator';

let cached: Athlete | null = null;
const tracks = new Map<string, ReturnType<typeof summarizeTrack>>();

export function athlete(): Athlete {
  if (!cached) cached = generateAthlete();
  return cached;
}

function decoded(points: SynthPoint[]) {
  const d = emptyTrack();
  for (const p of points) pushPoint(d, p.t, p.lat, p.lon, p.alt, p.hr, p.cad, NaN, NaN);
  d.startTime = points[0]?.t ?? null;
  d.sport = 'running';
  return d;
}

function baseCsv(): Omit<CsvActivity, 'id' | 'startUtc' | 'name' | 'typeRaw' | 'category'> {
  return {
    elapsed: 0, moving: 0, distance: 0, elevGain: NaN, elevHigh: NaN, elevLow: NaN, maxSpeed: NaN, avgSpeed: NaN,
    maxHr: NaN, avgHr: NaN, avgCadence: NaN, calories: NaN, avgTemp: NaN, gear: '', filename: '', commute: false,
    race: false, steps: NaN, media: [],
  };
}

export function demoActivities(lang: 'es' | 'en'): { runs: Activity[]; others: Activity[]; exportDate: number; name: string } {
  const a = athlete();
  const runs: Activity[] = a.runs.map((r) => {
    let track = tracks.get(r.id) ?? null;
    if (!track && r.points) {
      track = summarizeTrack(decoded(r.points), { id: r.id, csvDistance: r.distance });
      tracks.set(r.id, track);
    }
    const csv: CsvActivity = {
      ...baseCsv(),
      id: r.id,
      startUtc: r.startUtc,
      name: r.name[lang],
      typeRaw: lang === 'es' ? 'Carrera' : 'Run',
      category: 'run',
      elapsed: r.elapsed,
      moving: r.moving,
      distance: r.distance,
      elevGain: r.elevGain,
      elevHigh: r.elevHigh,
      avgHr: r.avgHr,
      maxHr: r.maxHr,
      calories: r.calories,
      gear: r.gear,
      race: r.race,
    };
    const gps = !!r.points;
    return {
      id: r.id,
      csv,
      category: 'run',
      startUtc: r.startUtc,
      offsetMin: r.offsetMin,
      tz: null,
      local: localTimeOf(r.startUtc, r.offsetMin),
      track,
      country: gps ? r.place.cc : null,
      city: gps ? { name: r.place.name[lang], cc: r.place.cc, lat: r.place.lat, lon: r.place.lon, pop: r.place.pop } : null,
      indoor: !gps,
    };
  });
  const others: Activity[] = a.others.map((o) => ({
    id: o.id,
    csv: { ...baseCsv(), id: o.id, startUtc: o.startUtc, name: '', typeRaw: o.typeRaw[lang], category: o.category, moving: o.moving, elapsed: o.moving, distance: o.distance },
    category: o.category,
    startUtc: o.startUtc,
    offsetMin: o.offsetMin,
    tz: null,
    local: localTimeOf(o.startUtc, o.offsetMin),
    track: null,
    country: null,
    city: null,
    indoor: true,
  }));
  return { runs, others, exportDate: a.exportDate, name: a.name };
}

export function demoStats(lang: 'es' | 'en', trimMeters = 250): WrappedStats {
  const d = demoActivities(lang);
  return computeStats({
    year: 2026,
    name: d.name,
    lang,
    runs: d.runs,
    others: d.others,
    prev: { year: 2025, distance: 1_386_000, runs: 151, moving: 466_000 },
    periodEnd: localTimeOf(d.exportDate, 60),
    trimMeters,
  });
}
