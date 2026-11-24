import type { Lang } from '../i18n/langs';
import type { CsvActivity } from '../parse/activitiesCsv';
import type { TrackSummary } from '../parse/track';
import type { Countries } from '../geo/countries';
import type { Cities } from '../geo/cities';
import { browserTimeZone, offsetMinutes, tzAt } from '../geo/timezone';
import { localTimeOf } from '../stats/time';
import type { Activity, WrappedStats } from '../stats/types';
import type { Extras } from '../parse/extras';
import { computeStats } from '../stats/compute';

/**
 * Lógica pura del paso "CSV + rutas -> actividades con hora local, país y ciudad".
 * La usa el Pipeline (con los workers) y también el simulador de atletas de `scripts/sim`.
 */

const VIRTUAL = /virtu|zwift/i;

/**
 * Actividades marcadas como carrera que no pueden serlo: más rápidas que el récord del mundo
 * de su distancia (casi siempre una salida en bici o un trayecto en coche con el tipo mal puesto).
 */
export function implausibleRun(a: Pick<CsvActivity, 'distance' | 'moving' | 'elapsed'>): boolean {
  const d = a.distance;
  const t = a.moving > 0 ? a.moving : a.elapsed;
  if (!(d >= 1000) || !(t > 0)) return false;
  const v = d / t;
  // Un 1 % por encima del récord del mundo de cada distancia ya no es correr.
  if (d >= 21000) return v > 6.19; // media maratón: 6,12 m/s
  if (d >= 10000) return v > 6.43; // 10 km: 6,37 m/s
  if (d >= 5000) return v > 6.69; // 5 km: 6,62 m/s
  return v > 7.65; // 1 km: 7,58 m/s
}

export function enrichActivities(
  list: CsvActivity[],
  trackOf: (id: string) => TrackSummary | null,
  countries: Countries | null,
  cities: Cities | null,
  fallbackTz?: string | null,
): Activity[] {
  const out: Activity[] = [];
  // Primera pasada: zonas horarias de las que tienen GPS.
  const tzVotes = new Map<string, number>();
  const pre = list.map((csv) => {
    let track = trackOf(csv.id);
    // Zwift y similares graban GPS de mundos virtuales (Watopia cae en el Pacífico): fuera mapas.
    if (track && (VIRTUAL.test(csv.typeRaw) || track.subSport === 'virtual_activity')) {
      track = { ...track, hasGps: false, start: null, end: null, track: null, trackCum: null, bbox: null };
    }
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
      country: p.start ? ((countries?.lookup(p.start[0], p.start[1]) ?? null) || (cities?.nearestCountry(p.start[0], p.start[1]) ?? null)) : null,
      city: p.start && cities ? cities.locate(p.start[0], p.start[1]) : null,
      indoor: !p.start,
    });
  }
  return out;
}

/** Zona horaria más repetida entre las actividades con GPS (o la del navegador). */
export function homeTimeZone(acts: Activity[]): string | null {
  const votes = new Map<string, number>();
  for (const a of acts) if (a.tz) votes.set(a.tz, (votes.get(a.tz) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [tz, c] of votes) if (c > n) [best, n] = [tz, c];
  return best ?? browserTimeZone();
}

/**
 * Totales del año anterior para comparar. Si el año actual aún no ha terminado, se compara con
 * las mismas fechas del año anterior (1 de enero → mismo día), que es lo justo.
 */
export function previousYearTotals(
  activities: CsvActivity[],
  year: number,
  runTypes: Set<string>,
  cutoff: { mo: number; d: number } | null,
  tz: string | null,
): WrappedStats['prev'] {
  const py = year - 1;
  // Último instante (hora local) que cuenta del año anterior.
  let endLocal = Date.UTC(year, 0, 1);
  if (cutoff) {
    // 29 de febrero -> 28 en años no bisiestos.
    const dim = new Date(Date.UTC(py, cutoff.mo, 0)).getUTCDate();
    endLocal = Date.UTC(py, cutoff.mo - 1, Math.min(cutoff.d, dim) + 1);
  }
  const startLocal = Date.UTC(py, 0, 1);
  let distance = 0, runs = 0, moving = 0;
  for (const a of activities) {
    if (!Number.isFinite(a.startUtc) || !runTypes.has(a.typeRaw) || implausibleRun(a)) continue;
    const off = tz ? (offsetMinutes(tz, a.startUtc) ?? 0) : 0;
    const local = a.startUtc + off * 60000;
    if (local >= startLocal && local < endLocal) {
      distance += a.distance;
      moving += a.moving;
      runs++;
    }
  }
  if (runs < 3 || distance < 10000) return null;
  return { year: py, distance, runs, moving, partial: !!cutoff };
}

const HOUR = 3600000;

/** Actividades del año (con margen de ±14 h por las zonas horarias), separadas por tipo. */
export function splitYear(all: CsvActivity[], year: number, runTypes: Set<string>) {
  const from = Date.UTC(year, 0, 1) - 14 * HOUR;
  const to = Date.UTC(year + 1, 0, 1) + 14 * HOUR;
  const inWindow = all.filter((a) => a.startUtc >= from && a.startUtc < to);
  const typed = inWindow.filter((a) => runTypes.has(a.typeRaw));
  return {
    // Fuera las "carreras" imposibles (bici o coche con el tipo mal puesto).
    runsCsv: typed.filter((a) => !implausibleRun(a)),
    excludedCsv: typed.filter((a) => implausibleRun(a)),
    othersCsv: inWindow.filter((a) => !runTypes.has(a.typeRaw)),
  };
}

/** Cierra el año: carreras (ya enriquecidas) del año local, otros deportes y descartadas. */
export function finishYear(year: number, enrichedRuns: Activity[], othersCsv: CsvActivity[], excludedCsv: CsvActivity[]) {
  const runs = enrichedRuns.filter((a) => a.local.y === year);
  const homeTz = homeTimeZone(runs);
  const others = enrichActivities(othersCsv, () => null, null, null, homeTz).filter((a) => a.local.y === year);
  const excluded = enrichActivities(excludedCsv, () => null, null, null, homeTz).filter((a) => a.local.y === year).length;
  return { runs, others, excluded };
}

export interface WrappedContext {
  activities: CsvActivity[];
  exportDate: number | null;
  extras: Extras | null;
}

export interface WrappedOptions {
  name: string;
  lang: Lang;
  trimMeters: number;
}

/** Estadísticas del año a partir de las carreras ya enriquecidas. */
export function wrappedStats(ctx: WrappedContext, year: number, runs: Activity[], others: Activity[], opts: WrappedOptions, runTypes: Set<string>): WrappedStats {
  const exp = ctx.exportDate;
  const tz = homeTimeZone(runs);
  const periodEnd = exp ? localTimeOf(exp, tz ? (offsetMinutes(tz, exp) ?? 0) : 0) : null;
  // Año en curso: se compara con las mismas fechas del año anterior.
  const partial = periodEnd && periodEnd.y === year && !(periodEnd.mo === 12 && periodEnd.d === 31) ? { mo: periodEnd.mo, d: periodEnd.d } : null;
  const ex = ctx.extras;
  const kudos = ex?.kudosByYear?.[year] ?? null;
  const done = ex?.challenges?.filter((c) => c.completed && new Date(c.joinUtc).getUTCFullYear() === year).length ?? 0;
  // Kilómetros de cada zapatilla en todo el export hasta el final de este año.
  const gearLifetime: Record<string, number> = {};
  const until = Date.UTC(year + 1, 0, 1) + 14 * HOUR;
  for (const a of ctx.activities) {
    if (a.gear && runTypes.has(a.typeRaw) && a.startUtc < until && !implausibleRun(a)) gearLifetime[a.gear] = (gearLifetime[a.gear] ?? 0) + a.distance;
  }
  return computeStats({
    year,
    name: opts.name,
    gearLifetime,
    lang: opts.lang,
    runs,
    others,
    prev: previousYearTotals(ctx.activities, year, runTypes, partial, tz),
    periodEnd,
    trimMeters: opts.trimMeters,
    extras: {
      kudos: kudos && kudos > 0 ? kudos : null,
      challenges: done > 0 ? done : null,
      goals: ex?.goals ?? [],
      zones: opts.trimMeters > 0 ? (ex?.privacyZones ?? []) : [],
    },
  });
}
