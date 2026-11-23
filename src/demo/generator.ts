/**
 * Atleta sintético para la demo y para generar exports de prueba. Determinista (semilla fija).
 * Construye una ciudad ficticia con calles en cuadrícula, un río, parques y una pista, y genera
 * ~180 carreras realistas a lo largo del año (más viajes, un maratón y un trail).
 */
import { rng } from '../render/anim';

export interface SynthPoint {
  t: number; // s Unix
  lat: number;
  lon: number;
  alt: number;
  hr: number;
  cad: number; // rpm (una pierna), como en FIT
}

export interface SynthPlace {
  name: { es: string; en: string };
  cc: string;
  lat: number;
  lon: number;
  pop: number;
}

export interface SynthRun {
  id: string;
  name: { es: string; en: string };
  startUtc: number; // ms
  offsetMin: number;
  distance: number;
  moving: number;
  elapsed: number;
  elevGain: number;
  elevHigh: number;
  avgHr: number;
  maxHr: number;
  calories: number;
  gear: string;
  race: boolean;
  trail: boolean;
  place: SynthPlace;
  points: SynthPoint[] | null;
}

export interface SynthOther {
  id: string;
  typeRaw: { es: string; en: string };
  category: 'ride' | 'swim' | 'weights' | 'yoga' | 'hike';
  startUtc: number;
  offsetMin: number;
  distance: number;
  moving: number;
}

type V = [number, number];

const MADRID: SynthPlace = { name: { es: 'Madrid', en: 'Madrid' }, cc: 'ES', lat: 40.4168, lon: -3.7038, pop: 3255 };
const SEVILLA: SynthPlace = { name: { es: 'Sevilla', en: 'Seville' }, cc: 'ES', lat: 37.3891, lon: -5.9845, pop: 684 };
const LISBOA: SynthPlace = { name: { es: 'Lisboa', en: 'Lisbon' }, cc: 'PT', lat: 38.7223, lon: -9.1393, pop: 517 };
const LONDRES: SynthPlace = { name: { es: 'Londres', en: 'London' }, cc: 'GB', lat: 51.5074, lon: -0.1278, pop: 8961 };
const CANILLO: SynthPlace = { name: { es: 'Canillo', en: 'Canillo' }, cc: 'AD', lat: 42.5676, lon: 1.5977, pop: 4 };
const CERCEDILLA: SynthPlace = { name: { es: 'Cercedilla', en: 'Cercedilla' }, cc: 'ES', lat: 40.7409, lon: -4.0567, pop: 7 };

/** Ciudad ficticia en metros (x este, y norte) alrededor de un centro. */
class CityModel {
  readonly theta: number;
  readonly spacing: number;
  private jitter = new Map<string, number>();
  readonly river: V[];
  readonly park: V[];
  readonly bigLoop: V[];
  readonly track: V[];
  readonly home: V;
  constructor(
    private r: () => number,
    readonly place: SynthPlace,
    opts: { theta?: number; spacing?: number; home?: V } = {},
  ) {
    this.theta = opts.theta ?? 0.21;
    this.spacing = opts.spacing ?? 190;
    this.home = opts.home ?? [350, -950];
    // Río: curva suave de oeste a sureste.
    this.river = [];
    for (let x = -7000; x <= 7000; x += 60) {
      const y = 1800 - x * 0.35 + 420 * Math.sin(x / 1300) + 160 * Math.sin(x / 470);
      this.river.push([x, y]);
    }
    // Parque al este (rectángulo redondeado ~4 km de perímetro).
    this.park = roundedRect([1650, 250], 1250, 820, 220, 40);
    // Gran parque al oeste: bucle irregular de ~9 km.
    this.bigLoop = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      const rad = 1400 + 260 * Math.sin(3 * a + 0.7) + 140 * Math.cos(5 * a);
      this.bigLoop.push([-4300 + rad * Math.cos(a), 700 + rad * 0.82 * Math.sin(a)]);
    }
    // Pista de atletismo (óvalo de 400 m).
    this.track = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      this.track.push([-900 + 58 * Math.cos(a) + (Math.cos(a) > 0 ? 42 : -42), -1650 + 36.5 * Math.sin(a)]);
    }
  }

  private lineJitter(axis: string, i: number): number {
    const k = `${axis}${i}`;
    let j = this.jitter.get(k);
    if (j == null) {
      j = (this.r() - 0.5) * 30;
      this.jitter.set(k, j);
    }
    return j;
  }

  private toUV([x, y]: V): V {
    const c = Math.cos(this.theta), s = Math.sin(this.theta);
    return [x * c + y * s, -x * s + y * c];
  }
  private fromUV([u, v]: V): V {
    const c = Math.cos(this.theta), s = Math.sin(this.theta);
    return [u * c - v * s, u * s + v * c];
  }

  /** Camino por calles (en L o en Z) entre dos puntos. */
  street(a: V, b: V): V[] {
    const sp = this.spacing;
    const [ua, va] = this.toUV(a);
    const [ub, vb] = this.toUV(b);
    const out: V[] = [a];
    const uLine = (u: number) => Math.round(u / sp);
    const vLine = (v: number) => Math.round(v / sp);
    const snapU = (u: number) => uLine(u) * sp + this.lineJitter('u', uLine(u));
    const snapV = (v: number) => vLine(v) * sp + this.lineJitter('v', vLine(v));
    const zig = this.r() < 0.5;
    const ua2 = snapU(ua), va2 = snapV(va), ub2 = snapU(ub), vb2 = snapV(vb);
    out.push(this.fromUV([ua2, va]));
    out.push(this.fromUV([ua2, va2]));
    if (zig) {
      const vm = snapV((va2 + vb2) / 2 + (this.r() - 0.5) * 600);
      out.push(this.fromUV([ua2, vm]), this.fromUV([ub2, vm]), this.fromUV([ub2, vb2]));
    } else {
      const um = snapU((ua2 + ub2) / 2 + (this.r() - 0.5) * 600);
      out.push(this.fromUV([um, va2]), this.fromUV([um, vb2]), this.fromUV([ub2, vb2]));
    }
    out.push(this.fromUV([ub2, vb]), b);
    return dedupe(out);
  }

  /** Paseo aleatorio por la cuadrícula con inercia y atracción a casa. */
  wander(from: V, meters: number): V[] {
    const sp = this.spacing;
    let [u, v] = this.toUV(from);
    u = Math.round(u / sp) * sp;
    v = Math.round(v / sp) * sp;
    const out: V[] = [from, this.fromUV([u, v])];
    let dir = Math.floor(this.r() * 4);
    let walked = 0;
    const [hu, hv] = this.toUV(this.home);
    while (walked < meters) {
      if (this.r() < 0.35) dir = (dir + (this.r() < 0.5 ? 1 : 3)) % 4;
      // Vuelta a casa en la segunda mitad.
      if (walked > meters * 0.5 && this.r() < 0.5) {
        const du = hu - u, dv = hv - v;
        dir = Math.abs(du) > Math.abs(dv) ? (du > 0 ? 0 : 2) : dv > 0 ? 1 : 3;
      }
      const steps = 1 + Math.floor(this.r() * 4);
      for (let k = 0; k < steps; k++) {
        if (dir === 0) u += sp;
        else if (dir === 1) v += sp;
        else if (dir === 2) u -= sp;
        else v -= sp;
        walked += sp;
      }
      const uj = u + this.lineJitter('u', Math.round(u / sp));
      const vj = v + this.lineJitter('v', Math.round(v / sp));
      out.push(this.fromUV([uj, vj]));
    }
    return dedupe(out);
  }

  nearestOn(path: V[], p: V): number {
    let bi = 0, bd = Infinity;
    path.forEach((q, i) => {
      const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
      if (d < bd) {
        bd = d;
        bi = i;
      }
    });
    return bi;
  }

  terrain([x, y]: V): number {
    const hill = 95 * Math.exp(-((x + 4300) ** 2 + (y - 700) ** 2) / (2 * 1500 ** 2));
    return 655 + 22 * Math.sin(x / 2300) + 16 * Math.cos(y / 1700) + hill - 0.004 * (y - 1800 + x * 0.35);
  }

  toLatLon([x, y]: V): [number, number] {
    const lat = this.place.lat + y / 110574;
    const lon = this.place.lon + x / (111320 * Math.cos((this.place.lat * Math.PI) / 180));
    return [lat, lon];
  }
}

function roundedRect(c: V, w: number, h: number, r: number, step: number): V[] {
  const pts: V[] = [];
  const hw = w / 2 - r, hh = h / 2 - r;
  const corners: [number, number, number][] = [
    [c[0] + hw, c[1] + hh, 0],
    [c[0] - hw, c[1] + hh, Math.PI / 2],
    [c[0] - hw, c[1] - hh, Math.PI],
    [c[0] + hw, c[1] - hh, (3 * Math.PI) / 2],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let k = 0; k <= 6; k++) {
      const a = a0 + (k / 6) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  pts.push(pts[0]);
  return densify(pts, step);
}

function densify(pts: V[], step: number): V[] {
  const out: V[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(d / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

function dedupe(pts: V[]): V[] {
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 1);
}

function length(pts: V[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return d;
}

function offsetPath(pts: V[], off: number): V[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = Math.hypot(dx, dy) || 1;
    return [p[0] - (dy / L) * off, p[1] + (dx / L) * off] as V;
  });
}

type Kind = 'easy' | 'long' | 'tempo' | 'intervals' | 'recovery' | 'race' | 'trail';

interface RunPlan {
  kind: Kind;
  km: number;
  pace: number; // s/km
}

/** Muestrea la ruta a intervalos de tiempo y genera pulso, cadencia y altitud. */
function sample(city: CityModel, path: V[], plan: RunPlan, startUtcS: number, r: () => number, altFn?: (p: V, frac: number) => number): SynthPoint[] {
  const dense = densify(path, 4);
  const cum: number[] = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = cum[cum.length - 1];
  const pts: SynthPoint[] = [];
  let d = 0, t = startUtcS, j = 0;
  const easySpeed = 1000 / plan.pace;
  const dt = 5;
  let hrDrift = 0;
  while (d <= total) {
    while (j < cum.length - 2 && cum[j + 1] < d) j++;
    const f = cum[j + 1] > cum[j] ? (d - cum[j]) / (cum[j + 1] - cum[j]) : 0;
    const x = dense[j][0] + (dense[j + 1]?.[0] - dense[j][0] || 0) * f;
    const y = dense[j][1] + (dense[j + 1]?.[1] - dense[j][1] || 0) * f;
    let speed = easySpeed * (0.96 + r() * 0.08);
    let effort = 0;
    if (plan.kind === 'intervals') {
      const phase = Math.floor(d / 400) % 2;
      const onTrack = d > total * 0.2 && d < total * 0.85;
      if (onTrack && phase === 0) {
        speed = 1000 / (plan.pace - 75);
        effort = 1;
      } else if (onTrack) speed = 1000 / (plan.pace + 40);
    } else if (plan.kind === 'tempo' && d > total * 0.15 && d < total * 0.85) {
      speed = 1000 / (plan.pace - 35);
      effort = 0.7;
    } else if (plan.kind === 'race') effort = 0.85;
    const alt = altFn ? altFn([x, y], d / total) : city.terrain([x, y]);
    const [lat, lon] = city.toLatLon([x + (r() - 0.5) * 5, y + (r() - 0.5) * 5]);
    hrDrift += dt * 0.0022;
    const base = plan.kind === 'race' ? 164 : plan.kind === 'trail' ? 154 : plan.kind === 'recovery' ? 128 : 137;
    const hrTarget = base + effort * 22 + hrDrift + (speed - easySpeed) * 9;
    const prevHr = pts.length ? pts[pts.length - 1].hr : base - 25;
    const hr = Math.round(Math.min(191, prevHr + (hrTarget - prevHr) * 0.25 + (r() - 0.5) * 2));
    const cad = Math.round((80 + (speed - 2.6) * 7 + (r() - 0.5) * 2) * 10) / 10;
    pts.push({ t: Math.round(t), lat, lon, alt: Math.round(alt * 10) / 10, hr, cad });
    d += speed * dt;
    t += dt;
  }
  return pts;
}

function summarizeSynth(points: SynthPoint[]): { distance: number; moving: number; gain: number; high: number; avgHr: number; maxHr: number } {
  let distance = 0, gain = 0, high = -Infinity, hrSum = 0, maxHr = 0;
  let smooth = points[0].alt;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const dLat = (b.lat - a.lat) * 110574;
    const dLon = (b.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180);
    distance += Math.hypot(dLat, dLon);
    const ns = smooth * 0.7 + b.alt * 0.3;
    if (ns > smooth) gain += ns - smooth;
    smooth = ns;
  }
  for (const p of points) {
    high = Math.max(high, p.alt);
    hrSum += p.hr;
    maxHr = Math.max(maxHr, p.hr);
  }
  const moving = points[points.length - 1].t - points[0].t;
  return { distance, moving, gain, high, avgHr: hrSum / points.length, maxHr };
}

const DAY = 86400000;

export interface Athlete {
  name: string;
  runs: SynthRun[];
  others: SynthOther[];
  exportDate: number;
}

export function generateAthlete(seed = 20261121, year = 2026, endUtc = Date.UTC(2026, 10, 21, 20)): Athlete {
  const r = rng(seed);
  const madrid = new CityModel(r, MADRID);
  const runs: SynthRun[] = [];
  const others: SynthOther[] = [];
  let id = 15000000000;
  const nextId = () => String((id += 1 + Math.floor(r() * 9000000)));
  const offsetFor = (ms: number) => {
    // Horario de verano en España: último domingo de marzo a último domingo de octubre.
    const d = new Date(ms);
    const m = d.getUTCMonth();
    const summer = (m > 2 && m < 9) || (m === 2 && d.getUTCDate() >= 29) || (m === 9 && d.getUTCDate() < 25);
    return summer ? 120 : 60;
  };

  const special = new Map<string, () => SynthRun>();
  const key = (mo: number, d: number) => `${mo}-${d}`;

  const makeRun = (city: CityModel, path: V[], plan: RunPlan, localStartMs: number, offsetMin: number, name: { es: string; en: string }, gear: string, extra: Partial<SynthRun> = {}, altFn?: (p: V, frac: number) => number): SynthRun => {
    const startUtc = localStartMs - offsetMin * 60000;
    const points = sample(city, path, plan, startUtc / 1000, r, altFn);
    const s = summarizeSynth(points);
    return {
      id: nextId(),
      name,
      startUtc,
      offsetMin,
      distance: Math.round(s.distance * 10) / 10,
      moving: s.moving,
      elapsed: s.moving + Math.round(r() * 120),
      elevGain: Math.round(s.gain * 10) / 10,
      elevHigh: s.high,
      avgHr: Math.round(s.avgHr),
      maxHr: s.maxHr,
      calories: Math.round(s.distance / 1000 * 63),
      gear,
      race: false,
      trail: false,
      place: city.place,
      points,
      ...extra,
    };
  };

  // ---- Carreras especiales ----
  // Maratón de Sevilla (22 feb): bucle callejero de ~42 km.
  special.set(key(2, 22), () => {
    const sev = new CityModel(r, SEVILLA, { theta: -0.1, spacing: 210, home: [0, 0] });
    const way: V[] = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.3;
      const rad = 4600 + 900 * Math.sin(2 * a) + 500 * Math.cos(3 * a);
      way.push([rad * Math.cos(a) * 1.1, rad * Math.sin(a) * 0.85]);
    }
    let path: V[] = [];
    for (let i = 1; i < way.length; i++) path = path.concat(sev.street(way[i - 1], way[i]));
    // Ajusta a 42,2 km escalando respecto al centro.
    const k = 42350 / length(path);
    const p2 = path.map(([x, y]) => [x * k, y * k] as V);
    return makeRun(sev, p2, { kind: 'race', km: 42.2, pace: 318 }, Date.UTC(year, 1, 22, 8, 30), 60, { es: 'Maratón de Sevilla 🏅', en: 'Seville Marathon 🏅' }, 'Nike Vaporfly 3', { race: true }, (p) => 12 + 6 * Math.sin(p[0] / 1800));
  });
  // Medio maratón (26 abr) en Madrid.
  special.set(key(4, 26), () => {
    const start: V = [-300, 600];
    let path = madrid.street(start, [3200, 1400]);
    path = path.concat(madrid.street([3200, 1400], [2600, -2800]), madrid.street([2600, -2800], [-1800, -2200]), madrid.street([-1800, -2200], start));
    const k = 21250 / length(path);
    path = path.map(([x, y]) => [x * k, y * k] as V);
    return makeRun(madrid, path, { kind: 'race', km: 21.1, pace: 286 }, Date.UTC(year, 3, 26, 9, 0), 120, { es: 'Medio Maratón de Madrid', en: 'Madrid Half Marathon' }, 'Nike Vaporfly 3', { race: true });
  });
  // Trail en la sierra (13 jun): mucho desnivel.
  special.set(key(6, 13), () => {
    const sierra = new CityModel(r, CERCEDILLA, { home: [0, 0] });
    const path: V[] = [];
    let x = 0, y = 0, a = 0.4;
    for (let i = 0; i < 420; i++) {
      a += (r() - 0.5) * 0.5 + Math.sin(i / 40) * 0.08;
      x += 60 * Math.cos(a);
      y += 60 * Math.sin(a) + (i < 210 ? 18 : -18);
      path.push([x, y]);
    }
    return makeRun(sierra, path, { kind: 'trail', km: 25, pace: 470 }, Date.UTC(year, 5, 13, 8, 0), 120, { es: 'Trail Sierra de Guadarrama', en: 'Guadarrama Mountain Trail' }, 'Salomon Speedcross 6', { race: true, trail: true }, (_p, frac) => 1180 + 950 * Math.sin(Math.min(1, frac * 1.15) * Math.PI) ** 1.4 + 40 * Math.sin(frac * 40));
  });

  // ---- Viajes ----
  const trips: { mo: number; d: number; place: SynthPlace; km: number; hill?: number; name: { es: string; en: string } }[] = [
    { mo: 5, d: 1, place: LISBOA, km: 9, name: { es: 'Lisboa junto al Tajo', en: 'Lisbon riverside' } },
    { mo: 5, d: 2, place: LISBOA, km: 12, name: { es: 'Lisboa al amanecer', en: 'Lisbon sunrise run' } },
    { mo: 5, d: 3, place: LISBOA, km: 7, name: { es: 'Últimos km en Lisboa', en: 'Last miles in Lisbon' } },
    { mo: 7, d: 18, place: CANILLO, km: 11, hill: 2150, name: { es: 'Andorra en altura', en: 'High altitude in Andorra' } },
    { mo: 7, d: 19, place: CANILLO, km: 14, hill: 2300, name: { es: 'Subida al lago', en: 'Up to the lake' } },
    { mo: 9, d: 26, place: LONDRES, km: 10, name: { es: 'Hyde Park', en: 'Hyde Park loop' } },
    { mo: 9, d: 27, place: LONDRES, km: 13, name: { es: 'A lo largo del Támesis', en: 'Along the Thames' } },
  ];
  for (const tr of trips) {
    special.set(key(tr.mo, tr.d), () => {
      const c = new CityModel(r, tr.place, { theta: r() * 0.6 - 0.3, home: [0, 0] });
      const start: V = [(r() - 0.5) * 400, (r() - 0.5) * 400];
      const i0 = c.nearestOn(c.river, start);
      const along = c.river.slice(i0, Math.min(c.river.length, i0 + Math.round((tr.km * 1000) / 2 / 60)));
      const path = c.street(start, along[0]).concat(along, offsetPath([...along].reverse(), 45), c.street(along[0], start));
      const offset = tr.place.cc === 'GB' ? 60 : tr.place.cc === 'PT' ? 60 : 120;
      const altFn = tr.hill ? (_p: V, frac: number) => tr.hill! + 260 * Math.sin(frac * Math.PI) : undefined;
      return makeRun(c, path, { kind: 'easy', km: tr.km, pace: tr.hill ? 395 : 330 }, Date.UTC(year, tr.mo - 1, tr.d, 8, 15), offset, tr.name, 'Adidas Adizero SL', {}, altFn);
    });
  }

  // ---- Plan semanal ----
  const endLocal = endUtc;
  for (let ms = Date.UTC(year, 0, 1); ms <= endLocal; ms += DAY) {
    const d = new Date(ms);
    const mo = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const dow = (d.getUTCDay() + 6) % 7; // 0 lunes
    const sp = special.get(key(mo, day));
    if (sp) {
      runs.push(sp());
      continue;
    }
    // Vacaciones (mitad de agosto) y una lesión leve (octubre).
    const vacation = mo === 8 && day >= 8 && day <= 22;
    const injury = mo === 10 && day >= 12 && day <= 18;
    const tripDay = trips.some((t) => t.mo === mo && Math.abs(t.d - day) <= 1);
    const season = 0.85 + 0.15 * Math.sin(((mo - 3) / 12) * Math.PI * 2);
    const gear = mo <= 6 ? 'Nike Pegasus 41' : 'Adidas Adizero SL';

    // Otros deportes
    if (!injury && !tripDay) {
      if (dow === 5 && mo >= 4 && mo <= 9 && r() < 0.75) {
        const hrs = 1.6 + r() * 1.8;
        others.push({ id: nextId(), typeRaw: { es: 'Bicicleta', en: 'Ride' }, category: 'ride', startUtc: ms + 8 * 3600000, offsetMin: 120, distance: Math.round(hrs * 26000), moving: Math.round(hrs * 3600) });
      }
      if ((dow === 0 || dow === 4) && r() < 0.42 && !vacation) {
        others.push({ id: nextId(), typeRaw: { es: 'Natación', en: 'Swim' }, category: 'swim', startUtc: ms + 19 * 3600000, offsetMin: offsetFor(ms), distance: 1500 + Math.round(r() * 1000), moving: 2100 + Math.round(r() * 900) });
      }
      if (dow === 2 && r() < 0.55 && !vacation) {
        others.push({ id: nextId(), typeRaw: { es: 'Entrenamiento con pesas', en: 'Weight Training' }, category: 'weights', startUtc: ms + 18 * 3600000, offsetMin: offsetFor(ms), distance: 0, moving: 2700 + Math.round(r() * 900) });
      }
      if (dow === 6 && r() < 0.22) {
        others.push({ id: nextId(), typeRaw: { es: 'Yoga', en: 'Yoga' }, category: 'yoga', startUtc: ms + 18 * 3600000, offsetMin: offsetFor(ms), distance: 0, moving: 3000 });
      }
    }
    if (vacation && (day === 10 || day === 15 || day === 20)) {
      others.push({ id: nextId(), typeRaw: { es: 'Excursión', en: 'Hike' }, category: 'hike', startUtc: ms + 8 * 3600000, offsetMin: 120, distance: 11000 + Math.round(r() * 5000), moving: 14400 });
    }
    if (injury || tripDay) continue;
    if (vacation && r() < 0.75) continue;

    let plan: RunPlan | null = null;
    let hour = 7, minute = Math.floor(r() * 50);
    if (dow === 1 && r() < 0.92) plan = { kind: 'easy', km: 7 + r() * 3, pace: 335 - season * 10 };
    else if (dow === 2 && r() < 0.88) plan = r() < 0.55 ? { kind: 'intervals', km: 10, pace: 330 } : { kind: 'tempo', km: 9 + r() * 3, pace: 330 };
    else if (dow === 3 && r() < 0.8) plan = { kind: 'easy', km: 6 + r() * 4, pace: 340 };
    else if (dow === 5 && r() < 0.35) {
      plan = { kind: 'recovery', km: 5 + r() * 2, pace: 360 };
      hour = 19;
    } else if (dow === 6 && r() < 0.9) {
      plan = { kind: 'long', km: (11 + r() * 5) * season + (mo === 2 ? 5 : 0), pace: 345 };
      hour = 8;
      minute = 20 + Math.floor(r() * 30);
    }
    if (!plan) continue;
    if (dow !== 5 && r() < 0.12) hour = 19 + Math.floor(r() * 2);

    const local = ms + hour * 3600000 + minute * 60000;
    const offset = offsetFor(local);
    const treadmill = (mo <= 2 || mo === 11) && plan.kind === 'easy' && r() < 0.28;
    if (treadmill) {
      const km = 6 + r() * 3;
      const moving = Math.round(km * 340);
      runs.push({
        id: nextId(), name: { es: 'Carrera en cinta', en: 'Treadmill run' }, startUtc: local - offset * 60000, offsetMin: offset,
        distance: Math.round(km * 1000), moving, elapsed: moving + 30, elevGain: 0, elevHigh: NaN, avgHr: 146, maxHr: 161,
        calories: Math.round(km * 63), gear, race: false, trail: false, place: MADRID, points: null,
      });
      continue;
    }

    // Ruta en la ciudad
    const home = madrid.home;
    let path: V[];
    const km = plan.km;
    const choice = r();
    if (plan.kind === 'intervals') {
      const tr = madrid.track;
      const laps: V[] = [];
      for (let l = 0; l < 12; l++) laps.push(...offsetPath(tr, (l % 3) * 1.2));
      path = madrid.street(home, tr[0]).concat(laps, madrid.street(tr[0], home));
    } else if (plan.kind === 'long' && choice < 0.55) {
      const bl = madrid.bigLoop;
      const i0 = madrid.nearestOn(bl, [-2800, 300]);
      const loop = bl.slice(i0).concat(bl.slice(0, i0 + 1));
      const i1 = madrid.nearestOn(madrid.river, home);
      const i2 = madrid.nearestOn(madrid.river, loop[0]);
      const riverSeg = i1 < i2 ? madrid.river.slice(i1, i2 + 1) : madrid.river.slice(i2, i1 + 1).reverse();
      path = madrid.street(home, riverSeg[0]).concat(riverSeg, madrid.street(riverSeg[riverSeg.length - 1], loop[0]), loop, madrid.street(loop[loop.length - 1], riverSeg[riverSeg.length - 1]), [...riverSeg].reverse(), madrid.street(riverSeg[0], home));
    } else if (choice < 0.38 || plan.kind === 'long') {
      // Río: ida por una orilla, vuelta por la otra.
      const i0 = madrid.nearestOn(madrid.river, home);
      const n = Math.round((km * 1000 * 0.34) / 60);
      const dir = r() < 0.5 ? 1 : -1;
      const seg = dir > 0 ? madrid.river.slice(i0, i0 + n) : madrid.river.slice(Math.max(0, i0 - n), i0 + 1).reverse();
      path = madrid.street(home, seg[0]).concat(seg, offsetPath([...seg].reverse(), 38), madrid.street(seg[0], home));
    } else if (choice < 0.72) {
      // Vueltas al parque.
      const pk = madrid.park;
      const entry = pk[Math.floor(r() * pk.length)];
      const ei = madrid.nearestOn(pk, entry);
      const lapsN = Math.max(1, Math.round((km * 1000 - 2 * Math.hypot(entry[0] - home[0], entry[1] - home[1])) / length(pk)));
      const laps: V[] = [];
      for (let l = 0; l < lapsN; l++) laps.push(...offsetPath(pk.slice(ei).concat(pk.slice(0, ei + 1)), (r() - 0.5) * 10));
      path = madrid.street(home, entry).concat(laps, madrid.street(entry, home));
    } else {
      path = madrid.wander(home, km * 1000 * 0.78);
      path.push(...madrid.street(path[path.length - 1], home));
    }
    const names: Record<Kind, { es: string; en: string }> = {
      easy: hour >= 19 ? { es: 'Carrera vespertina', en: 'Evening Run' } : { es: 'Carrera matutina', en: 'Morning Run' },
      recovery: { es: 'Rodaje suave', en: 'Easy shakeout' },
      long: { es: 'Tirada larga del domingo', en: 'Sunday long run' },
      tempo: { es: 'Tempo', en: 'Tempo run' },
      intervals: { es: 'Series 12×400', en: 'Track 12×400' },
      race: { es: 'Carrera', en: 'Race' },
      trail: { es: 'Trail', en: 'Trail' },
    };
    runs.push(makeRun(madrid, path, plan, local, offset, names[plan.kind], plan.kind === 'tempo' && r() < 0.4 ? 'Nike Vaporfly 3' : gear));
  }
  return { name: 'Lucía', runs, others, exportDate: endUtc };
}
