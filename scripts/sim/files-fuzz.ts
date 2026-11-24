/**
 * Ficheros de actividad rotos o raros (FIT, GPX, TCX): cortados a medias, con bytes cambiados,
 * basura en medio, números imposibles, puntos desordenados, horas absurdas, gigantes…
 * El lector nunca debe colgarse ni devolver cosas absurdas (NaN, marcas imposibles, pulso 255).
 *
 *   npm run sim:ficheros
 */
import { gzipSync, strFromU8, strToU8 } from 'fflate';
import { generateAthlete } from '../../src/demo/generator';
import { fitFile, gpxFile, tcxFile } from '../make-sample-export';
import { decodeActivityBytes } from '../../src/worker/core';
import { plausibleEffort, summarizeTrack, type TrackSummary } from '../../src/parse/track';

let seed = 4242;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const athlete = generateAthlete();
const runs = athlete.runs.filter((r) => r.points && r.points.length > 50).slice(0, 10);
const bases: { kind: string; bytes: Uint8Array; dist: number }[] = [];
for (const r of runs) {
  bases.push({ kind: 'fit', bytes: fitFile(r), dist: r.distance });
  bases.push({ kind: 'gpx', bytes: strToU8(gpxFile(r)), dist: r.distance });
  bases.push({ kind: 'tcx', bytes: strToU8(tcxFile(r)), dist: r.distance });
}

type Mut = [string, (b: Uint8Array, kind: string) => Uint8Array];
const text = (f: (s: string) => string) => (b: Uint8Array) => strToU8(f(strFromU8(b)));
const MUTATIONS: Mut[] = [
  ['intacto', (b) => b],
  ['vacío', () => new Uint8Array(0)],
  ['cortado', (b) => b.slice(0, Math.floor(b.length * rnd()))],
  ['cortado al 99 %', (b) => b.slice(0, Math.floor(b.length * 0.99))],
  ['1 byte cambiado', (b) => flip(b, 1)],
  ['20 bytes cambiados', (b) => flip(b, 20)],
  ['500 bytes cambiados', (b) => flip(b, 500)],
  ['basura en medio', (b) => {
    const at = int(0, b.length);
    const junk = Uint8Array.from({ length: int(1, 4000) }, () => int(0, 255));
    return concat(b.slice(0, at), junk, b.slice(at));
  }],
  ['duplicado', (b) => concat(b, b)],
  ['gzip dentro', (b) => gzipSync(b)],
  ['solo cabecera FIT', (b, k) => (k === 'fit' ? b.slice(0, 14) : b.slice(0, 200))],
  ['números imposibles', text((s) => s.replace(/(lat|lon)="[-\d.]+"/g, (_m, k) => `${k}="${pickAbsurd()}"`).replace(/<(LatitudeDegrees|LongitudeDegrees|ele|AltitudeMeters|Value|DistanceMeters)>[^<]*</g, (_m, k) => `<${k}>${pickAbsurd()}<`))],
  ['horas absurdas', text((s) => s.replace(/(<time>|<Time>)\d{4}/g, (_m, t) => `${t}${pick(['1970', '2099', '0000', '9999'])}`))],
  ['puntos desordenados', text((s) => {
    const parts = s.split(/(?=<trkpt|<Trackpoint>)/);
    const head = parts.shift() ?? '';
    for (let i = parts.length - 1; i > 0; i--) {
      const j = int(0, i);
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }
    return head + parts.join('');
  })],
  ['sin horas', text((s) => s.replace(/<(time|Time)>[^<]*<\/(time|Time)>/g, ''))],
  ['sin cierre', text((s) => s.replace(/<\/(trkseg|trk|gpx|Track|Lap|Activity|Activities|TrainingCenterDatabase)>/g, ''))],
  ['BOM y espacios', text((s) => '﻿\n\n   ' + s)],
  ['UTF-16', (b) => {
    const s = strFromU8(b);
    const out = new Uint8Array(s.length * 2 + 2);
    out[0] = 0xff;
    out[1] = 0xfe;
    for (let i = 0; i < s.length; i++) {
      out[2 + i * 2] = s.charCodeAt(i) & 255;
      out[3 + i * 2] = s.charCodeAt(i) >> 8;
    }
    return out;
  }],
  ['gigante (x40)', text((s) => {
    const m = /(<trkpt[\s\S]*<\/trkpt>|<Trackpoint>[\s\S]*<\/Trackpoint>)/.exec(s);
    return m ? s.replace(m[1], m[1].repeat(40)) : s;
  })],
];

function pick<T>(a: T[]): T {
  return a[int(0, a.length - 1)];
}
function pickAbsurd(): string {
  return pick(['NaN', 'Infinity', '-Infinity', '1e400', '999', '-999', '', 'abc', '0', '1,5']);
}
function flip(b: Uint8Array, n: number) {
  const c = b.slice();
  for (let i = 0; i < n && c.length; i++) c[int(0, c.length - 1)] = int(0, 255);
  return c;
}
function concat(...arrs: Uint8Array[]) {
  const out = new Uint8Array(arrs.reduce((a, x) => a + x.length, 0));
  let o = 0;
  for (const x of arrs) {
    out.set(x, o);
    o += x.length;
  }
  return out;
}

const problems: string[] = [];
const stats: Record<string, { n: number; ok: number; threw: number; slowest: number }> = {};
for (const base of bases) {
  for (const [name, mut] of MUTATIONS) {
    for (let rep = 0; rep < (name === 'intacto' ? 1 : 6); rep++) {
      const bytes = mut(base.bytes, base.kind);
      const key = `${base.kind} · ${name}`;
      const st = (stats[key] ??= { n: 0, ok: 0, threw: 0, slowest: 0 });
      st.n++;
      const t0 = performance.now();
      let sum: TrackSummary | null = null;
      try {
        sum = summarizeTrack(decodeActivityBytes(bytes), { id: 'x', csvDistance: base.dist });
      } catch {
        st.threw++; // el worker lo captura: la actividad queda sin ruta, sin romper nada
      }
      const ms = performance.now() - t0;
      st.slowest = Math.max(st.slowest, ms);
      if (ms > 3000) problems.push(`${key}: ${Math.round(ms)} ms`);
      if (!sum) continue;
      st.ok++;
      const bad = check(sum);
      if (bad) problems.push(`${key}: ${bad}`);
    }
  }
}

function check(s: TrackSummary): string | null {
  if (s.start && !(Number.isFinite(s.start[0]) && Number.isFinite(s.start[1]) && Math.abs(s.start[0]) <= 90 && Math.abs(s.start[1]) <= 180)) return `inicio imposible ${s.start}`;
  if (s.track) for (let i = 0; i < s.track.length; i++) if (!Number.isFinite(s.track[i])) return 'ruta con NaN';
  if (!(s.gpsDistance >= 0 && Number.isFinite(s.gpsDistance))) return `distancia GPS ${s.gpsDistance}`;
  if (s.hasGps && s.gpsDistance > 300000) return `distancia GPS absurda ${Math.round(s.gpsDistance)} m`;
  for (const [k, v] of Object.entries(s.efforts)) if (!plausibleEffort(Number(k), v)) return `marca imposible ${k} m en ${v} s`;
  if (Number.isFinite(s.avgHr) && !(s.avgHr >= 30 && s.avgHr <= 225)) return `pulso medio ${s.avgHr}`;
  if (Number.isFinite(s.maxHr) && !(s.maxHr >= 30 && s.maxHr <= 225)) return `pulso máximo ${s.maxHr}`;
  if (Number.isFinite(s.altMax) && !(s.altMax > -500 && s.altMax < 9000)) return `altitud ${s.altMax}`;
  if (s.startUtc != null && !Number.isFinite(s.startUtc)) return 'inicio sin hora válida';
  if (s.startUtc != null && (s.startUtc < Date.UTC(1990, 0, 1) || s.startUtc > Date.UTC(2100, 0, 1))) return `fecha absurda ${new Date(s.startUtc).toISOString()}`;
  if (Number.isFinite(s.steps) && s.steps > 500000) return `pasos ${s.steps}`;
  return null;
}

console.log(`${bases.length} ficheros base × ${MUTATIONS.length} mutaciones`);
for (const [k, v] of Object.entries(stats)) console.log(`  ${k.padEnd(34)} ${String(v.ok).padStart(3)}/${v.n} leídos · ${v.threw} descartados · máx ${Math.round(v.slowest)} ms`);
console.log(problems.length ? `\n${problems.length} problemas:\n  ${[...new Set(problems)].slice(0, 40).join('\n  ')}` : '\nSin problemas.');
