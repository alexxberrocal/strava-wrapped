import { num, parseCsv } from './csv';
import { parseDateParts, partsToUtcMs, type NumericOrder } from './dates';

/**
 * Otros ficheros del export que dan juego (cabeceras también traducidas: se leen por posición).
 *  reactions.csv          Reaction Date, Reaction Type, Parent Type, Parent ID   (kudos que DAS)
 *  global_challenges.csv  Join Date, Name, Completed
 *  goals.csv              Goal Type, Activity Type, Goal, Start Date, End Date, Segment ID, Time Period, …
 *  privacy_zones.csv      Address, Radius, Latitude & Longitude
 */

export type GoalPeriod = 'week' | 'month' | 'year';

export interface Goal {
  kind: 'distance' | 'time' | 'elevation' | 'other';
  running: boolean;
  /** metros (distancia/desnivel) o segundos (tiempo) */
  value: number;
  period: GoalPeriod | null;
  startUtc: number;
}

export interface PrivacyZone {
  lat: number;
  lon: number;
  /** metros */
  radius: number;
}

export interface Extras {
  kudosByYear: Record<number, number>;
  challenges: { joinUtc: number; completed: boolean }[];
  goals: Goal[];
  privacyZones: PrivacyZone[];
}

export function emptyExtras(): Extras {
  return { kudosByYear: {}, challenges: [], goals: [], privacyZones: [] };
}

const truthy = (v: string | undefined) => /^(true|1|1\.0|yes|sí|si|ja|oui|vero|sim|waar)$/i.test((v ?? '').trim());

function dateMs(raw: string | undefined, order: NumericOrder): number {
  const p = parseDateParts(raw ?? '', order);
  return p ? partsToUtcMs(p) : NaN;
}

export function parseReactions(text: string, order: NumericOrder): Record<number, number> {
  const rows = parseCsv(text).slice(1);
  const kudosOnly = rows.some((r) => /kudo/i.test(r[1] ?? ''));
  const out: Record<number, number> = {};
  for (const r of rows) {
    if (kudosOnly && !/kudo/i.test(r[1] ?? '')) continue;
    const t = dateMs(r[0], order);
    if (!Number.isFinite(t)) continue;
    const y = new Date(t).getUTCFullYear();
    out[y] = (out[y] ?? 0) + 1;
  }
  return out;
}

export function parseChallenges(text: string, order: NumericOrder): Extras['challenges'] {
  return parseCsv(text)
    .slice(1)
    .map((r) => ({ joinUtc: dateMs(r[0], order), completed: truthy(r[2]) }))
    .filter((c) => Number.isFinite(c.joinUtc));
}

export function parseGoals(text: string, order: NumericOrder): Goal[] {
  const out: Goal[] = [];
  for (const r of parseCsv(text).slice(1)) {
    const type = (r[0] ?? '').toLowerCase();
    const kind: Goal['kind'] = /distan/.test(type) ? 'distance' : /elev|desniv|höhe|hohe|dénivel|denivel|dislivel/.test(type) ? 'elevation' : /time|tiempo|zeit|temps|tempo/.test(type) ? 'time' : 'other';
    const period = (r[6] ?? '').toLowerCase();
    const p: GoalPeriod | null = /week|seman|woche|semaine|settiman/.test(period)
      ? 'week'
      : /month|mes|monat|mois|mese/.test(period)
        ? 'month'
        : /year|año|ano|jahr|année|annee|anno/.test(period)
          ? 'year'
          : null;
    const value = num(r[2]);
    if (!(value > 0)) continue;
    out.push({
      kind,
      running: /run|carrera|correr|lauf|course|corsa|corrida|hardloop/i.test(r[1] ?? ''),
      value,
      period: p,
      startUtc: dateMs(r[3], order),
    });
  }
  return out;
}

export function parsePrivacyZones(text: string): PrivacyZone[] {
  const out: PrivacyZone[] = [];
  for (const r of parseCsv(text).slice(1)) {
    const m = /(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)/.exec(r[2] ?? '');
    if (!m) continue;
    const lat = Number(m[1]), lon = Number(m[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    let radius = num(r[1]);
    if (!Number.isFinite(radius) || radius <= 0) radius = 500;
    else if (radius < 2) radius *= 1609.344; // millas
    else if (radius < 20) radius *= 1000; // km
    out.push({ lat, lon, radius: radius + 60 });
  }
  return out;
}
