import { emptyTrack, pushPoint, type DecodedTrack } from './decoded';

/**
 * Decodificador FIT mínimo y rápido (protocolo Garmin FIT 1.0/2.0). Solo extrae lo que
 * necesitamos: puntos (record), deporte (session/sport) y hora local (activity).
 * Soporta cabeceras de 12/14 bytes, arquitectura little/big endian, timestamps comprimidos,
 * campos de desarrollador y ficheros FIT encadenados.
 */

const FIT_EPOCH = 631065600; // 1989-12-31T00:00:00Z en segundos Unix
const SEMICIRCLE = 180 / 2147483648;
const BASE_SIZES = [1, 1, 1, 2, 2, 4, 4, 1, 4, 8, 1, 2, 4, 1, 8, 8, 8];

const SPORTS: Record<number, string> = {
  0: 'generic', 1: 'running', 2: 'cycling', 4: 'fitness_equipment', 5: 'swimming', 10: 'training',
  11: 'walking', 12: 'cross_country_skiing', 13: 'alpine_skiing', 14: 'snowboarding', 15: 'rowing',
  16: 'mountaineering', 17: 'hiking', 19: 'paddling', 21: 'e_biking',
};
const SUB_SPORTS: Record<number, string> = {
  1: 'treadmill', 2: 'street', 3: 'trail', 4: 'track', 6: 'indoor_cycling', 7: 'road', 8: 'mountain',
  45: 'virtual_activity', 58: 'virtual_activity',
};

// Tipos de campo que nos interesan (índices internos).
const F_TS = 1, F_LAT = 2, F_LON = 3, F_ALT = 4, F_EALT = 5, F_HR = 6, F_CAD = 7, F_FCAD = 8,
  F_DIST = 9, F_TEMP = 10, F_SPORT = 11, F_SUB = 12, F_START = 13, F_LOCALTS = 14;

interface WantedField {
  kind: number;
  offset: number;
  bt: number;
  size: number;
}

interface MsgDef {
  global: number;
  le: boolean;
  size: number;
  wanted: WantedField[];
}

function wantedKind(global: number, num: number): number {
  switch (global) {
    case 20: // record
      switch (num) {
        case 253: return F_TS;
        case 0: return F_LAT;
        case 1: return F_LON;
        case 2: return F_ALT;
        case 78: return F_EALT;
        case 3: return F_HR;
        case 4: return F_CAD;
        case 53: return F_FCAD;
        case 5: return F_DIST;
        case 13: return F_TEMP;
      }
      return 0;
    case 18: // session
      if (num === 5) return F_SPORT;
      if (num === 6) return F_SUB;
      if (num === 2) return F_START;
      if (num === 253) return F_TS;
      return 0;
    case 12: // sport
      if (num === 0) return F_SPORT;
      if (num === 1) return F_SUB;
      return 0;
    case 34: // activity
      if (num === 253) return F_TS;
      if (num === 5) return F_LOCALTS;
      return 0;
    default:
      return num === 253 ? F_TS : 0;
  }
}

function readValue(dv: DataView, off: number, bt: number, size: number, le: boolean): number {
  const t = bt & 0x1f;
  const bs = BASE_SIZES[t] ?? 1;
  if (size < bs) return NaN;
  let v: number;
  switch (t) {
    case 0: // enum
    case 2: // uint8
    case 13: // byte
      v = dv.getUint8(off);
      return v === 0xff ? NaN : v;
    case 1:
      v = dv.getInt8(off);
      return v === 0x7f ? NaN : v;
    case 3:
      v = dv.getInt16(off, le);
      return v === 0x7fff ? NaN : v;
    case 4:
      v = dv.getUint16(off, le);
      return v === 0xffff ? NaN : v;
    case 5:
      v = dv.getInt32(off, le);
      return v === 0x7fffffff ? NaN : v;
    case 6:
      v = dv.getUint32(off, le);
      return v === 0xffffffff ? NaN : v;
    case 8:
      v = dv.getFloat32(off, le);
      return Number.isFinite(v) ? v : NaN;
    case 9:
      v = dv.getFloat64(off, le);
      return Number.isFinite(v) ? v : NaN;
    case 10:
      v = dv.getUint8(off);
      return v === 0 ? NaN : v;
    case 11:
      v = dv.getUint16(off, le);
      return v === 0 ? NaN : v;
    case 12:
      v = dv.getUint32(off, le);
      return v === 0 ? NaN : v;
    default:
      return NaN;
  }
}

export function isFit(buf: Uint8Array): boolean {
  return buf.length >= 12 && buf[8] === 0x2e && buf[9] === 0x46 && buf[10] === 0x49 && buf[11] === 0x54;
}

export function decodeFit(buf: Uint8Array): DecodedTrack {
  const out = emptyTrack();
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let pos = 0;
  let activityTs = NaN;
  let localTs = NaN;
  let sessionSport = NaN;
  let sessionSub = NaN;
  let sportSport = NaN;
  let sportSub = NaN;
  let sessionStart = NaN;

  while (pos + 12 <= buf.length) {
    const headerSize = buf[pos];
    if (headerSize < 12 || !(buf[pos + 8] === 0x2e && buf[pos + 9] === 0x46 && buf[pos + 10] === 0x49 && buf[pos + 11] === 0x54)) break;
    const dataSize = dv.getUint32(pos + 4, true);
    let p = pos + headerSize;
    const end = Math.min(buf.length, p + dataSize);
    const defs: (MsgDef | undefined)[] = new Array(16);
    let lastTs = 0;

    try {
      while (p < end) {
        const h = buf[p++];
        let def: MsgDef | undefined;
        let compressedTs = NaN;
        if (h & 0x80) {
          def = defs[(h >> 5) & 0x3];
          const off = h & 0x1f;
          const base = (lastTs & ~0x1f) >>> 0;
          compressedTs = off >= (lastTs & 0x1f) ? base + off : base + off + 0x20;
          lastTs = compressedTs;
        } else if (h & 0x40) {
          // Mensaje de definición
          const local = h & 0x0f;
          const hasDev = (h & 0x20) !== 0;
          p++; // reservado
          const le = buf[p++] === 0;
          const global = dv.getUint16(p, le);
          p += 2;
          const nFields = buf[p++];
          const wanted: WantedField[] = [];
          let size = 0;
          for (let i = 0; i < nFields; i++) {
            const num = buf[p];
            const fsize = buf[p + 1];
            const bt = buf[p + 2];
            p += 3;
            const kind = wantedKind(global, num);
            if (kind) wanted.push({ kind, offset: size, bt, size: fsize });
            size += fsize;
          }
          if (hasDev) {
            const nDev = buf[p++];
            for (let i = 0; i < nDev; i++) {
              size += buf[p + 1];
              p += 3;
            }
          }
          defs[local] = { global, le, size, wanted };
          continue;
        } else {
          def = defs[h & 0x0f];
        }
        if (!def) throw new Error('FIT: mensaje sin definición');
        if (p + def.size > buf.length) break;

        const g = def.global;
        if (g === 20 || g === 18 || g === 12 || g === 34 || def.wanted.length) {
          let ts = compressedTs, lat = NaN, lon = NaN, alt = NaN, ealt = NaN, hr = NaN, cad = NaN,
            fcad = NaN, dist = NaN, temp = NaN, sport = NaN, sub = NaN, start = NaN, lts = NaN;
          for (const f of def.wanted) {
            const v = readValue(dv, p + f.offset, f.bt, f.size, def.le);
            switch (f.kind) {
              case F_TS: if (Number.isFinite(v)) { ts = v; lastTs = v; } break;
              case F_LAT: lat = v; break;
              case F_LON: lon = v; break;
              case F_ALT: alt = v; break;
              case F_EALT: ealt = v; break;
              case F_HR: hr = v; break;
              case F_CAD: cad = v; break;
              case F_FCAD: fcad = v; break;
              case F_DIST: dist = v; break;
              case F_TEMP: temp = v; break;
              case F_SPORT: sport = v; break;
              case F_SUB: sub = v; break;
              case F_START: start = v; break;
              case F_LOCALTS: lts = v; break;
            }
          }
          if (g === 20) {
            const tt = Number.isFinite(ts) ? ts : lastTs;
            const altitude = Number.isFinite(ealt) ? ealt / 5 - 500 : Number.isFinite(alt) ? alt / 5 - 500 : NaN;
            const cadence = Number.isFinite(cad) ? cad + (Number.isFinite(fcad) ? fcad / 128 : 0) : NaN;
            pushPoint(
              out,
              tt + FIT_EPOCH,
              Number.isFinite(lat) ? lat * SEMICIRCLE : NaN,
              Number.isFinite(lon) ? lon * SEMICIRCLE : NaN,
              altitude,
              hr > 0 && hr < 250 ? hr : NaN,
              cadence,
              Number.isFinite(dist) ? dist / 100 : NaN,
              Number.isFinite(temp) ? temp : NaN,
            );
          } else if (g === 18) {
            if (Number.isFinite(sport) && !Number.isFinite(sessionSport)) sessionSport = sport;
            if (Number.isFinite(sub) && !Number.isFinite(sessionSub)) sessionSub = sub;
            if (Number.isFinite(start) && !Number.isFinite(sessionStart)) sessionStart = start;
          } else if (g === 12) {
            if (Number.isFinite(sport)) sportSport = sport;
            if (Number.isFinite(sub)) sportSub = sub;
          } else if (g === 34) {
            if (Number.isFinite(ts)) activityTs = ts;
            if (Number.isFinite(lts)) localTs = lts;
          }
        }
        p += def.size;
      }
    } catch {
      // Fichero truncado o corrupto: nos quedamos con lo leído.
      break;
    }
    pos = pos + headerSize + dataSize + 2;
  }

  const sport = Number.isFinite(sessionSport) ? sessionSport : sportSport;
  const sub = Number.isFinite(sessionSub) ? sessionSub : sportSub;
  out.sport = Number.isFinite(sport) ? (SPORTS[sport] ?? `sport_${sport}`) : null;
  out.subSport = Number.isFinite(sub) ? (SUB_SPORTS[sub] ?? null) : null;
  out.startTime = Number.isFinite(sessionStart) ? sessionStart + FIT_EPOCH : (out.time[0] ?? null);
  if (Number.isFinite(localTs) && Number.isFinite(activityTs)) {
    const off = localTs - activityTs;
    if (Math.abs(off) <= 14 * 3600) out.localOffset = Math.round(off / 900) * 900;
  }
  return out;
}
