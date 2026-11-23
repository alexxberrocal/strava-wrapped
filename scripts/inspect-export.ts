// Inspecciona un export de Strava con los parsers del proyecto (sin navegador).
// Uso: npx tsx scripts/inspect-export.ts <export.zip>
import { readFileSync } from 'node:fs';
import { ParserCore } from '../src/worker/core';
import { cleanHeader, parseCsv } from '../src/parse/csv';

const file = process.argv[2];
if (!file) {
  console.error('Uso: npx tsx scripts/inspect-export.ts <export.zip>');
  process.exit(1);
}
const buf = readFileSync(file);
const core = new ParserCore();
const t0 = performance.now();
await core.open({ kind: 'zip', file: new File([buf], 'export.zip') });
const scan = await core.scan();
const t1 = performance.now();
const acts = scan.csv.activities;
console.log(`scan ${Math.round(t1 - t0)} ms · ${acts.length} actividades · idioma cabeceras: ${scan.csv.headerLanguage} · avisos: ${JSON.stringify(scan.csv.warnings)}`);
console.log('nombre de pila encontrado:', scan.firstName ? 'sí' : 'no', '· fecha export:', scan.exportDate && new Date(scan.exportDate).toISOString());
const byType = new Map<string, { n: number; cat: string }>();
for (const a of acts) {
  const e = byType.get(a.typeRaw) ?? { n: 0, cat: a.category };
  e.n++;
  byType.set(a.typeRaw, e);
}
console.log('tipos:', [...byType.entries()].map(([k, v]) => `${k}→${v.cat}:${v.n}`).join(', '));
const badDate = acts.filter((a) => !Number.isFinite(a.startUtc)).length;
const years = new Map<number, number>();
for (const a of acts) if (Number.isFinite(a.startUtc)) years.set(new Date(a.startUtc).getUTCFullYear(), (years.get(new Date(a.startUtc).getUTCFullYear()) ?? 0) + 1);
console.log('fechas ilegibles:', badDate, '· por año:', [...years.entries()].sort().map(([y, n]) => `${y}:${n}`).join(' '));
const raw = parseCsv(new TextDecoder().decode(await (core as unknown as { archive: { bytes(p: string): Promise<Uint8Array> } }).archive.bytes('activities.csv')));
const hdr = raw[0].map(cleanHeader);
console.log(`columnas: ${hdr.length}`);
console.log('cabeceras 0-24:', hdr.slice(0, 25).join(' | '));
console.log('cabeceras >80:', hdr.slice(80).join(' | '));
console.log('ejemplos de fecha:', raw.slice(1, 4).map((r) => r[1]).join(' || '), '...', raw.slice(-2).map((r) => r[1]).join(' || '));
const fields = ['distance', 'moving', 'elapsed', 'elevGain', 'elevHigh', 'avgHr', 'maxHr', 'calories', 'avgCadence', 'avgTemp', 'steps'] as const;
for (const f of fields) {
  const n = acts.filter((a) => Number.isFinite(a[f]) && (a[f] as number) > 0).length;
  console.log(`  ${f}: ${n}/${acts.length} con dato`);
}
console.log(`  gear: ${acts.filter((a) => a.gear).length} · filename: ${acts.filter((a) => a.filename).length} · media: ${acts.filter((a) => a.media.length).length} · race: ${acts.filter((a) => a.race).length} · commute: ${acts.filter((a) => a.commute).length}`);
// Ficheros de actividad: decodificar todos y medir
const runs = acts.filter((a) => a.filename);
let ok = 0, fail = 0, gps = 0, offsets = 0, hr = 0, ms = 0;
const errors: string[] = [];
const offs = new Map<number, number>();
const deltaStart: number[] = [];
const distRatio: number[] = [];
for (const a of runs) {
  const t = performance.now();
  const s = await core.track({ id: a.id, filename: a.filename, csvDistance: a.distance });
  ms += performance.now() - t;
  if (!s.ok) {
    fail++;
    errors.push(`${a.filename}: ${s.error}`);
    continue;
  }
  ok++;
  if (s.hasGps) gps++;
  if (s.localOffsetMin != null) {
    offsets++;
    offs.set(s.localOffsetMin, (offs.get(s.localOffsetMin) ?? 0) + 1);
  }
  if (s.hrHist) hr++;
  if (s.startUtc != null && Number.isFinite(a.startUtc)) deltaStart.push(Math.round((s.startUtc - a.startUtc) / 1000));
  if (s.gpsDistance > 0 && a.distance > 0) distRatio.push(s.gpsDistance / a.distance);
}
deltaStart.sort((x, y) => x - y);
distRatio.sort((x, y) => x - y);
const q = (arr: number[], p: number) => arr[Math.floor(p * (arr.length - 1))];
console.log(`ficheros: ${ok} ok, ${fail} fallos · con GPS ${gps} · con hora local del reloj ${offsets} ${JSON.stringify([...offs.entries()])} · con pulso ${hr} · ${Math.round(ms)} ms en total`);
console.log(`inicio fichero - inicio CSV (s): min ${deltaStart[0]} p50 ${q(deltaStart, 0.5)} max ${deltaStart[deltaStart.length - 1]}`);
console.log(`distancia GPS / Strava: p5 ${q(distRatio, 0.05)?.toFixed(3)} p50 ${q(distRatio, 0.5)?.toFixed(3)} p95 ${q(distRatio, 0.95)?.toFixed(3)}`);
if (errors.length) console.log('errores:', errors.slice(0, 10));
