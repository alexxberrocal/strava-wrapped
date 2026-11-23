import { emptyTrack, pushPoint, type DecodedTrack } from './decoded';

/**
 * GPX y TCX con escaneo de texto (sin DOMParser: funciona dentro de un Web Worker y es rápido
 * con ficheros de varios MB). Tolera prefijos de espacio de nombres (gpxtpx:, ns3:...).
 */

function parseIsoSeconds(s: string | null): number {
  if (!s) return NaN;
  let iso = s.trim();
  if (!iso) return NaN;
  // Sin zona horaria -> UTC.
  if (!/[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso)) iso += 'Z';
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms / 1000 : NaN;
}

const tagCache = new Map<string, RegExp>();
function tagValue(block: string, tag: string): string | null {
  let re = tagCache.get(tag);
  if (!re) {
    re = new RegExp(`<(?:[\\w-]+:)?${tag}\\b[^>]*>([^<]*)<`, 'i');
    tagCache.set(tag, re);
  }
  const m = re.exec(block);
  return m ? m[1] : null;
}

function numOrNaN(v: string | null): number {
  if (v == null) return NaN;
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : NaN;
}

const ATTR_LAT = /\blat\s*=\s*["']([-+\d.eE]+)["']/;
const ATTR_LON = /\blon\s*=\s*["']([-+\d.eE]+)["']/;

export function decodeGpx(text: string): DecodedTrack {
  const out = emptyTrack();
  const typeM = /<(?:[\w-]+:)?trk\b[^>]*>[\s\S]*?<(?:[\w-]+:)?type\b[^>]*>([^<]*)</i.exec(text);
  if (typeM) out.sport = typeM[1].trim().toLowerCase() || null;

  const hasTrk = /<(?:[\w-]+:)?trkpt\b/i.test(text);
  const tag = hasTrk ? 'trkpt' : 'rtept';
  const re = new RegExp(`<(?:[\\w-]+:)?${tag}\\b([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}\\s*>)`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const attrs = m[1];
    const inner = m[2] ?? '';
    const la = ATTR_LAT.exec(attrs);
    const lo = ATTR_LON.exec(attrs);
    const lat = la ? parseFloat(la[1]) : NaN;
    const lon = lo ? parseFloat(lo[1]) : NaN;
    const time = parseIsoSeconds(tagValue(inner, 'time'));
    const ele = numOrNaN(tagValue(inner, 'ele'));
    const hr = numOrNaN(tagValue(inner, 'hr') ?? tagValue(inner, 'heartrate'));
    const cad = numOrNaN(tagValue(inner, 'cad') ?? tagValue(inner, 'cadence'));
    const temp = numOrNaN(tagValue(inner, 'atemp') ?? tagValue(inner, 'temp'));
    pushPoint(out, time, lat, lon, ele, hr > 0 && hr < 250 ? hr : NaN, cad, NaN, temp);
  }
  const firstTime = out.time.find((t) => Number.isFinite(t));
  const meta = /<(?:[\w-]+:)?metadata\b[\s\S]*?<(?:[\w-]+:)?time\b[^>]*>([^<]*)</i.exec(text);
  const start = firstTime ?? (meta ? parseIsoSeconds(meta[1]) : NaN);
  out.startTime = Number.isFinite(start) ? start : null;
  return out;
}

export function decodeTcx(text: string): DecodedTrack {
  const out = emptyTrack();
  const sp = /<(?:[\w-]+:)?Activity\b[^>]*\bSport\s*=\s*["']([^"']+)["']/i.exec(text);
  if (sp) out.sport = sp[1].toLowerCase();
  const re = /<(?:[\w-]+:)?Trackpoint\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?Trackpoint\s*>/gi;
  const hrRe = /<(?:[\w-]+:)?HeartRateBpm\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?HeartRateBpm\s*>/i;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const b = m[1];
    const time = parseIsoSeconds(tagValue(b, 'Time'));
    const lat = numOrNaN(tagValue(b, 'LatitudeDegrees'));
    const lon = numOrNaN(tagValue(b, 'LongitudeDegrees'));
    const alt = numOrNaN(tagValue(b, 'AltitudeMeters'));
    const dist = numOrNaN(tagValue(b, 'DistanceMeters'));
    let hr = NaN;
    const hrBlock = hrRe.exec(b);
    if (hrBlock) hr = numOrNaN(tagValue(hrBlock[1], 'Value'));
    let cad = numOrNaN(tagValue(b, 'RunCadence'));
    if (!Number.isFinite(cad)) cad = numOrNaN(tagValue(b, 'Cadence'));
    pushPoint(out, time, lat, lon, alt, hr > 0 && hr < 250 ? hr : NaN, cad, dist, NaN);
  }
  const lap = /<(?:[\w-]+:)?Lap\b[^>]*\bStartTime\s*=\s*["']([^"']+)["']/i.exec(text);
  const firstTime = out.time.find((t) => Number.isFinite(t));
  const start = firstTime ?? (lap ? parseIsoSeconds(lap[1]) : NaN);
  out.startTime = Number.isFinite(start) ? start : null;
  return out;
}
