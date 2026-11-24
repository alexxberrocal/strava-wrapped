// Genera un export de Strava de prueba (samples/export_12345678.zip) con el atleta sintético:
// activities.csv en español (cabeceras reales es-ES), ficheros FIT (.fit.gz), GPX y TCX, profile.csv
// y algunas fotos. Sirve para probar la web de principio a fin sin datos personales.
// Uso: npm run sample
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { gzipSync, zipSync, strToU8 } from 'fflate';
import { Encoder, Profile } from '@garmin/fitsdk';
import { generateAthlete, type SynthPoint, type SynthRun } from '../src/demo/generator';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIT_EPOCH = 631065600;
const MONTHS_ES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];

function esDate(ms: number): string {
  const d = new Date(ms);
  const hh = d.getUTCHours();
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS_ES[d.getUTCMonth()]} ${d.getUTCFullYear()} ${hh}:${mm}:${ss}`;
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const mesg = (o: Record<string, unknown>) => o as never;

export function fitFile(r: SynthRun): Uint8Array {
  const pts = r.points!;
  const enc = new Encoder();
  const start = new Date(pts[0].t * 1000);
  enc.onMesg(Profile.MesgNum.FILE_ID, mesg({ manufacturer: 'garmin', product: 3990, timeCreated: start, type: 'activity' }));
  let dist = 0;
  pts.forEach((p, i) => {
    if (i > 0) {
      const a = pts[i - 1];
      dist += Math.hypot((p.lat - a.lat) * 110574, (p.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180));
    }
    enc.onMesg(Profile.MesgNum.RECORD, mesg({
      timestamp: new Date(p.t * 1000),
      positionLat: Math.round((p.lat * 2147483648) / 180),
      positionLong: Math.round((p.lon * 2147483648) / 180),
      distance: dist,
      enhancedAltitude: p.alt,
      heartRate: p.hr,
      cadence: Math.round(p.cad),
      temperature: 18,
    }));
  });
  const end = new Date(pts[pts.length - 1].t * 1000);
  enc.onMesg(Profile.MesgNum.SESSION, mesg({
    timestamp: end, startTime: start, sport: 'running', subSport: r.trail ? 'trail' : 'generic',
    totalElapsedTime: r.elapsed, totalTimerTime: r.moving, totalDistance: r.distance,
  }));
  enc.onMesg(Profile.MesgNum.ACTIVITY, mesg({
    timestamp: end, localTimestamp: Math.round(end.getTime() / 1000) - FIT_EPOCH + r.offsetMin * 60,
    numSessions: 1, type: 'manual', event: 'activity', eventType: 'stop',
  }));
  return enc.close();
}

export function gpxFile(r: SynthRun): string {
  const pts = r.points!;
  const body = pts
    .map((p: SynthPoint) => `   <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">\n    <ele>${p.alt.toFixed(1)}</ele>\n    <time>${new Date(p.t * 1000).toISOString().replace('.000', '')}</time>\n    <extensions>\n     <gpxtpx:TrackPointExtension>\n      <gpxtpx:hr>${p.hr}</gpxtpx:hr>\n      <gpxtpx:cad>${Math.round(p.cad)}</gpxtpx:cad>\n     </gpxtpx:TrackPointExtension>\n    </extensions>\n   </trkpt>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX Android" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
 <metadata>
  <time>${new Date(pts[0].t * 1000).toISOString().replace('.000', '')}</time>
 </metadata>
 <trk>
  <name>${r.name.es}</name>
  <type>running</type>
  <trkseg>
${body}
  </trkseg>
 </trk>
</gpx>
`;
}

export function tcxFile(r: SynthRun): string {
  const pts = r.points!;
  let dist = 0;
  const tps = pts
    .map((p, i) => {
      if (i > 0) {
        const a = pts[i - 1];
        dist += Math.hypot((p.lat - a.lat) * 110574, (p.lon - a.lon) * 111320 * Math.cos((a.lat * Math.PI) / 180));
      }
      return `<Trackpoint><Time>${new Date(p.t * 1000).toISOString()}</Time><Position><LatitudeDegrees>${p.lat.toFixed(7)}</LatitudeDegrees><LongitudeDegrees>${p.lon.toFixed(7)}</LongitudeDegrees></Position><AltitudeMeters>${p.alt.toFixed(1)}</AltitudeMeters><DistanceMeters>${dist.toFixed(1)}</DistanceMeters><HeartRateBpm><Value>${p.hr}</Value></HeartRateBpm><Extensions><ns3:TPX><ns3:RunCadence>${Math.round(p.cad)}</ns3:RunCadence></ns3:TPX></Extensions></Trackpoint>`;
    })
    .join('\n');
  const t0 = new Date(pts[0].t * 1000).toISOString();
  // Strava a veces deja espacios antes de la declaración XML.
  return `          <?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
<Activities><Activity Sport="Running"><Id>${t0}</Id><Lap StartTime="${t0}"><Track>
${tps}
</Track></Lap></Activity></Activities></TrainingCenterDatabase>
`;
}

/** PNG mínimo (degradado) sin dependencias, para las "fotos" del export. */
function png(w: number, h: number, c1: [number, number, number], c2: [number, number, number]): Uint8Array {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const k = (x + y) / (w + h);
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = c1[0] + (c2[0] - c1[0]) * k;
      raw[o + 1] = c1[1] + (c2[1] - c1[1]) * k;
      raw[o + 2] = c1[2] + (c2[2] - c1[2]) * k;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return new Uint8Array(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

function main() {
  const header = readFileSync(join(root, 'tests', 'fixtures', 'headers-es-ES.csv'), 'utf8').replace(/\r?\n$/, '');
  const nCols = 87;
  const files: Record<string, Uint8Array> = {};
  const rows: string[] = [header];
  let upload = 9100000000;
  let photoN = 0;
  const palettes: [[number, number, number], [number, number, number]][] = [
    [[252, 76, 2], [255, 190, 120]],
    [[30, 60, 120], [140, 200, 255]],
    [[20, 110, 70], [200, 230, 140]],
    [[90, 40, 120], [250, 140, 120]],
    [[40, 40, 40], [230, 220, 200]],
  ];

  const years = [generateAthlete(20251231, 2025, Date.UTC(2025, 11, 31, 20)), generateAthlete()];
  for (const ath of years) {
    for (const r of ath.runs) {
      const row: (string | number)[] = new Array(nCols).fill('');
      let filename = '';
      if (r.points) {
        const id = upload++;
        const kind = id % 10;
        if (kind < 7) {
          filename = `activities/${id}.fit.gz`;
          files[filename] = gzipSync(fitFile(r));
        } else if (kind < 9) {
          filename = kind === 8 ? `activities/${id}.gpx.gz` : `activities/${id}.gpx`;
          const g = strToU8(gpxFile(r));
          files[filename] = kind === 8 ? gzipSync(g) : g;
        } else {
          filename = `activities/${id}.tcx.gz`;
          files[filename] = gzipSync(strToU8(tcxFile(r)));
        }
      }
      let media = '';
      if (r.race || (r.place.cc !== 'ES' && r.points)) {
        const pal = palettes[photoN % palettes.length];
        const path = `media/${(10000000 + photoN).toString(16)}-foto.png`;
        files[path] = png(480, 480, pal[0], pal[1]);
        media = path;
        photoN++;
      }
      Object.assign(row, {
        0: r.id, 1: esDate(r.startUtc), 2: r.name.es, 3: 'Carrera', 5: Math.round(r.elapsed),
        6: (r.distance / 1000).toFixed(2).replace('.', ','), 9: 'false', 11: r.gear, 12: filename,
        15: r.elapsed.toFixed(1), 16: r.moving.toFixed(1), 17: r.distance.toFixed(1), 18: '5.2', 19: (r.distance / r.moving).toFixed(3),
        20: r.elevGain.toFixed(1), 23: Number.isFinite(r.elevHigh) ? r.elevHigh.toFixed(1) : '', 30: r.maxHr.toFixed(1),
        31: r.avgHr.toFixed(1), 34: r.calories.toFixed(1), 86: media,
      });
      rows.push(row.map(csvCell).join(','));
    }
    for (const o of ath.others) {
      const row: (string | number)[] = new Array(nCols).fill('');
      Object.assign(row, {
        0: o.id, 1: esDate(o.startUtc), 2: o.typeRaw.es, 3: o.typeRaw.es, 5: o.moving, 6: (o.distance / 1000).toFixed(2).replace('.', ','),
        9: 'false', 15: o.moving.toFixed(1), 16: o.moving.toFixed(1), 17: o.distance.toFixed(1),
      });
      rows.push(row.map(csvCell).join(','));
    }
  }
  files['activities.csv'] = strToU8(rows.join('\n') + '\n');
  files['profile.csv'] = strToU8('Id. del deportista,Dirección de correo electrónico,Nombre,Apellidos,Sexo,Descripción,Peso,Ciudad,Estado,País\n123456,lucia@example.com,Lucía,García,F,,58.0,Madrid,Madrid,España\n');
  files['shoes.csv'] = strToU8('Nombre de la zapatilla,Marca de la zapatilla,Modelo de la zapatilla,Deportes predeterminados\nPegasus,Nike,Pegasus 41,Carrera\n');
  const zip = zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [`${k}`, [v, { level: k.endsWith('.gz') || k.endsWith('.png') ? 0 : 6 }]])));
  mkdirSync(join(root, 'samples'), { recursive: true });
  const out = join(root, 'samples', 'export_12345678.zip');
  writeFileSync(out, zip);
  console.log(`${out}: ${rows.length - 1} actividades, ${Object.keys(files).length} ficheros, ${(zip.length / 1e6).toFixed(1)} MB`);
}

// Solo al ejecutarlo directamente (el simulador importa los generadores de FIT/GPX/TCX).
if (process.argv[1] && /make-sample-export\.ts$/.test(process.argv[1].split('\\').join('/'))) main();
