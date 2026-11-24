import type { Lang } from '../i18n/langs';
import { EFFORT_TARGETS, haversine, plausibleEffort } from '../parse/track';
import type { Goal, PrivacyZone } from '../parse/extras';
import type { SportCategory } from '../parse/sports';
import { daysInYear, jan1Dow, localTimeOf, weekIndex } from './time';
import { sunPhase } from './sun';
import { localCityName } from './cityNames';
import type { Activity, ArchetypeKey, HabitKey, LocalTime, Place, RunRef, TimeOfDay, WrappedStats } from './types';

export interface ComputeInput {
  year: number;
  name: string;
  lang: Lang;
  runs: Activity[];
  others: Activity[];
  prev: WrappedStats['prev'];
  /** Fecha (local) del export o del último dato; acota "los días que llevamos de año". */
  periodEnd: LocalTime | null;
  /** Metros a recortar al inicio/fin de cada ruta (privacidad). 0 = no recortar. */
  trimMeters: number;
  /** Distancia de cada zapatilla en todo el export hasta el final de este año (m). */
  gearLifetime?: Record<string, number>;
  /** Datos extra del export ya filtrados para el año. */
  extras?: {
    kudos: number | null;
    challenges: number | null;
    goals: Goal[];
    zones: PrivacyZone[];
  };
}

const finite = (x: number) => Number.isFinite(x);

/** Recorta inicio y fin de una ruta (interpolando) para no mostrar dónde vives. */
export function trimTrack(track: Float32Array, cum: Float32Array | null, meters: number, zones: PrivacyZone[] = []): Float32Array | null {
  const n = track.length / 2;
  if (n < 2) return null;
  // Zonas de privacidad de Strava: se quita el tramo inicial/final que cae dentro.
  let first = 0, last = n - 1;
  if (zones.length) {
    const inside = (i: number) => zones.some((z) => haversine(track[i * 2], track[i * 2 + 1], z.lat, z.lon) <= z.radius);
    while (first < n && inside(first)) first++;
    while (last > first && inside(last)) last--;
    if (last - first < 1) return null;
  }
  if ((!meters || !cum || cum.length !== n) && first === 0 && last === n - 1) return track;
  if (!cum || cum.length !== n) return track.slice(first * 2, (last + 1) * 2);
  const span = cum[last] - cum[first];
  if (!(span > 0)) return null;
  const cut = Math.min(meters, span * 0.2);
  const startD = cum[first] + cut;
  const endD = cum[last] - cut;
  const at = (i: number, d: number): [number, number] => {
    const d0 = cum[i], d1 = cum[i + 1];
    const f = d1 > d0 ? Math.max(0, Math.min(1, (d - d0) / (d1 - d0))) : 0;
    return [track[i * 2] + (track[i * 2 + 2] - track[i * 2]) * f, track[i * 2 + 1] + (track[i * 2 + 3] - track[i * 2 + 1]) * f];
  };
  const out: number[] = [];
  let i = first;
  while (i < n - 2 && cum[i + 1] < startD) i++;
  out.push(...at(i, startD));
  for (let k = i + 1; k < n && cum[k] < endD; k++) if (cum[k] > startD) out.push(track[k * 2], track[k * 2 + 1]);
  let j = Math.min(n - 2, last);
  while (j > 0 && cum[j] > endD) j--;
  out.push(...at(j, endD));
  return out.length >= 4 ? new Float32Array(out) : null;
}

function refOf(a: Activity, trimMeters: number, zones: PrivacyZone[] = []): RunRef {
  const t = a.track;
  return {
    id: a.id,
    name: a.csv.name,
    local: a.local,
    distance: a.csv.distance,
    moving: a.csv.moving,
    elapsed: a.csv.elapsed,
    elevGain: finite(a.csv.elevGain) ? a.csv.elevGain : 0,
    pace: a.csv.distance > 0 ? a.csv.moving / a.csv.distance : NaN,
    avgHr: finite(a.csv.avgHr) ? a.csv.avgHr : t && finite(t.avgHr) ? t.avgHr : NaN,
    country: a.country,
    cityName: a.city?.name ?? null,
    track: t?.track ? trimTrack(t.track, t.trackCum, trimMeters, zones) : null,
  };
}

function argmax(arr: number[]): number {
  let bi = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[bi]) bi = i;
  return bi;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
}

function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Longitud envuelta: 179,9° y −179,9° están a 0,2°, no a 359,8° (Fiyi, Chukotka…).
  const x = ((((lon2 - lon1 + 540) % 360) - 180) * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180));
  return Math.sqrt(x * x + (lat2 - lat1) ** 2) * 111.2;
}

/** Franja horaria (hora local de inicio). Las 4:00 ya son madrugón, no noche. */
export function timeOfDayOf(h: number): TimeOfDay {
  if (h >= 4 && h < 8) return 'dawn';
  if (h >= 8 && h < 12) return 'morning';
  if (h >= 12 && h < 15) return 'midday';
  if (h >= 15 && h < 19) return 'afternoon';
  if (h >= 19 && h < 22) return 'evening';
  return 'night';
}

export function computeStats(input: ComputeInput): WrappedStats {
  const { year, trimMeters } = input;
  const runs = [...input.runs].sort((a, b) => a.startUtc - b.startUtc);
  const zones = input.extras?.zones ?? [];
  const ref = (a: Activity) => refOf(a, trimMeters, zones);
  const totalDays = daysInYear(year);

  // ---- Totales ----
  let distance = 0, moving = 0, elapsed = 0, elevation = 0;
  for (const r of runs) {
    distance += r.csv.distance;
    moving += r.csv.moving;
    elapsed += r.csv.elapsed;
    if (finite(r.csv.elevGain)) elevation += r.csv.elevGain;
  }

  // ---- Periodo ----
  const lastRunDoy = runs.length ? runs[runs.length - 1].local.doy : 0;
  let endDoy = totalDays - 1;
  if (input.periodEnd && input.periodEnd.y === year) endDoy = Math.max(lastRunDoy, Math.min(totalDays - 1, input.periodEnd.doy));
  const isPartialYear = endDoy < totalDays - 1;
  const daysInPeriod = endDoy + 1;
  const periodEnd = localTimeOf(Date.UTC(year, 0, 1) + endDoy * 86400000, 0);

  // ---- Días, semanas, rachas ----
  const daily = new Float32Array(366);
  const activeDayFlags = new Uint8Array(366);
  const weekDist = new Map<number, number>();
  const weekRuns = new Map<number, number>();
  for (const r of runs) {
    const doy = r.local.doy;
    daily[doy] += r.csv.distance;
    activeDayFlags[doy] = 1;
    const w = weekIndex(year, doy);
    weekDist.set(w, (weekDist.get(w) ?? 0) + r.csv.distance);
    weekRuns.set(w, (weekRuns.get(w) ?? 0) + 1);
  }
  let activeDays = 0;
  let streak = { days: 0, startDoy: 0, endDoy: 0 };
  let cur = 0;
  for (let d = 0; d < 366; d++) {
    if (activeDayFlags[d]) {
      activeDays++;
      cur++;
      if (cur > streak.days) streak = { days: cur, startDoy: d - cur + 1, endDoy: d };
    } else cur = 0;
  }
  let bestWeek: WrappedStats['bestWeek'] = null;
  const j1 = jan1Dow(year);
  for (const [w, dist] of weekDist) {
    if (!bestWeek || dist > bestWeek.distance) {
      bestWeek = {
        distance: dist,
        startDoy: Math.max(0, w * 7 - j1),
        endDoy: Math.min(totalDays - 1, w * 7 - j1 + 6),
        runs: weekRuns.get(w) ?? 0,
      };
    }
  }
  const weeksInPeriod = weekIndex(year, endDoy) + 1;

  // ---- Meses, días de la semana, horas ----
  const months = Array.from({ length: 12 }, () => ({ distance: 0, runs: 0, moving: 0 }));
  const weekdays = new Array(7).fill(0);
  const hours = new Array(24).fill(0);
  const tod: Record<TimeOfDay, number> = { dawn: 0, morning: 0, midday: 0, afternoon: 0, evening: 0, night: 0 };
  let early = 0, weekend = 0;
  let earliest: WrappedStats['earliest'] = null;
  let latest: WrappedStats['latest'] = null;
  for (const r of runs) {
    const m = months[r.local.mo - 1];
    m.distance += r.csv.distance;
    m.runs++;
    m.moving += r.csv.moving;
    weekdays[r.local.dow]++;
    hours[r.local.h]++;
    tod[timeOfDayOf(r.local.h)]++;
    if (r.local.h >= 4 && r.local.h < 9) early++;
    if (r.local.dow >= 5) weekend++;
    const mins = r.local.h * 60 + r.local.mi;
    if (mins >= 240 && (!earliest || mins < earliest.minutes)) earliest = { minutes: mins, run: ref(r) };
    const lateKey = mins < 240 ? mins + 1440 : mins;
    if (!latest || lateKey > (latest.minutes < 240 ? latest.minutes + 1440 : latest.minutes)) latest = { minutes: mins, run: ref(r) };
  }
  const todKey = (Object.keys(tod) as TimeOfDay[]).reduce((a, b) => (tod[b] > tod[a] ? b : a), 'morning' as TimeOfDay);
  const n = runs.length || 1;

  // ---- El sol: ¿hora dorada de verdad, amanecer o noche cerrada? (solo carreras al aire libre) ----
  let sun: WrappedStats['sun'] = null;
  {
    let outdoor = 0, golden = 0, sunrise = 0, dark = 0, evening = 0, eveningGolden = 0, eveningDark = 0;
    for (const r of runs) {
      const st = r.track?.start;
      if (r.indoor || !st) continue;
      const dur = r.csv.moving > 0 ? r.csv.moving : r.csv.elapsed;
      const mid = r.startUtc + (Number.isFinite(dur) && dur > 0 ? Math.min(dur, 4 * 3600) : 0) * 500;
      const ph = sunPhase(mid, st[0], st[1]);
      outdoor++;
      if (ph === 'golden') golden++;
      else if (ph === 'sunrise') sunrise++;
      else if (ph === 'dark') dark++;
      if (timeOfDayOf(r.local.h) === 'evening') {
        evening++;
        if (ph === 'golden') eveningGolden++;
        else if (ph === 'dark') eveningDark++;
      }
    }
    if (outdoor > 0) sun = { outdoor, golden, sunrise, dark, evening, eveningGolden, eveningDark };
  }
  const habit = pickHabit(tod, todKey, runs.length, sun);

  // ---- Récords de actividad ----
  let longest: Activity | null = null, fastest: Activity | null = null, climb: Activity | null = null;
  const minFast = runs.some((r) => r.csv.distance >= 3000) ? 3000 : 1000;
  for (const r of runs) {
    if (!longest || r.csv.distance > longest.csv.distance) longest = r;
    const pace = r.csv.distance > 0 ? r.csv.moving / r.csv.distance : NaN;
    if (r.csv.distance >= minFast && pace >= 0.15 && (!fastest || pace < fastest.csv.moving / fastest.csv.distance)) fastest = r;
    if (finite(r.csv.elevGain) && r.csv.elevGain > 0 && (!climb || r.csv.elevGain > climb.csv.elevGain)) climb = r;
  }
  let highest: WrappedStats['highestPoint'] = null;
  for (const r of runs) {
    const h = finite(r.csv.elevHigh) ? r.csv.elevHigh : r.track && finite(r.track.altMax) ? r.track.altMax : NaN;
    if (finite(h) && h < 8900 && (!highest || h > highest.elevation)) highest = { elevation: h, run: ref(r) };
  }

  // ---- Mejores marcas ----
  const efforts: WrappedStats['efforts'] = [];
  for (const target of EFFORT_TARGETS) {
    let best: { time: number; run: Activity } | null = null;
    for (const r of runs) {
      const t = r.track?.efforts[String(target)];
      if (t != null && finite(t) && plausibleEffort(target, t) && (!best || t < best.time)) best = { time: t, run: r };
    }
    if (best) efforts.push({ target, time: best.time, run: ref(best.run) });
  }

  // ---- Evolución del ritmo ----
  let paceTrend: WrappedStats['paceTrend'] = null;
  const activeMonths = months.map((m, i) => ({ ...m, i })).filter((m) => m.runs >= 2 && m.distance > 3000);
  if (activeMonths.length >= 4) {
    const k = Math.min(3, Math.floor(activeMonths.length / 2));
    const agg = (ms: typeof activeMonths) => ms.reduce((s, m) => s + m.moving, 0) / ms.reduce((s, m) => s + m.distance, 0);
    paceTrend = { first: agg(activeMonths.slice(0, k)), last: agg(activeMonths.slice(-k)) };
  }

  // ---- Pulso ----
  let hr: WrappedStats['hr'] = null;
  let beats = 0, hrTime = 0, hrSum = 0, maxObs = 0;
  const hist = new Float64Array(256);
  for (const r of runs) {
    const avg = finite(r.csv.avgHr) ? r.csv.avgHr : r.track && finite(r.track.avgHr) ? r.track.avgHr : NaN;
    if (finite(avg) && avg > 40 && avg < 230) {
      beats += (avg * r.csv.moving) / 60;
      hrSum += avg * r.csv.moving;
      hrTime += r.csv.moving;
    }
    if (r.track?.hrHist) for (let b = 0; b < 256; b++) hist[b] += r.track.hrHist[b];
    const mx = r.track && finite(r.track.maxHr) ? r.track.maxHr : finite(r.csv.maxHr) ? r.csv.maxHr : NaN;
    if (finite(mx) && mx < 225 && mx > maxObs) maxObs = mx;
  }
  const hrRuns = runs.filter((r) => finite(r.csv.avgHr) || (r.track && finite(r.track.avgHr))).length;
  if (hrRuns >= Math.max(3, runs.length * 0.2) && hrTime > 0) {
    let zoneSeconds = 0;
    for (let b = 0; b < 256; b++) zoneSeconds += hist[b];
    // Máximo robusto a partir del histograma (percentil 99,7).
    let maxHr = maxObs > 0 ? maxObs : NaN;
    if (zoneSeconds > 600) {
      let acc = 0;
      for (let b = 255; b >= 0; b--) {
        acc += hist[b];
        if (acc >= zoneSeconds * 0.003) {
          maxHr = Math.max(b, Math.min(maxObs || b, b + 6));
          break;
        }
      }
    }
    const pct = [0, 0.6, 0.7, 0.8, 0.9, 10];
    const zones = [];
    for (let z = 0; z < 5 && Number.isFinite(maxHr); z++) {
      const lo = Math.round(maxHr * pct[z]);
      const hi = z === 4 ? Math.round(maxHr) : Math.round(maxHr * pct[z + 1]) - 1;
      let s = 0;
      for (let b = 0; b < 256; b++) {
        const inZone = z === 0 ? b < Math.round(maxHr * 0.6) : z === 4 ? b >= Math.round(maxHr * 0.9) : b >= lo && b <= hi;
        if (inZone) s += hist[b];
      }
      zones.push({ lo, hi, seconds: s });
    }
    // Sin histograma (solo medias del CSV) no hay zonas que enseñar.
    if (!zones.length) zoneSeconds = 0;
    hr = { avg: hrSum / hrTime, max: maxHr, beats, zones, zoneSeconds };
  }

  // ---- Zapatillas ----
  const shoeMap = new Map<string, { name: string; distance: number; runs: number; lifetime: number; months: number[] }>();
  for (const r of runs) {
    const g = r.csv.gear;
    if (!g) continue;
    const s = shoeMap.get(g) ?? { name: g, distance: 0, runs: 0, lifetime: input.gearLifetime?.[g] ?? 0, months: new Array(12).fill(0) };
    s.months[r.local.mo - 1] += r.csv.distance;
    s.distance += r.csv.distance;
    s.runs++;
    shoeMap.set(g, s);
  }
  const shoes = [...shoeMap.values()].sort((a, b) => b.distance - a.distance);
  for (const sh of shoes) sh.lifetime = Math.max(sh.lifetime, sh.distance);
  const gearDistance = shoes.reduce((a, b) => a + b.distance, 0);

  // ---- Ritmos de cada carrera (para la tira de ritmos cuando no hay evolución por meses) ----
  const paceSamples: WrappedStats['paceSamples'] = [];
  for (const r of runs) {
    const pace = r.csv.distance > 0 ? r.csv.moving / r.csv.distance : NaN;
    if (r.csv.distance >= 1000 && pace >= 0.15 && pace <= 1.2) paceSamples.push({ pace, distance: r.csv.distance });
  }

  // ---- Lugares ----
  const countryMap = new Map<string, { code: string; runs: number; distance: number }>();
  const cityMap = new Map<string, { name: string; cc: string; runs: number; distance: number }>();
  const placeMap = new Map<string, Place>();
  let indoorRuns = 0, gpsRuns = 0;
  for (const r of runs) {
    if (r.indoor || !r.track?.start) {
      indoorRuns++;
      continue;
    }
    gpsRuns++;
    const [la, lo] = r.track.start;
    if (r.country) {
      const c = countryMap.get(r.country) ?? { code: r.country, runs: 0, distance: 0 };
      c.runs++;
      c.distance += r.csv.distance;
      countryMap.set(r.country, c);
    }
    if (r.city) {
      const k = `${r.city.name}|${r.city.cc}`;
      const c = cityMap.get(k) ?? { name: localCityName(r.city.name, input.lang), cc: r.city.cc, runs: 0, distance: 0 };
      c.runs++;
      c.distance += r.csv.distance;
      cityMap.set(k, c);
    }
    const pk = `${Math.round(la * 20)},${Math.round(lo * 20)}`;
    const p = placeMap.get(pk) ?? { lat: la, lon: lo, runs: 0, country: r.country };
    p.runs++;
    placeMap.set(pk, p);
  }
  const countries = [...countryMap.values()].sort((a, b) => b.runs - a.runs || b.distance - a.distance);
  const cities = [...cityMap.values()].sort((a, b) => b.runs - a.runs || b.distance - a.distance);
  const places = [...placeMap.values()];

  // ---- Zona principal (mapa de calor) ----
  let home: WrappedStats['home'] = null;
  const gpsActs = runs.filter((r) => r.track?.start && r.track.track);
  if (gpsActs.length) {
    const cells = new Map<string, Activity[]>();
    for (const r of gpsActs) {
      const [la, lo] = r.track!.start!;
      const k = `${Math.round(la * 5)},${Math.round(lo * 5)}`;
      const arr = cells.get(k) ?? [];
      arr.push(r);
      cells.set(k, arr);
    }
    let bestCell: Activity[] = [];
    for (const arr of cells.values()) if (arr.length > bestCell.length) bestCell = arr;
    const cLat = median(bestCell.map((r) => r.track!.start![0]));
    const cLon = median(bestCell.map((r) => r.track!.start![1]));
    const members = gpsActs.filter((r) => distKm(cLat, cLon, r.track!.start![0], r.track!.start![1]) < 30);
    const tracks: Float32Array[] = [];
    let dist = 0;
    for (const r of members) {
      const t = trimTrack(r.track!.track!, r.track!.trackCum, trimMeters, zones);
      if (t) tracks.push(t);
      dist += r.csv.distance;
    }
    const cityVotes = new Map<string, { n: number; name: string; cc: string }>();
    for (const r of members) {
      if (!r.city) continue;
      const k = r.city.name + '|' + r.city.cc;
      const v = cityVotes.get(k) ?? { n: 0, name: r.city.name, cc: r.city.cc };
      v.n++;
      cityVotes.set(k, v);
    }
    const top = [...cityVotes.values()].sort((a, b) => b.n - a.n)[0];
    home = { lat: cLat, lon: cLon, name: top ? localCityName(top.name, input.lang) : null, cc: top?.cc ?? members[0]?.country ?? null, runs: members.length, distance: dist, tracks };
  }
  const routes: WrappedStats['routes'] = [];
  for (const r of gpsActs) {
    const t = trimTrack(r.track!.track!, r.track!.trackCum, trimMeters, zones);
    if (t && t.length >= 8) routes.push({ id: r.id, track: t, distance: r.csv.distance });
  }

  // ---- Pasos, calorías, temperatura ----
  let stepsMeasured = 0, stepsDist = 0, distNoSteps = 0;
  for (const r of runs) {
    const s = finite(r.csv.steps) && r.csv.steps > 0 ? r.csv.steps : r.track && finite(r.track.steps) ? r.track.steps : NaN;
    if (finite(s)) {
      stepsMeasured += s;
      stepsDist += r.csv.distance;
    } else distNoSteps += r.csv.distance;
  }
  let steps: number | null = null;
  if (stepsDist > 0 || distance > 0) {
    const stride = stepsDist > 2000 && stepsMeasured > 0 ? stepsDist / stepsMeasured : 1.05;
    steps = stepsMeasured + distNoSteps / Math.min(1.6, Math.max(0.7, stride));
  }
  let calories: number | null = null;
  const calRuns = runs.filter((r) => finite(r.csv.calories) && r.csv.calories > 0);
  if (calRuns.length >= runs.length * 0.5 && calRuns.length > 0) {
    const sum = calRuns.reduce((s, r) => s + r.csv.calories, 0);
    const calDist = calRuns.reduce((s, r) => s + r.csv.distance, 0);
    calories = calDist > 0 ? sum * (distance / calDist) : sum;
  }
  let hottest: WrappedStats['hottest'] = null, coldest: WrappedStats['coldest'] = null;
  let tempRuns = 0;
  for (const r of runs) {
    const tAvg = r.track && finite(r.track.tempAvg) ? r.track.tempAvg : finite(r.csv.avgTemp) ? r.csv.avgTemp : NaN;
    if (!finite(tAvg)) continue;
    tempRuns++;
    if (!hottest || tAvg > hottest.temp) hottest = { temp: tAvg, run: ref(r) };
    if (!coldest || tAvg < coldest.temp) coldest = { temp: tAvg, run: ref(r) };
  }
  if (tempRuns < Math.max(3, runs.length * 0.25)) hottest = coldest = null;

  // ---- Carreras oficiales y fotos ----
  const races = runs.filter((r) => r.csv.race).map(ref);
  const photos: string[] = [];
  for (const r of runs) for (const m of r.csv.media) if (/\.(jpe?g|png|webp)$/i.test(m)) photos.push(m);

  // ---- Otros deportes ----
  const otherMap = new Map<string, { category: SportCategory; label: string; count: number; moving: number; distance: number }>();
  for (const o of input.others) {
    const key = o.category === 'other' ? `other:${o.csv.typeRaw}` : o.category;
    const e = otherMap.get(key) ?? { category: o.category, label: o.csv.typeRaw, count: 0, moving: 0, distance: 0 };
    e.count++;
    e.moving += o.csv.moving;
    e.distance += o.csv.distance;
    otherMap.set(key, e);
  }
  const others = [...otherMap.values()].sort((a, b) => b.moving - a.moving);

  // ---- Objetivo de distancia (goals.csv) ----
  let goal: WrappedStats['goal'] = null;
  const goals = (input.extras?.goals ?? []).filter((g) => g.kind === 'distance' && g.running && g.period).sort((a, b) => (b.startUtc || 0) - (a.startUtc || 0));
  const g0 = goals[0];
  if (g0 && g0.period) {
    const startDoy = Number.isFinite(g0.startUtc) && new Date(g0.startUtc).getUTCFullYear() === year ? localTimeOf(g0.startUtc, 0).doy : 0;
    if (Number.isFinite(g0.startUtc) && new Date(g0.startUtc).getUTCFullYear() > year) {
      /* objetivo posterior a este año */
    } else if (g0.period === 'week') {
      const firstW = weekIndex(year, startDoy);
      let hit = 0, total = 0;
      for (let w = firstW; w < weeksInPeriod; w++) {
        const ok = (weekDist.get(w) ?? 0) >= g0.value;
        // La semana actual, si aún no ha terminado y no está cumplida, no cuenta.
        if (w === weeksInPeriod - 1 && isPartialYear && periodEnd.dow < 6 && !ok) continue;
        total++;
        if (ok) hit++;
      }
      if (total > 0) goal = { period: 'week', target: g0.value, hit, total };
    } else if (g0.period === 'month') {
      const firstM = localTimeOf(Date.UTC(year, 0, 1) + startDoy * 86400000, 0).mo - 1;
      let hit = 0, total = 0;
      for (let m = firstM; m <= periodEnd.mo - 1; m++) {
        total++;
        if (months[m].distance >= g0.value) hit++;
      }
      if (total > 0) goal = { period: 'month', target: g0.value, hit, total };
    } else {
      goal = { period: 'year', target: g0.value, hit: distance, total: g0.value };
    }
  }

  const stats: WrappedStats = {
    year,
    name: input.name,
    lang: input.lang,
    isPartialYear,
    periodEnd,
    daysInPeriod,
    runs: runs.length,
    distance,
    moving,
    elapsed,
    elevation,
    activeDays,
    firstRunDoy: runs.length ? Math.min(...runs.map((r) => r.local.doy)) : 0,
    activeWeeks: weekDist.size,
    weeksInPeriod,
    avgPace: distance > 0 ? moving / distance : NaN,
    avgDistance: runs.length ? distance / runs.length : 0,
    longestRun: longest ? ref(longest) : null,
    fastestRun: fastest ? ref(fastest) : null,
    biggestClimb: climb ? ref(climb) : null,
    highestPoint: highest,
    months,
    bestMonth: argmax(months.map((m) => m.distance)),
    weekdays,
    favoriteWeekday: argmax(weekdays),
    hours,
    timeOfDay: todKey,
    timeOfDayShare: tod[todKey] / n,
    habit,
    sun,
    earlyShare: early / n,
    weekendShare: weekend / n,
    earliest,
    latest,
    daily,
    activeDayFlags,
    longestStreak: streak,
    bestWeek,
    efforts,
    paceTrend,
    hr,
    shoes,
    gearDistance,
    paceSamples,
    countries,
    indoorRuns,
    gpsRuns,
    cities,
    places,
    home,
    routes,
    steps,
    calories,
    hottest,
    coldest,
    races,
    photos,
    others,
    prev: input.prev,
    archetype: { key: 'allrounder', runnerUp: null },
    kudos: input.extras?.kudos ?? null,
    challenges: input.extras?.challenges ?? null,
    goal,
  };
  stats.archetype = pickArchetype(stats);
  return stats;
}

export function pickArchetype(s: WrappedStats): { key: ArchetypeKey; runnerUp: ArchetypeKey | null } {
  const scores: [ArchetypeKey, number][] = [];
  const kmPerRun = s.avgDistance / 1000;
  const elevPerKm = s.distance > 0 ? s.elevation / (s.distance / 1000) : 0;
  const nightShare = (s.hours.slice(20).reduce((a, b) => a + b, 0) + s.hours.slice(0, 4).reduce((a, b) => a + b, 0)) / Math.max(1, s.runs);
  const weekRatio = s.weeksInPeriod ? s.activeWeeks / s.weeksInPeriod : 0;
  const indoorShare = s.runs ? s.indoorRuns / s.runs : 0;

  if (s.earlyShare >= 0.45) scores.push(['earlybird', 0.5 + s.earlyShare]);
  if (nightShare >= 0.35) scores.push(['nightowl', 0.5 + nightShare * 1.1]);
  if (s.countries.length >= 3) scores.push(['globetrotter', 0.75 + 0.08 * s.countries.length]);
  else if (s.cities.length >= 8) scores.push(['globetrotter', 0.6 + 0.02 * s.cities.length]);
  if (elevPerKm >= 18 && s.runs >= 5) scores.push(['goat', 0.7 + Math.min(0.8, (elevPerKm - 18) / 30)]);
  if ((kmPerRun >= 11 || (s.longestRun && s.longestRun.distance >= 30000)) && s.runs >= 5) scores.push(['longhauler', 0.65 + Math.min(0.7, (kmPerRun - 9) / 12)]);
  if (s.avgPace > 0 && s.avgPace <= 0.29 && s.runs >= 5) scores.push(['speedster', 0.7 + Math.min(0.8, (0.29 - s.avgPace) * 6)]);
  if (weekRatio >= 0.85 && s.runs >= 40) scores.push(['metronome', 0.7 + (weekRatio - 0.85) * 3]);
  if (s.weekendShare >= 0.5 && s.runs >= 6) scores.push(['weekender', 0.45 + s.weekendShare]);
  if (indoorShare >= 0.4 && s.runs >= 6) scores.push(['treadmill', 0.5 + indoorShare]);
  scores.sort((a, b) => b[1] - a[1]);
  return { key: scores[0]?.[0] ?? 'allrounder', runnerUp: scores[1]?.[0] ?? null };
}

/**
 * La "hora" de cada runner: franja horaria dominante o, si de verdad corres con el sol cayendo
 * (o saliendo), la hora dorada calculada con la posición real del sol. Si ninguna franja manda,
 * "sin horario".
 */
export function pickHabit(
  tod: Record<TimeOfDay, number>,
  todKey: TimeOfDay,
  runs: number,
  sun: WrappedStats['sun'],
): { key: HabitKey; share: number } {
  const n = Math.max(1, runs);
  const topShare = tod[todKey] / n;
  const sunOk = !!sun && sun.outdoor >= Math.max(4, runs * 0.5);
  if (sun && sunOk) {
    const g = sun.golden / n;
    const sr = sun.sunrise / n;
    if (g >= 0.3 && g >= topShare * 0.75 && g >= sr) return { key: 'golden', share: g };
    if (sr >= 0.3 && sr >= topShare * 0.75) return { key: 'sunrise', share: sr };
  }
  if (topShare < 0.34) return { key: 'anytime', share: topShare };
  // De 19 a 22 h: según el sol de cada carrera, hora dorada, de noche o "entre dos luces".
  if (todKey === 'evening' && sun && sunOk && sun.evening >= 4) {
    const g = sun.eveningGolden / sun.evening;
    const d = sun.eveningDark / sun.evening;
    if (g >= 0.6) return { key: 'golden', share: sun.golden / n };
    if (g >= 0.2 && d >= 0.2) return { key: 'twilight', share: topShare };
  }
  return { key: todKey, share: topShare };
}
