// Compara nuestro decodificador FIT con el SDK oficial de Garmin sobre una carpeta de ficheros .fit.
// Uso: npx tsx scripts/validate-fit.ts <carpeta-con-fits>
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Decoder, Stream } from '@garmin/fitsdk';
import { decodeFit } from '../src/parse/fit';
import { summarizeTrack } from '../src/parse/track';

const dir = process.argv[2];
if (!dir) {
  console.error('Uso: npx tsx scripts/validate-fit.ts <carpeta>');
  process.exit(1);
}
let bad = 0;
for (const f of readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.fit'))) {
  const bytes = new Uint8Array(readFileSync(join(dir, f)));
  const t0 = performance.now();
  const ours = decodeFit(bytes);
  const tOurs = performance.now() - t0;
  const t1 = performance.now();
  const { messages, errors } = new Decoder(Stream.fromByteArray(Array.from(bytes))).read({ applyScaleAndOffset: true });
  const tGarmin = performance.now() - t1;
  const recs = (messages.recordMesgs ?? []) as Record<string, unknown>[];
  const gPos = recs.filter((r) => r.positionLat != null).length;
  const oPos = ours.lat.filter((x) => Number.isFinite(x)).length;
  const gHr = recs.reduce((s, r) => s + (Number(r.heartRate) || 0), 0);
  const oHr = ours.hr.reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
  const gFirst = recs[0]?.timestamp instanceof Date ? (recs[0].timestamp as Date).getTime() / 1000 : NaN;
  const gLast = recs.at(-1)?.timestamp instanceof Date ? (recs.at(-1)!.timestamp as Date).getTime() / 1000 : NaN;
  const sport = (messages.sessionMesgs?.[0] as Record<string, unknown> | undefined)?.sport;
  const okCount = recs.length === ours.time.length;
  const okPos = gPos === oPos;
  const okHr = Math.abs(gHr - oHr) < 1e-6 * Math.max(1, gHr);
  const okTime = (Number.isNaN(gFirst) || gFirst === ours.time[0]) && (Number.isNaN(gLast) || gLast === ours.time.at(-1));
  const ok = okCount && okPos && okHr && okTime;
  if (!ok) bad++;
  const s = summarizeTrack(ours, { id: f, csvDistance: 0 });
  console.log(
    `${ok ? 'OK ' : 'BAD'} ${f.padEnd(48)} rec ${String(ours.time.length).padStart(6)}/${String(recs.length).padEnd(6)} pos ${oPos}/${gPos} hr ${okHr ? '=' : `${oHr}/${gHr}`} t ${okTime ? '=' : `${ours.time[0]}/${gFirst}`} sport ${ours.sport}/${sport} off ${ours.localOffset} gps ${s.hasGps} pts ${s.track ? s.track.length / 2 : 0} 1k ${s.efforts['1000']?.toFixed(0) ?? '-'} ${tOurs.toFixed(1)}ms vs ${tGarmin.toFixed(0)}ms${errors.length ? ' garminErrors=' + errors.length : ''}`,
  );
}
process.exit(bad ? 1 : 0);
