import type { ArchiveInput } from '../parse/archive';
import type { SportCategory } from '../parse/sports';
import type { TrackSummary } from '../parse/track';
import type { ScanResult } from '../worker/core';
import { loadCities, type Cities } from '../geo/cities';
import { loadCountries, type Countries } from '../geo/countries';
import { enrichActivities, finishYear, splitYear, wrappedStats, type WrappedOptions } from './enrich';
export type { WrappedOptions } from './enrich';
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
  async buildYear(year: number, opts: BuildOptions, onProgress?: (done: number, total: number) => void): Promise<{ runs: Activity[]; others: Activity[]; excluded: number }> {
    const cacheKey = `${year}|${[...opts.runTypes].sort().join('§')}`;
    const { runsCsv, excludedCsv, othersCsv } = splitYear(this.data.scan.csv.activities, year, opts.runTypes);
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
      cached = enrichActivities(runsCsv, (id) => this.tracks.get(id) ?? null, countries, cities);
      this.yearCache.set(cacheKey, cached);
    }
    return finishYear(year, cached, othersCsv, excludedCsv);
  }

  wrapped(year: number, runs: Activity[], others: Activity[], opts: WrappedOptions, runTypes: Set<string>): WrappedStats {
    const { scan } = this.data;
    return wrappedStats({ activities: scan.csv.activities, exportDate: scan.exportDate, extras: scan.extras }, year, runs, others, opts, runTypes);
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
