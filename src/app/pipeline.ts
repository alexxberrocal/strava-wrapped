import type { ArchiveInput } from '../parse/archive';
import type { CsvActivity } from '../parse/activitiesCsv';
import type { SportCategory } from '../parse/sports';
import type { TrackSummary } from '../parse/track';
import type { ScanResult } from '../worker/core';
import { loadCities, type Cities } from '../geo/cities';
import { loadCountries, type Countries } from '../geo/countries';
import { browserTimeZone, offsetMinutes, tzAt } from '../geo/timezone';
import { computeStats } from '../stats/compute';
import { localTimeOf } from '../stats/time';
import type { Activity, WrappedStats } from '../stats/types';
import { ParserPool } from './pool';

export interface YearInfo {
  year: number;
  runs: number;
  distance: number;
  activities: number;
}

export interface TypeInfo {
  typeRaw: string;
  category: SportCategory;
  count: number;
}

export interface Dataset {
  scan: ScanResult;
  years: YearInfo[];
  defaultYear: number | null;
  firstName: string | null;
}

export interface BuildOptions {
  /** Tipos (texto original de Strava) que cuentan como carrera. */
  runTypes: Set<string>;
}

export interface WrappedOptions {
  name: string;
  lang: 'es' | 'en';
  trimMeters: number;
}

const HOUR = 3600000;

/** Orquesta: escaneo del export -> procesado de ficheros del año -> enriquecido geográfico -> estadísticas. */
export class Pipeline {
  private pool: ParserPool;
  private tracks = new Map<string, TrackSummary>();
  private dataset: Dataset | null = null;
  private geo: Promise<[Countries | null, Cities | null]> | null = null;
  private yearCache = new Map<string, Activity[]>();

  constructor(input: ArchiveInput) {
    this.pool = new ParserPool(input);
  }

  async load(): Promise<Dataset> {
    // Los datos geográficos se descargan mientras tanto.
    this.geo = Promise.all([loadCountries().catch(() => null), loadCities().catch(() => null)]);
    const scan = await this.pool.scan();
    const byYear = new Map<number, YearInfo>();
    for (const a of scan.csv.activities) {
      if (!Number.isFinite(a.startUtc)) continue;
      const y = new Date(a.startUtc).getUTCFullYear();
      const e = byYear.get(y) ?? { year: y, runs: 0, distance: 0, activities: 0 };
      e.activities++;
      if (a.category === 'run') {
        e.runs++;
        e.distance += a.distance;
      }
      byYear.set(y, e);
    }
    const years = [...byYear.values()].sort((a, b) => b.year - a.year);
    this.dataset = { scan, years, defaultYear: pickDefaultYear(years, scan.exportDate), firstName: scan.firstName };
    return this.dataset;
  }

  get data(): Dataset {
    if (!this.dataset) throw new Error('load() primero');
    return this.dataset;
  }

  /** Tipos de actividad presentes en un año (para el selector "qué cuenta como correr"). */
  typesFor(year: number): TypeInfo[] {
    const m = new Map<string, TypeInfo>();
    for (const a of this.data.scan.csv.activities) {
      if (!Number.isFinite(a.startUtc) || new Date(a.startUtc).getUTCFullYear() !== year) continue;
      const k = a.typeRaw || '—';
      const e = m.get(k) ?? { typeRaw: a.typeRaw, category: a.category, count: 0 };
      e.count++;
      m.set(k, e);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }

  defaultRunTypes(): Set<string> {
    const s = new Set<string>();
    for (const a of this.data.scan.csv.activities) if (a.category === 'run') s.add(a.typeRaw);
    return s;
  }

  /** Procesa los ficheros de las carreras del año y devuelve las actividades enriquecidas. */
  async buildYear(year: number, opts: BuildOptions, onProgress?: (done: number, total: number) => void): Promise<{ runs: Activity[]; others: Activity[] }> {
    const cacheKey = `${year}|${[...opts.runTypes].sort().join('§')}`;
    const all = this.data.scan.csv.activities;
    const from = Date.UTC(year, 0, 1) - 14 * HOUR;
    const to = Date.UTC(year + 1, 0, 1) + 14 * HOUR;
    const inWindow = all.filter((a) => a.startUtc >= from && a.startUtc < to);
    const runsCsv = inWindow.filter((a) => opts.runTypes.has(a.typeRaw));

    const jobs = runsCsv
      .filter((a) => a.filename && !this.tracks.has(a.id))
      .map((a) => ({ id: a.id, filename: a.filename, csvDistance: a.distance }));
    if (jobs.length) {
      const res = await this.pool.tracks(jobs, onProgress);
      for (const r of res) this.tracks.set(r.id, r);
    } else onProgress?.(1, 1);

    const [countries, cities] = (await this.geo) ?? [null, null];
    let cached = this.yearCache.get(cacheKey);
    if (!cached) {
      cached = this.enrich(runsCsv, countries, cities, true);
      this.yearCache.set(cacheKey, cached);
    }
    const runs = cached.filter((a) => a.local.y === year);
    const homeTz = this.homeTz(runs);
    const othersCsv = inWindow.filter((a) => !opts.runTypes.has(a.typeRaw));
    const others = this.enrich(othersCsv, null, null, false, homeTz).filter((a) => a.local.y === year);
    return { runs, others };
  }

  private homeTz(acts: Activity[]): string | null {
    const votes = new Map<string, number>();
    for (const a of acts) if (a.tz) votes.set(a.tz, (votes.get(a.tz) ?? 0) + 1);
    let best: string | null = null;
    let n = 0;
    for (const [tz, c] of votes) if (c > n) [best, n] = [tz, c];
    return best ?? browserTimeZone();
  }

  private enrich(list: CsvActivity[], countries: Countries | null, cities: Cities | null, withTracks: boolean, fallbackTz?: string | null): Activity[] {
    const out: Activity[] = [];
    // Primera pasada: zonas horarias de las que tienen GPS.
    const tzVotes = new Map<string, number>();
    const pre = list.map((csv) => {
      const track = withTracks ? (this.tracks.get(csv.id) ?? null) : null;
      const start = track?.ok && track.hasGps ? track.start : null;
      const tz = start ? tzAt(start[0], start[1]) : null;
      if (tz) tzVotes.set(tz, (tzVotes.get(tz) ?? 0) + 1);
      return { csv, track: track?.ok ? track : null, start, tz };
    });
    let homeTz = fallbackTz ?? null;
    if (!homeTz) {
      let n = 0;
      for (const [tz, c] of tzVotes) if (c > n) [homeTz, n] = [tz, c];
      homeTz = homeTz ?? browserTimeZone();
    }
    for (const p of pre) {
      const startUtc = Number.isFinite(p.csv.startUtc) ? p.csv.startUtc : (p.track?.startUtc ?? NaN);
      if (!Number.isFinite(startUtc)) continue;
      let offset: number | null = null;
      if (p.tz) offset = offsetMinutes(p.tz, startUtc);
      if (offset == null && p.track?.localOffsetMin != null) offset = p.track.localOffsetMin;
      if (offset == null && homeTz) offset = offsetMinutes(homeTz, startUtc);
      offset = offset ?? 0;
      out.push({
        id: p.csv.id,
        csv: p.csv,
        category: p.csv.category,
        startUtc,
        offsetMin: offset,
        tz: p.tz ?? null,
        local: localTimeOf(startUtc, offset),
        track: p.track,
        country: p.start && countries ? countries.lookup(p.start[0], p.start[1]) : null,
        city: p.start && cities ? cities.locate(p.start[0], p.start[1]) : null,
        indoor: !p.start,
      });
    }
    return out;
  }

  /** Totales del año anterior (solo CSV) para comparar. */
  previousYear(year: number, runTypes: Set<string>): WrappedStats['prev'] {
    const from = Date.UTC(year - 1, 0, 1);
    const to = Date.UTC(year, 0, 1);
    let distance = 0, runs = 0, moving = 0;
    for (const a of this.data.scan.csv.activities) {
      if (a.startUtc >= from && a.startUtc < to && runTypes.has(a.typeRaw)) {
        distance += a.distance;
        moving += a.moving;
        runs++;
      }
    }
    return runs >= 5 ? { year: year - 1, distance, runs, moving } : null;
  }

  wrapped(year: number, runs: Activity[], others: Activity[], opts: WrappedOptions, runTypes: Set<string>): WrappedStats {
    const exp = this.data.scan.exportDate;
    const tz = this.homeTz(runs);
    const periodEnd = exp ? localTimeOf(exp, tz ? (offsetMinutes(tz, exp) ?? 0) : 0) : null;
    return computeStats({
      year,
      name: opts.name,
      lang: opts.lang,
      runs,
      others,
      prev: this.previousYear(year, runTypes),
      periodEnd,
      trimMeters: opts.trimMeters,
    });
  }

  async photos(paths: string[], max = 6): Promise<ImageBitmap[]> {
    const picked = pickSpread(paths, max * 2);
    const items = await this.pool.media(picked);
    const out: ImageBitmap[] = [];
    for (const it of items) {
      if (out.length >= max) break;
      try {
        const blob = new Blob([it.bytes as BlobPart], { type: it.type });
        out.push(await createImageBitmap(blob));
      } catch {
        /* formato no soportado (HEIC…) */
      }
    }
    return out;
  }

  dispose() {
    this.pool.dispose();
  }
}

function pickSpread<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor((i * arr.length) / n)]);
  return out;
}

/** Año por defecto: en temporada de resúmenes (dic–mar) el año recién acabado; si no, el más reciente con carreras. */
export function pickDefaultYear(years: YearInfo[], exportDate: number | null, now = Date.now()): number | null {
  const withRuns = years.filter((y) => y.runs > 0);
  if (!withRuns.length) return years[0]?.year ?? null;
  const ref = new Date(exportDate ?? now);
  const cy = ref.getUTCFullYear();
  const month = ref.getUTCMonth();
  const cur = withRuns.find((y) => y.year === cy);
  const prev = withRuns.find((y) => y.year === cy - 1);
  if (month <= 2 && prev) return prev.year;
  if (cur && (cur.runs >= 10 || !prev)) return cur.year;
  if (prev) return prev.year;
  return withRuns[0].year;
}
