/**
 * Fechas de "activities.csv". Strava las escribe en UTC y en el idioma de la cuenta (formato ICU
 * "medium"). Probado con ~60 idiomas (scripts/sim/dates-fuzz.ts), entre ellos todos los de Strava:
 *   en  "Oct 31, 2026, 9:49:58 AM"   (a veces con espacio estrecho U+202F antes de AM)
 *   es  "9 sept. 2018 17:26:30"      es-419 "2 ago 2026, 12:20:32 p.m."
 *   de  "16.10.2024, 15:57:17"       fr "31 oct. 2026, 09:49:58"   pt "31 de out. de 2026 09:49:58"
 *   ja  "2026/10/31 9:49:58"         zh "2026年10月31日 下午9:49:58"   ru "31 окт. 2026 г., 9:49:58"
 *   da  "23. jun. 2020, 10.08.59"    fi "28.5.2023 klo 18.02.06"   id "27 Mar 2016, 07.19.31"
 *   th  "31 ต.ค. 2569 09:49:58"      (calendario budista: 2569 = 2026)
 *   ms  "23 Ogo 2026, 11:36:28 PTG"  fr-CA "29 mai 2015, 02 h 24 min 35 s"
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

/** Prefijos de 4–5 letras (cuando 3 no bastan para distinguir el mes). */
const FULL: Record<string, number> = {
  juin: 6, juil: 7, juni: 6, juli: 7,
  // Ruso (genitivo y abreviaturas)
  мая: 5, май: 5, маи: 5, июн: 6, июл: 7,
  // Griego, estonio, lituano, checo (junio/julio se parecen)
  ιουν: 6, ιουλ: 7, juun: 6, juul: 7, rugp: 8, rugs: 9, cervn: 6, cerve: 7,
  // Finés: "marraskuuta" (noviembre) empieza como "mar" (marzo)
  marr: 11,
};

const PREFIX3: Record<string, number> = {};
const add = (m: number, ...keys: string[]) => keys.forEach((k) => (PREFIX3[k] = m));
add(1, 'jan', 'ene', 'gen', 'oca', 'sty', 'янв', 'січ', 'ιαν', 'ian', 'xan', 'urt', 'jaa', 'яну', 'sau', 'led', 'tam');
add(2, 'feb', 'fev', 'sub', 'lut', 'фев', 'лют', 'φεβ', 'ots', 'vee', 'peb', 'vas', 'uno', 'hel');
add(3, 'mar', 'mrt', 'мар', 'бер', 'μαρ', 'mac', 'kov', 'bre', 'maa');
add(4, 'apr', 'abr', 'avr', 'nis', 'kwi', 'апр', 'кві', 'απρ', 'api', 'bal', 'dub', 'huh');
add(5, 'may', 'mai', 'mag', 'mei', 'maj', 'тра', 'μαι', 'geg', 'kve', 'tou');
add(6, 'jun', 'giu', 'haz', 'cze', 'чер', 'iun', 'xun', 'eka', 'hun', 'юни', 'bir', 'kes');
add(7, 'jul', 'lug', 'tem', 'lip', 'лип', 'iul', 'xul', 'uzt', 'hul', 'юли', 'lie', 'hei');
add(8, 'aug', 'ago', 'aou', 'agu', 'sie', 'авг', 'сер', 'αυγ', 'abu', 'ogo', 'srp', 'avg', 'elo');
add(9, 'sep', 'set', 'eyl', 'wrz', 'сен', 'вер', 'σεπ', 'ira', 'сеп', 'zar', 'sze', 'syy');
add(10, 'oct', 'okt', 'ott', 'out', 'eki', 'paz', 'окт', 'жов', 'οκτ', 'urr', 'spa', 'rij', 'lok');
add(11, 'nov', 'kas', 'lis', 'ноя', 'лис', 'νοε', 'aza', 'nob', 'ное', 'lap', 'noi');
add(12, 'dec', 'dic', 'dez', 'des', 'ara', 'gru', 'дек', 'гру', 'δεκ', 'abe', 'det', 'dis', 'pro', 'jou');

/** Tailandés: abreviaturas con puntos entre letras (las largas primero). */
const THAI: [RegExp, number][] = [
  [/มกรา/, 1], [/กุมภา/, 2], [/มีนา/, 3], [/เมษา/, 4], [/พฤษภา/, 5], [/มิถุนา/, 6], [/กรกฎา/, 7], [/สิงหา/, 8], [/กันยา/, 9], [/ตุลา/, 10], [/พฤศจิกา/, 11], [/ธันวา/, 12],
  [/มี\.ค/, 3], [/เม\.ย/, 4], [/มิ\.ย/, 6], [/ม\.ค/, 1], [/ก\.พ/, 2], [/พ\.ค/, 5], [/ก\.ค/, 7], [/ส\.ค/, 8], [/ก\.ย/, 9], [/ต\.ค/, 10], [/พ\.ย/, 11], [/ธ\.ค/, 12],
];

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function monthFromToken(token: string): number | null {
  const t = stripAccents(token.toLowerCase()).replace(/\.$/, '');
  if (t === 'ag') return 8; // catalán "d’ag."
  if (t.length < 3) return null;
  if (FULL[t] != null) return FULL[t];
  for (const n of [5, 4, 3]) {
    const k = t.slice(0, n);
    if (k.length === n && FULL[k] != null) return FULL[k];
  }
  const p = PREFIX3[t.slice(0, 3)];
  return p ?? null;
}

// Marcas de tarde/mañana (antes o después de la hora según el idioma).
const PM_WORDS = /(p\.?\s?m\.?|午後|下午|晚上|中午|傍晚|오후|μ\.?\s?μ\.?|nachm\.?|\bptg\b)/i;
const AM_WORDS = /(a\.?\s?m\.?|午前|上午|凌晨|早上|清晨|오전|π\.?\s?μ\.?|vorm\.?|\bpg\b)/i;
const PM_HEAD = /(午後|下午|晚上|中午|傍晚|오후)\s*$/;
const AM_HEAD = /(午前|上午|凌晨|早上|清晨|오전)\s*$/;

interface TimeHit {
  index: number;
  length: number;
  h: number;
  mi: number;
  s: number;
}

/** Busca la hora: "9:49:58", "02 h 24 min 35 s" (fr-CA) o "18.02.06" (danés, finés, indonesio). */
function findTime(s: string): TimeHit | null {
  const colon = /(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if (colon) return { index: colon.index, length: colon[0].length, h: +colon[1], mi: +colon[2], s: +(colon[3] ?? 0) };
  const fr = /(\d{1,2})\s*h\s*(\d{2})(?:\s*min\s*(\d{2})\s*s)?/.exec(s);
  if (fr) return { index: fr.index, length: fr[0].length, h: +fr[1], mi: +fr[2], s: +(fr[3] ?? 0) };
  // Con puntos: la última coincidencia (la hora va detrás de la fecha) y con valores de hora.
  const re = /(?<![\d.])(\d{1,2})\.(\d{2})(?:\.(\d{2}))?(?![\d.])/g;
  let best: TimeHit | null = null;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    const h = +m[1], mi = +m[2], sec = +(m[3] ?? 0);
    if (h <= 23 && mi <= 59 && sec <= 59) best = { index: m.index, length: m[0].length, h, mi, s: sec };
  }
  return best;
}

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

  // Mes en tailandés (antes de que la hora y los puntos lo rompan).
  let mo: number | null = null;
  for (const [re, m] of THAI) {
    if (re.test(s)) {
      mo = m;
      s = s.replace(re, ' ');
      break;
    }
  }

  // Hora.
  let h = 0, mi = 0, sec = 0;
  const tm = findTime(s);
  if (tm) {
    h = tm.h;
    mi = tm.mi;
    sec = tm.s;
    const tail = s.slice(tm.index + tm.length);
    const head = s.slice(0, tm.index);
    // AM/PM puede ir antes (zh/ja/ko) o después (en/es) de la hora.
    const pm = PM_WORDS.test(tail) || PM_HEAD.test(head);
    const am = !pm && (AM_WORDS.test(tail) || AM_HEAD.test(head));
    if (pm && h < 12) h += 12;
    if (am && h === 12) h = 0;
    s = head.replace(/(午後|下午|晚上|中午|傍晚|오후|午前|上午|凌晨|早上|清晨|오전)\s*$/, ' ') + ' ' + tail.replace(PM_WORDS, ' ').replace(AM_WORDS, ' ');
  }

  // Año: 4 cifras (2569 en el calendario budista tailandés = 2026).
  let y: number | null = null;
  let withoutYear = s;
  let yearIdx = -1;
  const ym = /(?:^|\D)(19\d{2}|20\d{2}|25\d{2})(?!\d)/.exec(s);
  if (ym) {
    y = +ym[1];
    if (y >= 2400) y -= 543;
    yearIdx = s.indexOf(ym[1], ym.index);
    withoutYear = s.slice(0, yearIdx) + ' ' + s.slice(yearIdx + 4);
  }

  // Mes por nombre.
  if (mo == null) {
    const words = withoutYear.match(/[\p{L}]+\.?/gu) ?? [];
    for (const w of words) {
      const m = monthFromToken(w);
      if (m != null) {
        mo = m;
        break;
      }
    }
  }
  let d: number | null = null;
  if (y == null) {
    // Sin año de 4 cifras: fecha numérica corta "21.12.16" / "10/11/22" (año de 2 cifras al final).
    const short = /(\d{1,2})[./-](\d{1,2})[./-](\d{2})(?!\d)/.exec(withoutYear);
    if (!short) return null;
    y = 2000 + +short[3];
    let [a, b] = [+short[1], +short[2]];
    let ord = order;
    if (a > 12) ord = 'DMY';
    else if (b > 12) ord = 'MDY';
    if (ord === 'DMY') [d, mo] = [a, b];
    else [mo, d] = [a, b];
  } else if (mo != null) {
    const nums = (withoutYear.match(/\d{1,2}/g) ?? []).map(Number);
    d = nums.length ? nums[0] : null;
  } else {
    // Numérico: Y-M-D si el año va delante, si no D-M-Y / M-D-Y.
    const nums = (withoutYear.match(/\d{1,2}/g) ?? []).map(Number);
    if (nums.length < 2) return null;
    const yearFirst = yearIdx < (withoutYear.search(/\d/) === -1 ? Infinity : withoutYear.search(/\d/));
    if (yearFirst) {
      mo = nums[0];
      d = nums[1];
    } else {
      const [a, b] = nums;
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
  if (y == null || mo == null || d == null) return null;
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
    const m = /(?:^|\D)(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/.exec(s);
    if (!m) continue;
    const a = +m[1], b = +m[2];
    if (a > 12 && b <= 12) dmy++;
    else if (b > 12 && a <= 12) mdy++;
  }
  if (dmy > mdy) return 'DMY';
  if (mdy > dmy) return 'MDY';
  return englishHeaders ? 'MDY' : 'DMY';
}
