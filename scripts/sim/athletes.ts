/**
 * Generador de atletas sintéticos MUY distintos entre sí para buscar fallos: desde quien corre una
 * vez al año hasta ultrafondistas, runners de cinta, viajeros por 25 países, gente que corre de
 * noche en Tromsø, en el antimeridiano (Fiyi), en el mar, con GPS con saltos, pulsómetros locos,
 * nombres con emojis o en japonés, años bisiestos, exports del 1 de enero…
 *
 * Produce lo mismo que daría el export real tras leerlo (filas del CSV + resumen de cada fichero),
 * para pasarlo por el MISMO código de la web (enrich → computeStats → tarjetas).
 */
import type { CsvActivity } from '../../src/parse/activitiesCsv';
import { classifySport } from '../../src/parse/sports';
import { emptyTrack, pushPoint, type DecodedTrack } from '../../src/parse/decoded';
import { summarizeTrack, type TrackSummary } from '../../src/parse/track';
import { emptyExtras, type Extras } from '../../src/parse/extras';
import { offsetMinutes, tzAt } from '../../src/geo/timezone';

// ------------------------------------------------------------------ azar con semilla
export class Rand {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    // mulberry32
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a: number, b: number) {
    return a + (b - a) * this.next();
  }
  int(a: number, b: number) {
    return Math.floor(this.range(a, b + 1));
  }
  chance(p: number) {
    return this.next() < p;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  normal(mean = 0, sd = 1) {
    const u = Math.max(1e-12, this.next()), v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  weighted<T extends string>(w: Record<T, number>): T {
    const entries = Object.entries(w) as [T, number][];
    const total = entries.reduce((a, [, v]) => a + v, 0);
    let x = this.next() * total;
    for (const [k, v] of entries) {
      x -= v;
      if (x <= 0) return k;
    }
    return entries[entries.length - 1][0];
  }
}

// ------------------------------------------------------------------ lugares
export interface SimPlace {
  key: string;
  lat: number;
  lon: number;
  alt: number;
  /** Temperatura media anual (°C) */
  temp: number;
}

const P = (key: string, lat: number, lon: number, alt: number, temp: number): SimPlace => ({ key, lat, lon, alt, temp });

export const PLACES: Record<string, SimPlace> = Object.fromEntries(
  [
    P('madrid', 40.4168, -3.7038, 650, 15), P('barcelona', 41.3874, 2.1686, 10, 17), P('vilanova', 41.2241, 1.7253, 10, 16),
    P('sevilla', 37.3891, -5.9845, 10, 19), P('bilbao', 43.263, -2.935, 20, 14), P('laspalmas', 28.1235, -15.4363, 10, 21),
    P('london', 51.5074, -0.1278, 20, 11), P('paris', 48.8566, 2.3522, 35, 12), P('berlin', 52.52, 13.405, 40, 10),
    P('oslo', 59.9139, 10.7522, 20, 6), P('tromso', 69.6496, 18.956, 20, 3), P('reykjavik', 64.1466, -21.9426, 20, 5),
    P('nyc', 40.7128, -74.006, 10, 13), P('sf', 37.7749, -122.4194, 30, 14), P('denver', 39.7392, -104.9903, 1600, 10),
    P('honolulu', 21.3069, -157.8583, 10, 25), P('anchorage', 61.2181, -149.9003, 30, 2), P('mexico', 19.4326, -99.1332, 2240, 17),
    P('bogota', 4.711, -74.0721, 2640, 14), P('lapaz', -16.4897, -68.1193, 3640, 9), P('quito', -0.1807, -78.4678, 2850, 14),
    P('saopaulo', -23.5505, -46.6333, 760, 20), P('buenosaires', -34.6037, -58.3816, 25, 18), P('ushuaia', -54.8019, -68.303, 20, 6),
    P('sydney', -33.8688, 151.2093, 20, 18), P('perth', -31.9505, 115.8605, 20, 19), P('auckland', -36.8485, 174.7633, 20, 15),
    P('tokyo', 35.6762, 139.6503, 40, 16), P('seoul', 37.5665, 126.978, 40, 13), P('beijing', 39.9042, 116.4074, 50, 13),
    P('hongkong', 22.3193, 114.1694, 20, 23), P('singapore', 1.3521, 103.8198, 15, 27), P('mumbai', 19.076, 72.8777, 10, 27),
    P('kathmandu', 27.7172, 85.324, 1400, 18), P('dubai', 25.2048, 55.2708, 10, 28), P('tehran', 35.6892, 51.389, 1200, 17),
    P('nairobi', -1.2921, 36.8219, 1795, 19), P('capetown', -33.9249, 18.4241, 20, 17), P('cairo', 30.0444, 31.2357, 25, 22),
    P('kiritimati', 1.87, -157.4, 5, 27), P('pagopago', -14.2756, -170.702, 10, 27), P('suva', -18.1248, 178.4501, 10, 25),
    P('taveuni', -16.79, 179.99, 30, 25), P('stjohns', 47.5615, -52.7126, 50, 5), P('yakutsk', 62.0355, 129.6755, 100, -9),
    P('deadsea', 31.559, 35.4732, -415, 25), P('sahara', 23.4, 9.0, 600, 30), P('atlantic', 30.0, -40.0, 0, 20),
    P('antarctica', -79.77, -83.26, 700, -20), P('chatham', -43.95, -176.56, 10, 11), P('chamonix', 45.9237, 6.8694, 1035, 7),
    P('zermatt', 46.0207, 7.7491, 1608, 4), P('flagstaff', 35.1983, -111.6513, 2100, 9), P('iten', 0.6703, 35.5081, 2400, 17),
    P('lisboa', 38.7223, -9.1393, 50, 17), P('roma', 41.9028, 12.4964, 30, 16), P('ams', 52.3676, 4.9041, 0, 10),
    P('marrakech', 31.6295, -7.9811, 470, 20), P('kohtao', 10.0956, 99.8404, 20, 28), P('bali', -8.6705, 115.2126, 20, 27),
    P('valencia', 39.4699, -0.3763, 15, 18), P('boston', 42.3601, -71.0589, 20, 11), P('chicago', 41.8781, -87.6298, 180, 10),
  ].map((p) => [p.key, p]),
);

// ------------------------------------------------------------------ especificación de un atleta
type Tod = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'mixed';
export interface Spec {
  id: string;
  seed: number;
  year: number;
  /** Fecha del export (ms UTC): con ella se sabe si el año está a medias. */
  exportDate: number;
  lang: 'es' | 'en';
  units: 'metric' | 'imperial';
  name: string;
  home: SimPlace;
  trips: { place: SimPlace; fromDoy: number; days: number }[];
  runsPerWeek: number;
  season: 'flat' | 'summer' | 'winter' | 'ramp' | 'lateStart' | 'earlyStop' | 'oneMonth' | 'oneDay' | 'everyDay';
  distKm: number;
  distSd: number;
  longRunKm: number;
  paceSecKm: number;
  paceSd: number;
  tod: Tod;
  weekendOnly: boolean;
  outdoorShare: number;
  hr: 'none' | 'csv' | 'stream' | 'glitch';
  temp: 'none' | 'some' | 'all';
  elev: 'flat' | 'rolling' | 'hilly' | 'mountain';
  gear: 'none' | 'one' | 'many' | 'partial' | 'weird' | 'tiny';
  names: 'default' | 'custom' | 'emoji' | 'cjk' | 'long';
  raceShare: number;
  othersPerWeek: number;
  otherTypes: string[];
  kudos: number;
  challenges: number;
  goal: null | { kind: 'week' | 'month' | 'year'; meters: number };
  zones: number;
  prevFactor: number | null;
  glitchGps: boolean;
  zeroDistShare: number;
  bikesAsRuns: number;
  photos: number;
  trim: boolean;
  cityMap: boolean;
  traits: string[];
}

export interface SimProfile {
  spec: Spec;
  activities: CsvActivity[];
  tracks: Map<string, TrackSummary>;
  extras: Extras;
}

// ------------------------------------------------------------------ textos
const RUN_TYPE = { es: 'Carrera', en: 'Run' };
const TRAIL_TYPE = { es: 'Carrera por montaña', en: 'Trail Run' };
const VIRTUAL_TYPE = { es: 'Carrera virtual', en: 'Virtual Run' };
const OTHER_TYPES = {
  es: ['Bicicleta', 'Natación', 'Caminata', 'Excursión', 'Entrenamiento con pesas', 'Yoga', 'Entrenamiento', 'Remo', 'Esquí alpino', 'Escalada en roca', 'Pádel', 'Bicicleta eléctrica', 'Elíptica', 'Pilates', 'Surf', 'Fútbol', 'Patinaje en línea', 'Golf', 'Tenis', 'Kitesurf', 'Esquí de fondo', 'Bicicleta de montaña', 'Senderismo nórdico con raquetas de nieve'],
  en: ['Ride', 'Swim', 'Walk', 'Hike', 'Weight Training', 'Yoga', 'Workout', 'Rowing', 'Alpine Ski', 'Rock Climb', 'Padel', 'E-Bike Ride', 'Elliptical', 'Pilates', 'Surf', 'Soccer', 'Inline Skate', 'Golf', 'Tennis', 'Kitesurf', 'Nordic Ski', 'Mountain Bike Ride', 'High Intensity Interval Training'],
};
const DEFAULT_NAMES = {
  es: ['Carrera matutina', 'Carrera de mediodía', 'Carrera por la tarde', 'Carrera vespertina', 'Carrera nocturna'],
  en: ['Morning Run', 'Lunch Run', 'Afternoon Run', 'Evening Run', 'Night Run'],
};
const CUSTOM_NAMES = ['Rodaje suave', 'Series 6x1000', 'Tirada larga', 'Fartlek con el club', 'Recovery jog', 'Tempo 10K', 'Cuestas en el parque', 'Long run with the crew — 32K!!', 'Maratón de Valencia Trinidad Alfonso EDP', 'Behobia-San Sebastián', '"Entreno" de 5 km con comillas', 'Rodaje, con coma'];
const EMOJI_NAMES = ['Tirada larga 🏃‍♂️🔥', '🔥🔥🔥', '☀️ Morning miles ☀️', 'Lluvia 🌧️ y barro', '🇪🇸 Carrera popular 🇪🇸', '💪'];
const CJK_NAMES = ['皇居ラン', '早晨跑步', '한강 러닝', 'Пробежка по набережной', 'جري الصباح', 'Τρέξιμο στην Ακρόπολη'];
const LONG_NAMES = ['Rodaje regenerativo después de la carrera de montaña del fin de semana pasado por los caminos de siempre con el grupo del barrio', 'Un nombre larguísimo sin espacios: Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch'];
const SHOES = ['Nike Pegasus 41', 'ASICS Novablast 5', 'HOKA Clifton 9', 'Brooks Ghost 16', 'Adidas Adizero Adios Pro 3', 'Saucony Endorphin Speed 4', 'New Balance FuelCell SuperComp Elite v4', 'On Cloudmonster', 'Salomon Speedcross 6 GTX', 'Kiprun KD900X LD+'];
const WEIRD_SHOES = ['Saucony Endorphin Speed 4 (las rojas de competir) 🔴', 'Zapas viejas', '李宁 飞电 3', 'X', 'ZAPATILLAS DE TRAIL PARA DÍAS DE BARRO Y LLUVIA EXTREMA', '361° Flame'];
const NAMES = ['Àlex', 'María', 'Kilian', 'Jo', 'Maximiliano Alejan', 'Ana Belén', 'Seo-yeon', 'Zoë', "O'Connor", '陈', 'Ólafur', 'Siobhán', 'Łukasz', 'Ñ'];

// ------------------------------------------------------------------ fechas y husos
const DAY = 86400000;
const tzCache = new Map<string, string | null>();
function tzOf(p: SimPlace): string | null {
  if (!tzCache.has(p.key)) tzCache.set(p.key, tzAt(p.lat, p.lon));
  return tzCache.get(p.key)!;
}
function utcFromLocal(p: SimPlace, localMs: number): number {
  const tz = tzOf(p);
  let off = tz ? (offsetMinutes(tz, localMs) ?? 0) : Math.round(p.lon / 15) * 60;
  // Una segunda vuelta por si cruzamos un cambio de hora.
  if (tz) off = offsetMinutes(tz, localMs - off * 60000) ?? off;
  return localMs - off * 60000;
}
function daysIn(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

// ------------------------------------------------------------------ rutas
function metersToDeg(p: SimPlace, dx: number, dy: number): [number, number] {
  const lat = p.lat + dy / 111320;
  let lon = p.lon + dx / (111320 * Math.max(0.05, Math.cos((p.lat * Math.PI) / 180)));
  if (lon >= 180) lon -= 360;
  if (lon < -180) lon += 360;
  return [lat, lon];
}

interface RouteShape {
  kind: 'loop' | 'outback' | 'track';
  cx: number;
  cy: number;
  a1: number;
  a2: number;
  ph1: number;
  ph2: number;
  bearing: number;
}

function shapeFor(r: Rand): RouteShape {
  const kind = r.weighted({ loop: 6, outback: 3, track: 0.5 });
  return { kind, cx: r.normal(0, 1200), cy: r.normal(0, 1200), a1: r.range(0, 0.35), a2: r.range(0, 0.2), ph1: r.range(0, 6.28), ph2: r.range(0, 6.28), bearing: r.range(0, 6.28) };
}

/** Punto (m) de la ruta a una fracción f (0..1) del recorrido total `dist`. */
function routePoint(sh: RouteShape, f: number, dist: number): [number, number] {
  if (sh.kind === 'track') {
    // Óvalo de 400 m (vueltas).
    const lapF = ((f * dist) / 400) % 1;
    const a = lapF * Math.PI * 2;
    return [sh.cx + 58 * Math.cos(a) + (Math.cos(a) > 0 ? 42 : -42), sh.cy + 36.5 * Math.sin(a)];
  }
  if (sh.kind === 'outback') {
    const half = dist / 2;
    const s = f <= 0.5 ? f * dist : dist - f * dist;
    const wig = 60 * Math.sin(s / 300 + sh.ph1) + 25 * Math.sin(s / 90 + sh.ph2);
    const along = Math.min(s, half);
    return [sh.cx + Math.cos(sh.bearing) * along - Math.sin(sh.bearing) * wig, sh.cy + Math.sin(sh.bearing) * along + Math.cos(sh.bearing) * wig];
  }
  const R = dist / (2 * Math.PI * (1 + sh.a1 * 0.4));
  const th = f * Math.PI * 2;
  const rr = R * (1 + sh.a1 * Math.sin(2 * th + sh.ph1) + sh.a2 * Math.sin(3 * th + sh.ph2));
  return [sh.cx + rr * Math.cos(th + sh.bearing) - R * Math.cos(sh.bearing), sh.cy + rr * Math.sin(th + sh.bearing) - R * Math.sin(sh.bearing)];
}

function elevAmp(e: Spec['elev']) {
  return { flat: 2, rolling: 14, hilly: 55, mountain: 380 }[e];
}

/** Temperatura del día (°C) según lugar, mes y hora, más el sesgo del reloj en la muñeca. */
function tempFor(p: SimPlace, monthIdx: number, hour: number, r: Rand) {
  const south = p.lat < 0;
  const season = Math.cos(((monthIdx - (south ? 0.5 : 6.5)) / 12) * 2 * Math.PI); // 1 = verano
  const ampl = Math.min(16, 3 + Math.abs(p.lat) / 4);
  const daily = -3 * Math.cos(((hour - 4) / 24) * 2 * Math.PI);
  return p.temp + season * ampl + daily + r.normal(0, 2.5) + 4;
}

function buildTrack(spec: Spec, r: Rand, place: SimPlace, shape: RouteShape, startSec: number, dist: number, pace: number, opts: { gps: boolean; hrMode: Spec['hr']; temp: boolean; glitch: boolean; elev: Spec['elev'] }): DecodedTrack {
  const d = emptyTrack();
  const moving = dist * pace;
  const step = Math.max(5, Math.min(25, moving / 400));
  const n = Math.max(12, Math.round(moving / step));
  const amp = elevAmp(opts.elev);
  const ph = r.range(0, 6.28);
  const mo = new Date(startSec * 1000).getUTCMonth();
  const hour = new Date(startSec * 1000).getUTCHours();
  const baseTemp = tempFor(place, mo, hour, r);
  const hrBase = r.range(128, 158);
  // La forma se escala para que mida justo la distancia de la actividad.
  const [sx, sy] = routePoint(shape, 0, dist);
  let L = 0;
  for (let k = 1, [px, py] = [sx, sy]; k <= 300; k++) {
    const [qx, qy] = routePoint(shape, k / 300, dist);
    L += Math.hypot(qx - px, qy - py);
    [px, py] = [qx, qy];
  }
  const scale = L > 0 ? dist / L : 1;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const t = startSec + f * moving;
    let lat = NaN, lon = NaN;
    if (opts.gps) {
      const [rx, ry] = routePoint(shape, f, dist);
      const x = sx + (rx - sx) * scale, y = sy + (ry - sy) * scale;
      [lat, lon] = metersToDeg(place, x + r.normal(0, 3), y + r.normal(0, 3));
      if (opts.glitch) {
        if (i === 0 && r.chance(0.3)) [lat, lon] = metersToDeg(place, 380000, 120000);
        else if (r.chance(0.01)) [lat, lon] = metersToDeg(place, x + r.normal(0, 3000), y + r.normal(0, 3000));
      }
    }
    const s = f * dist;
    const alt = place.alt + amp * (Math.sin(s / 900 + ph) + 0.4 * Math.sin(s / 260 + ph * 2)) + (opts.elev === 'mountain' ? amp * 1.6 * Math.sin(f * Math.PI) : 0) + r.normal(0, 0.6);
    let hr = NaN;
    if (opts.hrMode === 'stream' || opts.hrMode === 'glitch') {
      hr = hrBase + 18 * f + r.normal(0, 3);
      if (opts.hrMode === 'glitch' && r.chance(0.02)) hr = r.pick([0, 240, 255]);
    }
    const cad = opts.hrMode === 'none' ? NaN : 84 + r.normal(0, 2);
    const distStream = opts.gps ? NaN : s; // cinta con podómetro: distancia del dispositivo
    const temp = opts.temp ? baseTemp + r.normal(0, 0.4) : NaN;
    pushPoint(d, t, lat, lon, alt, hr, cad, distStream, temp);
  }
  d.startTime = startSec;
  d.sport = 'running';
  // Casi todos los relojes (FIT) guardan la hora local: así se sabe la hora aunque no haya GPS.
  const tz = tzOf(place);
  if (tz && r.chance(0.9)) d.localOffset = (offsetMinutes(tz, startSec * 1000) ?? 0) * 60;
  return d;
}

// ------------------------------------------------------------------ atleta → filas + rutas
export function generateProfile(spec: Spec): SimProfile {
  const r = new Rand(spec.seed);
  const activities: CsvActivity[] = [];
  const tracks = new Map<string, TrackSummary>();
  let idN = 1;
  const nextId = () => String(spec.seed * 10000 + idN++);
  const lang = spec.lang;
  const runType = spec.elev === 'mountain' ? TRAIL_TYPE[lang] : RUN_TYPE[lang];
  const shoes = spec.gear === 'none' ? [] : spec.gear === 'one' || spec.gear === 'tiny' ? [r.pick(SHOES)] : spec.gear === 'weird' ? WEIRD_SHOES.slice(0, r.int(2, WEIRD_SHOES.length)) : SHOES.slice(0, r.int(2, 8));
  const shapes = new Map<string, RouteShape[]>();
  const shapesFor = (p: SimPlace) => {
    if (!shapes.has(p.key)) shapes.set(p.key, Array.from({ length: 14 }, () => shapeFor(r)));
    return shapes.get(p.key)!;
  };
  const year = spec.year;
  const endMs = spec.exportDate;

  const base = (id: string, startUtc: number, typeRaw: string): CsvActivity => ({
    id, startUtc, name: '', typeRaw, category: classifySport(typeRaw), elapsed: 0, moving: 0, distance: 0, elevGain: NaN, elevHigh: NaN, elevLow: NaN,
    maxSpeed: NaN, avgSpeed: NaN, maxHr: NaN, avgHr: NaN, avgCadence: NaN, calories: NaN, avgTemp: NaN, gear: '', filename: '', commute: false, race: false, steps: NaN, media: [],
  });

  // ---------------- días con carrera
  const nDays = daysIn(year);
  const seasonW = (doy: number) => {
    const f = doy / nDays;
    switch (spec.season) {
      case 'summer': return 0.4 + 1.2 * Math.max(0, Math.sin(f * Math.PI));
      case 'winter': return 0.4 + 1.2 * Math.abs(Math.cos(f * Math.PI));
      case 'ramp': return 0.2 + 1.6 * f;
      case 'lateStart': return f > 0.85 ? 3 : 0;
      case 'earlyStop': return f < 0.2 ? 3 : 0;
      case 'oneMonth': return f > 0.4 && f < 0.48 ? 5 : 0;
      case 'oneDay': return 0;
      default: return 1;
    }
  };
  const runDays: { doy: number; count: number }[] = [];
  if (spec.season === 'oneDay') runDays.push({ doy: r.int(0, Math.min(nDays - 1, Math.floor((endMs - Date.UTC(year, 0, 1)) / DAY))), count: 1 });
  else
    for (let doy = 0; doy < nDays; doy++) {
      const dow = (new Date(Date.UTC(year, 0, 1) + doy * DAY).getUTCDay() + 6) % 7;
      if (spec.weekendOnly && dow < 5) continue;
      if (spec.season === 'everyDay') {
        runDays.push({ doy, count: spec.runsPerWeek > 7 && r.chance(spec.runsPerWeek / 7 - 1) ? 2 : 1 });
        continue;
      }
      const p = Math.min(0.97, (spec.runsPerWeek / 7) * seasonW(doy) * (spec.weekendOnly ? 3.5 : 1));
      if (r.chance(p)) runDays.push({ doy, count: spec.runsPerWeek > 7 && r.chance(spec.runsPerWeek / 7 - 1) ? 2 : 1 });
    }

  const placeOn = (doy: number) => spec.trips.find((t) => doy >= t.fromDoy && doy < t.fromDoy + t.days)?.place ?? spec.home;
  const hourFor = (): number => {
    const tod = spec.tod === 'mixed' ? r.pick(['dawn', 'morning', 'midday', 'afternoon', 'evening', 'night'] as const) : spec.tod;
    const ranges: Record<Exclude<Tod, 'mixed'>, [number, number]> = { dawn: [4.5, 7.9], morning: [8, 11.9], midday: [12, 14.9], afternoon: [15, 18.9], evening: [19, 21.9], night: [22, 27.5] };
    const [a, b] = ranges[tod];
    return r.chance(0.8) ? r.range(a, b) : r.range(5, 23);
  };

  for (const { doy, count } of runDays) {
    for (let k = 0; k < count; k++) {
      const place = placeOn(doy);
      const h = hourFor() + k * 9;
      const localMs = Date.UTC(year, 0, 1) + doy * DAY + Math.round(h * 3600000);
      const startUtc = utcFromLocal(place, localMs);
      if (startUtc > endMs) continue;
      const id = nextId();
      // Distancia y ritmo
      const dow = (new Date(Date.UTC(year, 0, 1) + doy * DAY).getUTCDay() + 6) % 7;
      const isLong = dow >= 5 && r.chance(0.35);
      const isRace = r.chance(spec.raceShare);
      let km = isLong ? spec.longRunKm * r.range(0.7, 1.1) : Math.max(0.4, r.normal(spec.distKm, spec.distSd));
      if (isRace) km = r.pick([5, 10, 21.0975, 42.195, spec.longRunKm]);
      let pace = Math.max(150, r.normal(spec.paceSecKm, spec.paceSd)) * (1 + Math.max(0, km - 15) * 0.006) * (isRace ? 0.93 : 1);
      if (r.chance(spec.zeroDistShare)) km = 0;
      let dist = km * 1000;
      const moving = Math.round(dist * (pace / 1000)) || Math.round(r.range(600, 3600));
      const elapsed = Math.round(moving * r.range(1.0, 1.15) + (r.chance(0.02) ? r.range(3600, 30 * 3600) : 0));
      const a = base(id, startUtc, spec.elev === 'mountain' && r.chance(0.3) ? RUN_TYPE[lang] : runType);
      if (r.chance(0.01)) a.typeRaw = VIRTUAL_TYPE[lang];
      a.category = classifySport(a.typeRaw);
      a.distance = dist;
      a.moving = moving;
      a.elapsed = elapsed;
      a.race = isRace && r.chance(0.8);
      a.name = nameFor(spec, r, h, lang);
      if (shoes.length && (spec.gear !== 'partial' || r.chance(0.15)) && (spec.gear !== 'tiny' || r.chance(0.04))) a.gear = r.pick(shoes);
      if (r.chance(0.7)) a.calories = Math.round(km * 68 * r.range(0.9, 1.1));
      a.filename = `activities/${id}.fit.gz`;
      if (spec.photos > 0 && r.chance(spec.photos / 60)) a.media = [`media/${id}-${r.int(1, 9)}.jpg`];
      const outdoor = r.chance(spec.outdoorShare) && place.key !== '__indoor';
      const hrMode = spec.hr;
      const withFile = r.chance(0.97);
      if (withFile) {
        const shape = r.pick(shapesFor(place));
        const decoded = buildTrack(spec, r, place, shape, Math.floor(startUtc / 1000), dist || 1000, pace / 1000, {
          gps: outdoor,
          hrMode,
          temp: spec.temp === 'all' || (spec.temp === 'some' && r.chance(0.3)),
          glitch: spec.glitchGps,
          elev: spec.elev,
        });
        const sum = summarizeTrack(decoded, { id, csvDistance: dist });
        tracks.set(id, sum);
        if (outdoor && Number.isFinite(sum.altMax)) {
          a.elevHigh = sum.altMax;
          a.elevLow = sum.altMin;
          a.elevGain = Math.max(0, gainOf(decoded.alt));
        }
        if (hrMode === 'stream' || hrMode === 'glitch') {
          a.avgHr = sum.avgHr;
          a.maxHr = hrMode === 'glitch' && r.chance(0.2) ? 255 : sum.maxHr;
        }
      }
      if (hrMode === 'csv') {
        a.avgHr = r.normal(148, 8);
        a.maxHr = a.avgHr + r.range(10, 30);
      }
      activities.push(a);
    }
  }
  // Bicis apuntadas como carrera (deben descartarse).
  for (let i = 0; i < spec.bikesAsRuns; i++) {
    const doy = r.int(0, Math.max(0, Math.min(nDays - 1, Math.floor((endMs - Date.UTC(year, 0, 1)) / DAY))));
    const a = base(nextId(), utcFromLocal(spec.home, Date.UTC(year, 0, 1) + doy * DAY + 10 * 3600000), RUN_TYPE[lang]);
    a.distance = r.range(40000, 120000);
    a.moving = a.distance / r.range(7.5, 10);
    a.elapsed = a.moving * 1.1;
    a.name = lang === 'es' ? 'Salida en bici' : 'Bike ride';
    activities.push(a);
  }
  // Otros deportes
  const otherPool = spec.otherTypes.length ? spec.otherTypes : [];
  if (otherPool.length && spec.othersPerWeek > 0) {
    for (let doy = 0; doy < nDays; doy++) {
      if (!r.chance(spec.othersPerWeek / 7)) continue;
      const startUtc = utcFromLocal(spec.home, Date.UTC(year, 0, 1) + doy * DAY + r.int(7, 20) * 3600000);
      if (startUtc > endMs) continue;
      const a = base(nextId(), startUtc, r.pick(otherPool));
      a.moving = r.chance(0.1) ? r.range(60, 600) : r.range(1200, 9000);
      a.elapsed = a.moving * 1.05;
      a.distance = a.category === 'ride' ? a.moving * 7 : a.category === 'swim' ? a.moving * 0.6 : a.category === 'walk' || a.category === 'hike' ? a.moving * 1.3 : 0;
      activities.push(a);
    }
  }
  // Año anterior (solo CSV) para la comparación.
  if (spec.prevFactor != null) {
    const ourKm = activities.filter((a) => a.category === 'run' && new Date(a.startUtc).getUTCFullYear() === year).reduce((s, a) => s + a.distance, 0);
    const want = ourKm * spec.prevFactor;
    let got = 0;
    const pn = daysIn(year - 1);
    for (let i = 0; got < want && i < 2000; i++) {
      const doy = r.int(0, pn - 1);
      const a = base(nextId(), utcFromLocal(spec.home, Date.UTC(year - 1, 0, 1) + doy * DAY + 8 * 3600000), RUN_TYPE[lang]);
      a.distance = Math.max(1000, r.normal(spec.distKm, spec.distSd) * 1000);
      a.moving = (a.distance * spec.paceSecKm) / 1000;
      a.elapsed = a.moving;
      a.name = 'Old run';
      activities.push(a);
      got += a.distance;
    }
  }
  activities.sort((a, b) => a.startUtc - b.startUtc);

  // Extras
  const extras = emptyExtras();
  if (spec.kudos) extras.kudosByYear = { [year]: spec.kudos, [year - 1]: Math.round(spec.kudos * 0.8) };
  for (let i = 0; i < spec.challenges; i++) extras.challenges.push({ joinUtc: Date.UTC(year, r.int(0, 10), r.int(1, 28)), completed: r.chance(0.7) });
  if (spec.goal) extras.goals.push({ kind: 'distance', running: true, value: spec.goal.meters, period: spec.goal.kind, startUtc: Date.UTC(year - (r.chance(0.5) ? 1 : 0), r.int(0, 11), r.int(1, 28)) });
  for (let i = 0; i < spec.zones; i++) {
    const [lat, lon] = metersToDeg(spec.home, r.normal(0, 800), r.normal(0, 800));
    extras.privacyZones.push({ lat, lon, radius: r.pick([201, 402, 805, 1609]) + 60 });
  }
  return { spec, activities, tracks, extras };
}

function gainOf(alt: number[]): number {
  let g = 0;
  let last = NaN;
  for (let i = 0; i < alt.length; i += 3) {
    const a = alt[i];
    if (!Number.isFinite(a)) continue;
    if (Number.isFinite(last) && a > last) g += a - last;
    last = a;
  }
  return g;
}

function nameFor(spec: Spec, r: Rand, hour: number, lang: 'es' | 'en'): string {
  const def = DEFAULT_NAMES[lang][hour < 11 ? 0 : hour < 14 ? 1 : hour < 18 ? 2 : hour < 21 ? 3 : 4];
  switch (spec.names) {
    case 'custom': return r.chance(0.6) ? r.pick(CUSTOM_NAMES) : def;
    case 'emoji': return r.chance(0.6) ? r.pick(EMOJI_NAMES) : def;
    case 'cjk': return r.chance(0.7) ? r.pick(CJK_NAMES) : def;
    case 'long': return r.chance(0.6) ? r.pick(LONG_NAMES) : def;
    default: return def;
  }
}

// ------------------------------------------------------------------ catálogo de atletas
function baseSpec(r: Rand, id: string, seed: number): Spec {
  const year = r.weighted({ '2026': 6, '2025': 2, '2024': 1.5, '2023': 0.5 } as Record<string, number>);
  const y = Number(year);
  const partial = y === 2026 ? true : r.chance(0.1);
  const exportDate = partial
    ? Date.UTC(y, r.int(0, 11), r.int(1, 28), r.int(0, 23))
    : Date.UTC(y + 1, r.int(0, 3), r.int(1, 28), 12);
  const homeKey = r.pick(Object.keys(PLACES).filter((k) => !['atlantic', 'antarctica', 'sahara'].includes(k)));
  const lang = r.chance(0.6) ? 'es' : 'en';
  return {
    id, seed, year: y, exportDate, lang, units: lang === 'en' && r.chance(0.4) ? 'imperial' : 'metric',
    name: r.chance(0.85) ? r.pick(NAMES) : '',
    home: PLACES[homeKey],
    trips: [],
    runsPerWeek: r.pick([0.3, 1, 2, 3, 3.5, 4, 5, 6, 8, 12]),
    season: r.weighted({ flat: 6, summer: 1, winter: 1, ramp: 1, lateStart: 0.4, earlyStop: 0.4, oneMonth: 0.3, oneDay: 0.15, everyDay: 0.3 }),
    distKm: r.pick([3, 5, 6, 8, 10, 12, 15, 20]),
    distSd: r.range(0.5, 4),
    longRunKm: r.pick([8, 12, 16, 21, 25, 32, 42, 60]),
    paceSecKm: r.pick([200, 230, 260, 280, 300, 330, 360, 420, 540, 660]),
    paceSd: r.range(5, 40),
    tod: r.weighted({ dawn: 1.2, morning: 1.5, midday: 0.6, afternoon: 1, evening: 1.5, night: 0.4, mixed: 1 }),
    weekendOnly: r.chance(0.07),
    outdoorShare: r.pick([1, 1, 1, 0.95, 0.8, 0.5, 0.2, 0]),
    hr: r.weighted({ none: 1.5, csv: 0.6, stream: 4, glitch: 0.4 }),
    temp: r.weighted({ none: 2, some: 1, all: 2 }),
    elev: r.weighted({ flat: 2, rolling: 3, hilly: 1.5, mountain: 0.7 }),
    gear: r.weighted({ none: 2, one: 2, many: 3, partial: 1, weird: 0.6, tiny: 0.6 }),
    names: r.weighted({ default: 5, custom: 2, emoji: 0.7, cjk: 0.4, long: 0.4 }),
    raceShare: r.pick([0, 0, 0.02, 0.05, 0.15]),
    othersPerWeek: r.pick([0, 0, 0, 0.3, 1, 2, 4]),
    otherTypes: [],
    kudos: r.pick([0, 0, 3, 40, 500, 4200]),
    challenges: r.pick([0, 0, 1, 4, 20]),
    goal: r.chance(0.3) ? { kind: r.pick(['week', 'month', 'year'] as const), meters: r.pick([10000, 20000, 25000, 42195, 100000, 1000000, 12345]) } : null,
    zones: r.chance(0.2) ? r.int(1, 3) : 0,
    prevFactor: r.chance(0.65) ? r.pick([0.02, 0.3, 0.7, 0.97, 1.0, 1.04, 1.5, 3, 12]) : null,
    glitchGps: r.chance(0.12),
    zeroDistShare: r.chance(0.1) ? 0.1 : 0,
    bikesAsRuns: r.chance(0.08) ? r.int(1, 4) : 0,
    photos: r.chance(0.2) ? r.int(1, 12) : 0,
    trim: r.chance(0.85),
    cityMap: r.chance(0.9),
    traits: [],
  };
}

function addTrips(r: Rand, s: Spec, count: number) {
  const nDays = daysIn(s.year);
  const keys = Object.keys(PLACES).filter((k) => k !== s.home.key);
  for (let i = 0; i < count; i++) s.trips.push({ place: PLACES[r.pick(keys)], fromDoy: r.int(0, nDays - 8), days: r.int(2, 12) });
}

/** Casos extremos fijos (siempre se prueban) + atletas aleatorios. */
export function catalog(n: number, seed0 = 1): Spec[] {
  const specs: Spec[] = [];
  const special = (key: string, f: (s: Spec, r: Rand) => void) => {
    const seed = 900000 + specs.length;
    const r = new Rand(seed);
    const s = baseSpec(r, key, seed);
    s.year = 2026;
    s.exportDate = Date.UTC(2026, 10, 24, 10);
    f(s, r);
    s.traits.unshift(key);
    specs.push(s);
  };
  special('una-sola-carrera', (s) => Object.assign(s, { season: 'oneDay', runsPerWeek: 1, prevFactor: null }));
  special('dos-carreras', (s) => Object.assign(s, { runsPerWeek: 0.045 }));
  special('solo-cinta', (s) => Object.assign(s, { outdoorShare: 0, hr: 'none', gear: 'none', runsPerWeek: 4 }));
  special('ultrafondo', (s) => Object.assign(s, { distKm: 45, distSd: 25, longRunKm: 160, paceSecKm: 420, runsPerWeek: 1.5, elev: 'mountain', home: PLACES.chamonix }));
  special('elite', (s) => Object.assign(s, { paceSecKm: 205, paceSd: 12, runsPerWeek: 12, distKm: 14, home: PLACES.iten, raceShare: 0.05 }));
  special('caminante', (s) => Object.assign(s, { paceSecKm: 690, paceSd: 40, distKm: 4 }));
  special('todos-los-dias', (s) => Object.assign(s, { season: 'everyDay', runsPerWeek: 7, distKm: 6 }));
  special('doble-sesion', (s) => Object.assign(s, { season: 'everyDay', runsPerWeek: 13, distKm: 9 }));
  special('tromso-noche', (s) => Object.assign(s, { home: PLACES.tromso, tod: 'evening', runsPerWeek: 4 }));
  special('sidney-dorada', (s) => Object.assign(s, { home: PLACES.sydney, tod: 'evening', runsPerWeek: 4, lang: 'en', units: 'metric' }));
  special('fiyi-antimeridiano', (s) => Object.assign(s, { home: PLACES.taveuni, runsPerWeek: 3, outdoorShare: 1, cityMap: true }));
  special('nomada-25-paises', (s, r) => {
    Object.assign(s, { runsPerWeek: 5, outdoorShare: 1 });
    addTrips(r, s, 30);
  });
  special('crucero', (s, r) => {
    Object.assign(s, { runsPerWeek: 3 });
    s.trips.push({ place: PLACES.atlantic, fromDoy: 120, days: 14 });
    s.trips.push({ place: PLACES.antarctica, fromDoy: 330, days: 3 });
    addTrips(r, s, 2);
  });
  special('imperial-denver', (s) => Object.assign(s, { home: PLACES.denver, lang: 'en', units: 'imperial', elev: 'hilly' }));
  special('altitud-la-paz', (s) => Object.assign(s, { home: PLACES.lapaz, elev: 'hilly' }));
  special('mar-muerto', (s) => Object.assign(s, { home: PLACES.deadsea, elev: 'flat' }));
  special('gps-loco', (s) => Object.assign(s, { glitchGps: true, runsPerWeek: 4 }));
  special('pulso-solo-csv', (s) => Object.assign(s, { hr: 'csv' }));
  special('pulso-loco', (s) => Object.assign(s, { hr: 'glitch' }));
  special('nombres-raros', (s) => Object.assign(s, { names: 'long', gear: 'weird', name: 'Maximiliano Alejan' }));
  special('nombres-cjk', (s) => Object.assign(s, { names: 'cjk', gear: 'weird', name: '陈', home: PLACES.tokyo }));
  special('emojis', (s) => Object.assign(s, { names: 'emoji', name: 'Zoë' }));
  special('export-2-enero', (s) => Object.assign(s, { exportDate: Date.UTC(2026, 0, 2, 9), runsPerWeek: 7 }));
  special('export-1-enero', (s) => Object.assign(s, { exportDate: Date.UTC(2026, 0, 1, 23), runsPerWeek: 7, season: 'everyDay' }));
  special('nochevieja-medianoche', (s) => Object.assign(s, { year: 2025, exportDate: Date.UTC(2026, 0, 1, 12), tod: 'night', season: 'everyDay', runsPerWeek: 7 }));
  special('bisiesto-2024', (s) => Object.assign(s, { year: 2024, exportDate: Date.UTC(2025, 1, 2), season: 'everyDay' }));
  special('solo-findes', (s) => Object.assign(s, { weekendOnly: true }));
  special('empieza-en-diciembre', (s) => Object.assign(s, { year: 2025, exportDate: Date.UTC(2026, 0, 10), season: 'lateStart', runsPerWeek: 4 }));
  special('bajon-80', (s) => Object.assign(s, { prevFactor: 5 }));
  special('subidon-x30', (s) => Object.assign(s, { prevFactor: 0.03 }));
  special('sin-nombre', (s) => Object.assign(s, { name: '' }));
  // Nombres del perfil de Strava tal cual vienen: larguísimos, con emojis o en otra escritura.
  special('nombre-larguisimo', (s) => Object.assign(s, { name: 'Juan Carlos de la Santísima Trinidad' }));
  special('nombre-sin-espacios', (s) => Object.assign(s, { name: 'Wolfeschlegelsteinhausenbergerdorff' }));
  special('nombre-emoji', (s) => Object.assign(s, { name: 'Laura 🌸🏃‍♀️' }));
  special('nombre-arabe', (s) => Object.assign(s, { name: 'محمد' }));
  special('nombre-una-letra', (s) => Object.assign(s, { name: 'J' }));
  special('distancia-cero', (s) => Object.assign(s, { zeroDistShare: 0.5 }));
  special('muchos-deportes', (s) => Object.assign(s, { othersPerWeek: 6, otherTypes: OTHER_TYPES[s.lang] }));
  special('bicis-como-carrera', (s) => Object.assign(s, { bikesAsRuns: 6 }));
  special('zonas-privacidad', (s) => Object.assign(s, { zones: 3, trim: true }));
  special('skyrunner', (s) => Object.assign(s, { elev: 'mountain', home: PLACES.zermatt, runsPerWeek: 6, distKm: 18 }));
  special('mitad-cinta', (s) => Object.assign(s, { outdoorShare: 0.5 }));
  special('frio-extremo', (s) => Object.assign(s, { home: PLACES.yakutsk, temp: 'all' }));
  special('calor-extremo', (s) => Object.assign(s, { home: PLACES.dubai, temp: 'all' }));
  special('mediodia', (s) => Object.assign(s, { tod: 'midday' }));
  special('madrugador', (s) => Object.assign(s, { tod: 'dawn', runsPerWeek: 5 }));
  special('nocturno', (s) => Object.assign(s, { tod: 'night', runsPerWeek: 5 }));
  special('sin-horario', (s) => Object.assign(s, { tod: 'mixed', runsPerWeek: 5 }));
  special('zapatillas-pocas', (s) => Object.assign(s, { gear: 'tiny' }));
  special('un-mes', (s) => Object.assign(s, { season: 'oneMonth', runsPerWeek: 5 }));
  special('fotos', (s) => Object.assign(s, { photos: 30 }));
  special('kiritimati-utc14', (s) => Object.assign(s, { home: PLACES.kiritimati, season: 'everyDay', runsPerWeek: 7 }));
  special('samoa-utc-11', (s) => Object.assign(s, { home: PLACES.pagopago, season: 'everyDay', runsPerWeek: 7 }));
  special('chatham-1245', (s) => Object.assign(s, { home: PLACES.chatham }));
  special('sahara-sin-ciudad', (s) => Object.assign(s, { home: PLACES.sahara }));
  special('koh-tao', (s) => Object.assign(s, { home: PLACES.kohtao }));
  special('objetivo-raro', (s) => Object.assign(s, { goal: { kind: 'week', meters: 12345 } }));
  special('objetivo-anual-cumplido', (s) => Object.assign(s, { goal: { kind: 'year', meters: 100000 }, runsPerWeek: 5 }));
  special('mucho-kudo', (s) => Object.assign(s, { kudos: 123456, challenges: 200 }));
  // Pocas carreras al año: cada pantalla que salga tiene que decir algo (ver cardSkipReason).
  for (const [n, perWeek] of [[3, 0.07], [5, 0.11], [8, 0.17], [12, 0.26], [20, 0.42]] as const) {
    special(`pocas-${n}`, (s) => Object.assign(s, { runsPerWeek: perWeek, season: 'flat', weekendOnly: false, outdoorShare: 1, hr: 'stream', gear: 'one', distKm: 7, distSd: 2, longRunKm: 12, paceSecKm: 345, zeroDistShare: 0, bikesAsRuns: 0, glitchGps: false, names: 'default', elev: 'rolling', othersPerWeek: 0.2, otherTypes: ['Bicicleta'] }));
  }
  // Un solo deporte más, aunque sea mucho: sin pantalla de "otros deportes". Y dos de verdad: con ella.
  special('un-deporte-mas', (s) => Object.assign(s, { othersPerWeek: 3, otherTypes: s.lang === 'es' ? ['Bicicleta'] : ['Ride'], runsPerWeek: 3 }));
  special('dos-deportes-mas', (s) => Object.assign(s, { othersPerWeek: 3, otherTypes: s.lang === 'es' ? ['Bicicleta', 'Natación'] : ['Ride', 'Swim'], runsPerWeek: 3 }));

  for (let i = 0; i < n; i++) {
    const seed = seed0 * 100003 + i;
    const r = new Rand(seed);
    const s = baseSpec(r, `r${i}`, seed);
    if (r.chance(0.35)) addTrips(r, s, r.pick([1, 2, 4, 8, 15]));
    if (s.othersPerWeek > 0) s.otherTypes = OTHER_TYPES[s.lang].slice(0, r.int(1, 8));
    specs.push(s);
  }
  for (const s of specs) {
    s.traits.push(
      `${s.year}${s.exportDate < Date.UTC(s.year + 1, 0, 1) ? ' (a medias)' : ''}`,
      `${s.lang}/${s.units}`,
      `casa:${s.home.key}`,
      `${s.runsPerWeek}/sem ${s.season}`,
      `${s.distKm}km ${Math.round(s.paceSecKm / 60)}:${String(Math.round(s.paceSecKm % 60)).padStart(2, '0')}/km`,
      `hora:${s.tod}`,
      `gps:${Math.round(s.outdoorShare * 100)}%`,
      `pulso:${s.hr}`,
      `zapas:${s.gear}`,
      s.trips.length ? `viajes:${s.trips.length}` : '',
      s.prevFactor != null ? `prev×${s.prevFactor}` : 'sin prev',
    );
    s.traits = s.traits.filter(Boolean);
  }
  return specs;
}

export const RUN_TYPES = new Set([RUN_TYPE.es, RUN_TYPE.en, TRAIL_TYPE.es, TRAIL_TYPE.en, VIRTUAL_TYPE.es, VIRTUAL_TYPE.en]);
