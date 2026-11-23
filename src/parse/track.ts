import type { DecodedTrack } from './decoded';

/** Distancias para las mejores marcas (m). */
export const EFFORT_TARGETS = [1000, 1609.344, 5000, 10000, 21097.5, 42195] as const;

/** Resumen ligero de una actividad con fichero (lo que viaja del worker al hilo principal). */
export interface TrackSummary {
  id: string;
  ok: boolean;
  error?: string;
  /** Inicio en UTC (ms). */
  startUtc: number | null;
  /** Hora local - UTC en minutos según el dispositivo (solo FIT). */
  localOffsetMin: number | null;
  sport: string | null;
  subSport: string | null;
  hasGps: boolean;
  start: [number, number] | null;
  end: [number, number] | null;
  /** Ruta simplificada para dibujar: [lat0, lon0, lat1, lon1, ...]. */
  track: Float32Array | null;
  /** Distancia acumulada (m) en cada punto de `track` (para recortar inicio/fin por privacidad). */
  trackCum: Float32Array | null;
  bbox: [number, number, number, number] | null;
  /** Mejores tiempos (s) por distancia objetivo (m) dentro de esta actividad. */
  efforts: Record<string, number>;
  /** Segundos pasados en cada pulsación (índice = ppm). */
  hrHist: Uint16Array | null;
  maxHr: number;
  avgHr: number;
  altMax: number;
  altMin: number;
  tempAvg: number;
  tempMin: number;
  tempMax: number;
  steps: number;
  gpsDistance: number;
}

const R = 6371008.8;
const toRad = Math.PI / 180;

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))));
  return sorted[i];
}

/** Douglas-Peucker iterativo sobre coordenadas proyectadas. Devuelve índices a conservar. */
export function simplifyIndices(xs: Float64Array, ys: Float64Array, tol: number): number[] {
  const n = xs.length;
  if (n <= 2) return Array.from({ length: n }, (_, i) => i);
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: number[] = [0, n - 1];
  const tol2 = tol * tol;
  while (stack.length) {
    const e = stack.pop()!;
    const s = stack.pop()!;
    if (e - s < 2) continue;
    const ax = xs[s], ay = ys[s], bx = xs[e], by = ys[e];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = s + 1; i < e; i++) {
      let px = xs[i] - ax, py = ys[i] - ay;
      let d2: number;
      if (len2 === 0) d2 = px * px + py * py;
      else {
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
        px -= t * dx;
        py -= t * dy;
        d2 = px * px + py * py;
      }
      if (d2 > maxD) {
        maxD = d2;
        idx = i;
      }
    }
    if (maxD > tol2) {
      keep[idx] = 1;
      stack.push(s, idx, idx, e);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(i);
  return out;
}

/** Mejor tiempo para cubrir `target` metros (ventana deslizante con interpolación). */
export function bestEffort(time: ArrayLike<number>, cum: ArrayLike<number>, target: number): number {
  const n = cum.length;
  if (n < 2 || cum[n - 1] - cum[0] < target * 0.999) return NaN;
  let best = Infinity;
  let i = 0;
  for (let j = 1; j < n; j++) {
    const endD = cum[j];
    const startD = endD - target;
    if (startD < cum[0]) continue;
    while (i + 1 < j && cum[i + 1] <= startD) i++;
    // cum[i] <= startD < cum[i+1]
    const d0 = cum[i], d1 = cum[i + 1];
    const t0 = time[i], t1 = time[i + 1];
    const f = d1 > d0 ? (startD - d0) / (d1 - d0) : 0;
    const tStart = t0 + (t1 - t0) * Math.max(0, Math.min(1, f));
    const dt = time[j] - tStart;
    if (dt > 0 && dt < best) best = dt;
  }
  return Number.isFinite(best) ? best : NaN;
}

export interface SummarizeOptions {
  id: string;
  /** Distancia oficial de Strava (m) para calibrar la distancia GPS. */
  csvDistance: number;
  /** Velocidad máxima plausible (m/s) para filtrar saltos de GPS. */
  maxSpeed?: number;
}

export function summarizeTrack(d: DecodedTrack, opts: SummarizeOptions): TrackSummary {
  const maxSpeed = opts.maxSpeed ?? 12;
  const n = d.time.length;
  const res: TrackSummary = {
    id: opts.id,
    ok: true,
    startUtc: d.startTime != null ? d.startTime * 1000 : null,
    localOffsetMin: d.localOffset != null ? Math.round(d.localOffset / 60) : null,
    sport: d.sport,
    subSport: d.subSport,
    hasGps: false,
    start: null,
    end: null,
    track: null,
    trackCum: null,
    bbox: null,
    efforts: {},
    hrHist: null,
    maxHr: NaN,
    avgHr: NaN,
    altMax: NaN,
    altMin: NaN,
    tempAvg: NaN,
    tempMin: NaN,
    tempMax: NaN,
    steps: NaN,
    gpsDistance: 0,
  };
  if (n === 0) return res;

  // Orden temporal (algunos ficheros traen puntos desordenados o sin hora).
  const idx: number[] = [];
  for (let i = 0; i < n; i++) if (Number.isFinite(d.time[i])) idx.push(i);
  let sorted = true;
  for (let k = 1; k < idx.length; k++) if (d.time[idx[k]] < d.time[idx[k - 1]]) { sorted = false; break; }
  if (!sorted) idx.sort((a, b) => d.time[a] - d.time[b]);
  if (res.startUtc == null && idx.length) res.startUtc = d.time[idx[0]] * 1000;

  // ---- GPS con filtro de saltos ----
  const gLat: number[] = [], gLon: number[] = [], gTime: number[] = [];
  const rejected: number[] = [];
  let lastLat = NaN, lastLon = NaN, lastT = NaN;
  for (const i of idx) {
    const la = d.lat[i], lo = d.lon[i];
    if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180 || (la === 0 && lo === 0)) continue;
    if (Number.isFinite(lastLat)) {
      const dist = haversine(lastLat, lastLon, la, lo);
      const dt = d.time[i] - lastT;
      if (dist > 5 && (dt <= 0 ? dist > 50 : dist / dt > maxSpeed)) {
        // Si lo malo era el ancla (primer punto con el GPS aún frío), varios puntos seguidos
        // "saltan" pero son coherentes entre sí: se descarta lo aceptado y se empieza de nuevo.
        rejected.push(i);
        if (rejected.length >= 4 && gLat.length <= 15) {
          const r0 = rejected[0], rN = rejected[rejected.length - 1];
          const span = haversine(d.lat[r0], d.lon[r0], d.lat[rN], d.lon[rN]);
          const spanT = Math.max(1, d.time[rN] - d.time[r0]);
          if (span / spanT <= maxSpeed) {
            gLat.length = gLon.length = gTime.length = 0;
            for (const k of rejected) {
              gLat.push(d.lat[k]);
              gLon.push(d.lon[k]);
              gTime.push(d.time[k]);
            }
            lastLat = d.lat[rN];
            lastLon = d.lon[rN];
            lastT = d.time[rN];
            rejected.length = 0;
          }
        }
        continue;
      }
    }
    rejected.length = 0;
    gLat.push(la);
    gLon.push(lo);
    gTime.push(d.time[i]);
    lastLat = la;
    lastLon = lo;
    lastT = d.time[i];
  }
  // También sin hora (rutas planificadas o GPX sin <time>).
  if (gLat.length === 0 && idx.length === 0) {
    for (let i = 0; i < n; i++) {
      const la = d.lat[i], lo = d.lon[i];
      if (Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0)) {
        gLat.push(la);
        gLon.push(lo);
        gTime.push(NaN);
      }
    }
  }

  const gN = gLat.length;
  const gCum = new Float64Array(gN);
  for (let k = 1; k < gN; k++) gCum[k] = gCum[k - 1] + haversine(gLat[k - 1], gLon[k - 1], gLat[k], gLon[k]);
  res.gpsDistance = gN ? gCum[gN - 1] : 0;

  if (gN >= 10) {
    let minLa = Infinity, maxLa = -Infinity, minLo = Infinity, maxLo = -Infinity;
    for (let k = 0; k < gN; k++) {
      if (gLat[k] < minLa) minLa = gLat[k];
      if (gLat[k] > maxLa) maxLa = gLat[k];
      if (gLon[k] < minLo) minLo = gLon[k];
      if (gLon[k] > maxLo) maxLo = gLon[k];
    }
    const diag = haversine(minLa, minLo, maxLa, maxLo);
    if (diag > 100) {
      res.hasGps = true;
      res.bbox = [minLa, minLo, maxLa, maxLo];
      res.start = [gLat[0], gLon[0]];
      res.end = [gLat[gN - 1], gLon[gN - 1]];
      // Proyección local en metros y simplificación (máx. ~1200 puntos).
      const lat0 = (minLa + maxLa) / 2;
      const kx = Math.cos(lat0 * toRad) * 111320;
      const xs = new Float64Array(gN), ys = new Float64Array(gN);
      for (let k = 0; k < gN; k++) {
        xs[k] = gLon[k] * kx;
        ys[k] = gLat[k] * 110574;
      }
      let tol = 3;
      let keep = simplifyIndices(xs, ys, tol);
      while (keep.length > 1200 && tol < 200) {
        tol *= 1.8;
        keep = simplifyIndices(xs, ys, tol);
      }
      const tr = new Float32Array(keep.length * 2);
      const tc = new Float32Array(keep.length);
      keep.forEach((k, j) => {
        tr[j * 2] = gLat[k];
        tr[j * 2 + 1] = gLon[k];
        tc[j] = gCum[k];
      });
      res.track = tr;
      res.trackCum = tc;
    }
  }

  // ---- Distancia acumulada para mejores marcas ----
  let effTime: number[] = [];
  let effCum: number[] = [];
  let devCount = 0;
  for (const i of idx) if (Number.isFinite(d.dist[i])) devCount++;
  if (idx.length > 10 && devCount > idx.length * 0.5) {
    let last = 0;
    for (const i of idx) {
      const v = d.dist[i];
      if (Number.isFinite(v) && v >= last) last = v;
      effTime.push(d.time[i]);
      effCum.push(last);
    }
  } else if (gN > 10 && Number.isFinite(gTime[0])) {
    effTime = gTime;
    effCum = Array.from(gCum);
  }
  if (effCum.length > 10) {
    const total = effCum[effCum.length - 1] - effCum[0];
    if (opts.csvDistance > 0 && total > 0) {
      const f = opts.csvDistance / total;
      if (f > 0.85 && f < 1.2) effCum = effCum.map((v) => v * f);
    }
    for (const target of EFFORT_TARGETS) {
      const t = bestEffort(effTime, effCum, target);
      // Descarta lo imposible (más rápido que ~2:20/km sostenido).
      if (Number.isFinite(t) && target / t < 7.2) res.efforts[String(target)] = t;
    }
  }

  // ---- Pulso ----
  const hist = new Float32Array(256);
  let hrSum = 0, hrW = 0;
  const hrVals: number[] = [];
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k];
    const hr = d.hr[i];
    if (!Number.isFinite(hr)) continue;
    const next = k + 1 < idx.length ? d.time[idx[k + 1]] : d.time[i] + 1;
    const dt = Math.max(0, Math.min(10, next - d.time[i]));
    const b = Math.round(hr);
    hist[b] += dt;
    hrSum += hr * dt;
    hrW += dt;
    hrVals.push(hr);
  }
  if (hrVals.length > 20 && hrW > 60) {
    hrVals.sort((a, b) => a - b);
    res.maxHr = percentile(hrVals, 0.998);
    res.avgHr = hrSum / hrW;
    const h16 = new Uint16Array(256);
    for (let b = 0; b < 256; b++) h16[b] = Math.min(65535, Math.round(hist[b]));
    res.hrHist = h16;
  }

  // ---- Altitud y temperatura ----
  const alts: number[] = [];
  const temps: number[] = [];
  for (const i of idx) {
    if (Number.isFinite(d.alt[i]) && d.alt[i] > -500 && d.alt[i] < 9000) alts.push(d.alt[i]);
    if (Number.isFinite(d.temp[i]) && d.temp[i] > -40 && d.temp[i] < 60) temps.push(d.temp[i]);
  }
  if (alts.length > 10) {
    alts.sort((a, b) => a - b);
    res.altMax = percentile(alts, 0.995);
    res.altMin = percentile(alts, 0.005);
  }
  if (temps.length > 10) {
    let s = 0;
    for (const t of temps) s += t;
    temps.sort((a, b) => a - b);
    res.tempAvg = s / temps.length;
    res.tempMin = percentile(temps, 0.02);
    res.tempMax = percentile(temps, 0.98);
  }

  // ---- Pasos (cadencia) ----
  const cads: number[] = [];
  for (const i of idx) if (Number.isFinite(d.cad[i]) && d.cad[i] > 20) cads.push(d.cad[i]);
  if (cads.length > 30) {
    const sortedC = [...cads].sort((a, b) => a - b);
    const med = percentile(sortedC, 0.5);
    const mult = med < 125 ? 2 : 1; // rpm de una pierna -> pasos/min
    let steps = 0;
    for (let k = 0; k < idx.length; k++) {
      const i = idx[k];
      const c = d.cad[i];
      if (!Number.isFinite(c) || c <= 20) continue;
      const next = k + 1 < idx.length ? d.time[idx[k + 1]] : d.time[i] + 1;
      const dt = Math.max(0, Math.min(10, next - d.time[i]));
      steps += (c * mult * dt) / 60;
    }
    if (steps > 50) res.steps = steps;
  }
  return res;
}
