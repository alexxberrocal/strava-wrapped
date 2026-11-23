export type Lang = 'es' | 'en';
export type Units = 'metric' | 'imperial';

const MONTHS = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const MONTHS_SHORT = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const WEEKDAYS = {
  es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};
const WEEKDAY_LETTERS = { es: ['L', 'M', 'X', 'J', 'V', 'S', 'D'], en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] };

const M_PER_MI = 1609.344;
const FT_PER_M = 3.28084;

const regionNames = new Map<Lang, Intl.DisplayNames | null>();
function regions(lang: Lang): Intl.DisplayNames | null {
  if (!regionNames.has(lang)) {
    try {
      regionNames.set(lang, new Intl.DisplayNames([lang], { type: 'region' }));
    } catch {
      regionNames.set(lang, null);
    }
  }
  return regionNames.get(lang)!;
}

/** Formatos de número, distancia, ritmo, fechas… coherentes en todos los navegadores. */
export class Fmt {
  constructor(
    public lang: Lang,
    public units: Units,
  ) {}

  t<T>(es: T, en: T): T {
    return this.lang === 'es' ? es : en;
  }

  get imperial() {
    return this.units === 'imperial';
  }

  /** Número con separador de miles siempre (también 1.011) y decimales fijos. */
  num(x: number, decimals = 0): string {
    if (!Number.isFinite(x)) return '–';
    const neg = x < 0;
    const fixed = Math.abs(x).toFixed(decimals);
    const [int, dec] = fixed.split('.');
    const sep = this.lang === 'es' ? '.' : ',';
    const dsep = this.lang === 'es' ? ',' : '.';
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return (neg ? '−' : '') + grouped + (dec ? dsep + dec : '');
  }

  /** Decimales solo si aportan (3,1 pero 27). */
  smart(x: number, maxDecimals = 1): string {
    if (Math.abs(x) >= 100 || maxDecimals === 0) return this.num(x, 0);
    const r = Number(x.toFixed(maxDecimals));
    return Number.isInteger(r) ? this.num(r, 0) : this.num(r, maxDecimals);
  }

  /** Números grandes: 3,0 M / 960 mil (o 3.0M / 960K). */
  big(x: number): { value: string; unit: string } {
    if (x >= 1e6) return { value: this.num(x / 1e6, x >= 1e7 ? 0 : 1), unit: this.t('M', 'M') };
    if (x >= 1e4) return { value: this.num(Math.round(x / 1000), 0), unit: this.t('MIL', 'K') };
    return { value: this.num(Math.round(x), 0), unit: '' };
  }

  // ---- Distancias ----
  distValue(m: number): number {
    return this.imperial ? m / M_PER_MI : m / 1000;
  }
  dist(m: number, decimals?: number): string {
    const v = this.distValue(m);
    const d = decimals ?? (v < 100 ? 1 : 0);
    return this.num(v, d);
  }
  get distUnit(): string {
    return this.imperial ? 'mi' : 'km';
  }
  distWithUnit(m: number, decimals?: number): string {
    return `${this.dist(m, decimals)} ${this.distUnit}`;
  }

  elevValue(m: number): number {
    return this.imperial ? m * FT_PER_M : m;
  }
  elev(m: number): string {
    return this.num(this.elevValue(m), 0);
  }
  get elevUnit(): string {
    return this.imperial ? 'ft' : 'm';
  }

  // ---- Tiempos ----
  /** s/m -> "5:24" por km o milla. */
  pace(sPerM: number): string {
    if (!Number.isFinite(sPerM) || sPerM <= 0) return '–';
    const s = sPerM * (this.imperial ? M_PER_MI : 1000);
    let mm = Math.floor(s / 60);
    let ss = Math.round(s - mm * 60);
    if (ss === 60) {
      mm++;
      ss = 0;
    }
    return `${mm}:${String(ss).padStart(2, '0')}`;
  }
  get paceUnit(): string {
    return this.imperial ? '/mi' : '/km';
  }
  /** Diferencia de ritmo en segundos por km/mi. */
  paceDeltaSeconds(sPerM: number): number {
    return Math.round(sPerM * (this.imperial ? M_PER_MI : 1000));
  }

  /** 47:12 o 1:45:20 */
  dur(sec: number): string {
    if (!Number.isFinite(sec)) return '–';
    const s = Math.round(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
  }

  /** 05:12 (es) / 5:12 AM (en) */
  clock(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    if (this.lang === 'es') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }

  // ---- Fechas ----
  date(d: { mo: number; d: number }): string {
    return this.lang === 'es' ? `${d.d} de ${MONTHS.es[d.mo - 1]}` : `${MONTHS.en[d.mo - 1]} ${d.d}`;
  }
  dateShort(d: { mo: number; d: number }): string {
    return this.lang === 'es' ? `${d.d} ${MONTHS_SHORT.es[d.mo - 1]}` : `${MONTHS_SHORT.en[d.mo - 1]} ${d.d}`;
  }
  month(i: number): string {
    return MONTHS[this.lang][i];
  }
  monthShort(i: number): string {
    return MONTHS_SHORT[this.lang][i];
  }
  weekday(i: number): string {
    return WEEKDAYS[this.lang][i];
  }
  weekdayLetter(i: number): string {
    return WEEKDAY_LETTERS[this.lang][i];
  }

  country(code: string): string {
    try {
      return regions(this.lang)?.of(code) ?? code;
    } catch {
      return code;
    }
  }

  temp(c: number): string {
    return this.imperial ? `${this.num(c * 1.8 + 32, 0)} °F` : `${this.num(c, 0)} °C`;
  }

  pct(x: number): string {
    return `${this.num(x * 100, 0)}%`;
  }

  /** Plural sencillo. */
  plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
  }
}
