/**
 * Fechas de "activities.csv". Strava las escribe en UTC y en el idioma de la cuenta:
 *   en  "Oct 31, 2026, 9:49:58 AM"   (a veces con espacio estrecho U+202F antes de AM)
 *   es  "9 sept. 2018 17:26:30"      es-419 "2 ago 2026, 12:20:32 p.m."
 *   de  "16.10.2024, 15:57:17"       fr "31 oct. 2026, 09:49:58"   pt "31 de out. de 2026 09:49:58"
 *   ja  "2026/10/31 9:49:58"         zh "2026年10月31日 下午9:49:58"   ru "31 окт. 2026 г., 9:49:58"
 */

export type NumericOrder = 'DMY' | 'MDY';

export interface DateParts {
  y: number;
  mo: number; // 1-12
  d: number;
  h: number;
  mi: number;
  s: number;
}

const FULL: Record<string, number> = {
  juin: 6, juil: 7, juni: 6, juli: 7,
  // Ruso (genitivo y abreviaturas)
  мая: 5, май: 5, июн: 6, июл: 7,
};

const PREFIX3: Record<string, number> = {};
const add = (m: number, ...keys: string[]) => keys.forEach((k) => (PREFIX3[k] = m));
add(1, 'jan', 'ene', 'gen', 'oca', 'sty', 'янв');
add(2, 'feb', 'fev', 'sub', 'lut', 'фев');
add(3, 'mar', 'mrt', 'мар');
add(4, 'apr', 'abr', 'avr', 'nis', 'kwi', 'апр');
add(5, 'may', 'mai', 'mag', 'mei', 'maj');
add(6, 'jun', 'giu', 'haz', 'cze');
add(7, 'jul', 'lug', 'tem', 'lip');
add(8, 'aug', 'ago', 'aou', 'agu', 'sie', 'авг');
add(9, 'sep', 'set', 'eyl', 'wrz', 'сен');
add(10, 'oct', 'okt', 'ott', 'out', 'eki', 'paz', 'окт');
add(11, 'nov', 'kas', 'lis', 'ноя');
add(12, 'dec', 'dic', 'dez', 'des', 'ara', 'gru', 'дек');

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function monthFromToken(token: string): number | null {
  const t = stripAccents(token.toLowerCase()).replace(/\.$/, '');
  if (t.length < 3) return null;
  if (FULL[t] != null) return FULL[t];
  const four = t.slice(0, 4);
  if (FULL[four] != null) return FULL[four];
  const p = PREFIX3[t.slice(0, 3)];
  return p ?? null;
}

const PM = /(p\.?\s?m\.?|午後|下午|오후|μ\.?\s?μ\.?|nachm\.?)/i;
const AM = /(a\.?\s?m\.?|午前|上午|오전|π\.?\s?μ\.?|vorm\.?)/i;

/** Devuelve las partes de fecha/hora tal cual aparecen (Strava: UTC). */
export function parseDateParts(raw: string, order: NumericOrder = 'DMY'): DateParts | null {
  if (!raw) return null;
  let s = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!s) return null;

  // ISO directo.
  const iso = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (iso) {
    return { y: +iso[1], mo: +iso[2], d: +iso[3], h: +iso[4], mi: +iso[5], s: +(iso[6] ?? 0) };
  }

  // Hora.
  let h = 0, mi = 0, sec = 0;
  const tm = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (tm) {
    h = +tm[1];
    mi = +tm[2];
    sec = +(tm[3] ?? 0);
    const tail = s.slice(tm.index + tm[0].length);
    const head = s.slice(0, tm.index);
    // AM/PM puede ir antes (zh/ja/ko) o después (en/es) de la hora.
    const pm = PM.test(tail) || /(午後|下午|오후)\s*$/.test(head);
    const am = !pm && (AM.test(tail) || /(午前|上午|오전)\s*$/.test(head));
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    s = head.replace(/(午後|下午|오후|午前|上午|오전)\s*$/, ' ') + ' ' + tail.replace(PM, ' ').replace(AM, ' ');
  }

  // Año.
  const ym = /(?:^|\D)(19\d{2}|20\d{2})(?!\d)/.exec(s);
  if (!ym) return null;
  const y = +ym[1];
  const yearIdx = s.indexOf(ym[1], ym.index);
  const withoutYear = s.slice(0, yearIdx) + ' ' + s.slice(yearIdx + 4);

  // Mes por nombre.
  let mo: number | null = null;
  const words = withoutYear.match(/[\p{L}]+\.?/gu) ?? [];
  for (const w of words) {
    const m = monthFromToken(w);
    if (m != null) {
      mo = m;
      break;
    }
  }
  const nums = (withoutYear.match(/\d{1,2}/g) ?? []).map(Number);
  let d: number | null = null;
  if (mo != null) {
    d = nums.length ? nums[0] : null;
  } else {
    // Numérico: Y-M-D si el año va delante, si no D-M-Y / M-D-Y.
    if (nums.length < 2) return null;
    const yearFirst = yearIdx < (withoutYear.search(/\d/) === -1 ? Infinity : withoutYear.search(/\d/));
    if (yearFirst) {
      mo = nums[0];
      d = nums[1];
    } else {
      let [a, b] = nums;
      let ord = order;
      if (a > 12) ord = 'DMY';
      else if (b > 12) ord = 'MDY';
      if (ord === 'DMY') {
        d = a;
        mo = b;
      } else {
        mo = a;
        d = b;
      }
    }
  }
  if (mo == null || d == null) return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || sec > 60) return null;
  return { y, mo, d, h, mi, s: Math.min(sec, 59) };
}

export function partsToUtcMs(p: DateParts): number {
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
}

/**
 * Deduce el orden de las fechas numéricas de todo el fichero (solo importa si no hay nombres
 * de mes): si alguna tiene el primer número > 12 es D/M/Y; si el segundo > 12, M/D/Y.
 */
export function inferNumericOrder(samples: string[], englishHeaders: boolean): NumericOrder {
  let dmy = 0, mdy = 0;
  for (const raw of samples) {
    const s = raw.normalize('NFKC');
    const m = /(?:^|\D)(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(s);
    if (!m) continue;
    const a = +m[1], b = +m[2];
    if (a > 12 && b <= 12) dmy++;
    else if (b > 12 && a <= 12) mdy++;
  }
  if (dmy > mdy) return 'DMY';
  if (mdy > dmy) return 'MDY';
  return englishHeaders ? 'MDY' : 'DMY';
}
