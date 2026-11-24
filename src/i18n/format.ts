import { LOCALE, NO_CASE, type Lang } from './langs';
import { formatMessage, type Vars } from './message';
import { es, type CardKey, type CardMessages } from './cards/es';
import en from './cards/en';

export type { Lang } from './langs';
export type Units = 'metric' | 'imperial';

const M_PER_MI = 1609.344;
const FT_PER_M = 3.28084;

// ---------------- Catálogos de las tarjetas (el español va siempre; el resto se carga al usarlo)
const catalogs = new Map<Lang, CardMessages>([
  ['es', es],
  ['en', en],
]);
// Imports explícitos (Vite los separa en trozos; tsx/Node también los entiende).
const loaders: Partial<Record<Lang, () => Promise<{ default: CardMessages }>>> = {
  ca: () => import('./cards/ca'),
  fr: () => import('./cards/fr'),
  de: () => import('./cards/de'),
  it: () => import('./cards/it'),
  pt: () => import('./cards/pt'),
  nl: () => import('./cards/nl'),
  ru: () => import('./cards/ru'),
  zh: () => import('./cards/zh'),
  ja: () => import('./cards/ja'),
  ko: () => import('./cards/ko'),
};

/** Carga los textos de las tarjetas de un idioma (antes de dibujar). */
export async function loadCardMessages(lang: Lang): Promise<void> {
  if (catalogs.has(lang)) return;
  const load = loaders[lang];
  if (!load) return;
  try {
    const mod = await load();
    catalogs.set(lang, mod.default);
  } catch {
    /* sin red: se usa el español */
  }
}

/** Todo el texto del catálogo de un idioma (para precargar las letras de su tipografía). */
export function cardMessagesText(lang: Lang): string {
  return Object.values(catalogs.get(lang) ?? es).join(' ');
}

/** Para Node (simulador, tests): registra un catálogo ya importado. */
export function registerCardMessages(lang: Lang, messages: CardMessages) {
  catalogs.set(lang, messages);
}

/**
 * Contracciones que dependen del nombre que entra en la frase: "de Olot" → "d’Olot", "a el Caire" →
 * "al Caire" (catalán), "de Amsterdam" → "d’Amsterdam", "à Le Caire" → "au Caire" (francés),
 * "a Il Cairo" → "al Cairo" (italiano). Toleran el "**" del resaltado entre medias.
 */
const V = 'AEIOUÀÈÉÍÏÒÓÚÜaeiouàèéíïòóúü';
const CONTRACTIONS: Partial<Record<Lang, [RegExp, string][]>> = {
  ca: [
    [new RegExp(String.raw`\b([Dd])e (\*\*)?(?=[${V}Hh]|1(?![\d,.])|11(?![\d,.]))`, 'g'), '$1’$2'],
    [/\b([Dd])e(\s)(\*\*)?el /g, '$1el$2$3'],
    [/\b([Dd])e(\s)(\*\*)?els /g, '$1els$2$3'],
    [/\b([Aa])(\s)(\*\*)?el /g, '$1l$2$3'],
    [/\b([Aa])(\s)(\*\*)?els /g, '$1ls$2$3'],
    [/\b([Pp])er(\s)(\*\*)?el /g, '$1el$2$3'],
  ],
  fr: [
    [new RegExp(String.raw`\b([Dd])e (\*\*)?(?=[${V}YyÂâÊêÎîÔôÛûŒœ])`, 'g'), '$1’$2'],
    [/(^|\s)([Àà])(\s)(\*\*)?Le /g, '$1au$3$4'],
    [/(^|\s)([Àà])(\s)(\*\*)?Les /g, '$1aux$3$4'],
    [/\b([Dd])e(\s)(\*\*)?Le /g, '$1u$2$3'],
    [/\b([Dd])e(\s)(\*\*)?Les /g, '$1es$2$3'],
    // Espacio fino irrompible antes de : ; ! ? (tipografía francesa: nunca empiezan línea).
    [/ ([:;!?])/g, ' $1'],
  ],
  it: [
    [/\b([Aa])(\s)(\*\*)?Il /g, '$1l$2$3'],
    [/\b([Dd])a(\s)(\*\*)?Il /g, '$1al$2$3'],
    [/\b([Dd])i(\s)(\*\*)?Il /g, '$1el$2$3'],
    [/\b([Aa])(\s)(\*\*)?L’/g, '$1ll’$3'],
    [/\b([Dd])a(\s)(\*\*)?L’/g, '$1all’$3'],
    [/\b([Dd])i(\s)(\*\*)?L’/g, '$1ell’$3'],
  ],
};

const cache = new Map<string, unknown>();
function memo<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

/** Formatos de número, distancia, ritmo, fechas… coherentes en todos los navegadores e idiomas. */
export class Fmt {
  readonly locale: string;
  private msgs: CardMessages;
  private sep: { group: string; decimal: string };

  constructor(
    public lang: Lang,
    public units: Units,
  ) {
    this.locale = LOCALE[lang] ?? 'es-ES';
    this.msgs = catalogs.get(lang) ?? es;
    this.sep = memo(`sep:${this.locale}`, () => {
      const parts = new Intl.NumberFormat(this.locale).formatToParts(12345.6);
      return {
        group: parts.find((p) => p.type === 'group')?.value ?? ',',
        decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
      };
    });
  }

  /** Texto de las tarjetas con variables y plurales (y las contracciones del idioma). */
  m(key: CardKey, vars: Vars = {}): string {
    const msg = this.msgs[key] ?? es[key] ?? key;
    let out = formatMessage(msg, vars, this.locale, (n) => this.smart(n, 1));
    for (const [re, to] of CONTRACTIONS[this.lang] ?? []) out = out.replace(re, to);
    return out;
  }

  /** Titular de varias líneas ("\n"). */
  lines(key: CardKey, vars: Vars = {}): string[] {
    return this.m(key, vars).split('\n');
  }

  /** Mayúsculas según el idioma (en chino, japonés y coreano no cambia nada). */
  upper(s: string): string {
    return NO_CASE.has(this.lang) ? s : s.toLocaleUpperCase(this.locale);
  }

  /** ¿El idioma tiene mayúsculas y se puede espaciar letra a letra? */
  get cased(): boolean {
    return !NO_CASE.has(this.lang);
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
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, this.sep.group);
    const out = grouped + (dec ? this.sep.decimal + dec : '');
    return neg && out.replace(/[0.,\s  ]/g, '') ? `−${out}` : out;
  }

  /** Decimales solo si aportan (3,1 pero 27). */
  smart(x: number, maxDecimals = 1): string {
    if (Math.abs(x) >= 100 || maxDecimals === 0) return this.num(x, 0);
    const r = Number(x.toFixed(maxDecimals));
    return Number.isInteger(r) ? this.num(r, 0) : this.num(r, maxDecimals);
  }

  /** Redondea como `smart` (para que el plural cuadre con la cifra que se ve). */
  round(x: number, maxDecimals = 1): number {
    if (Math.abs(x) >= 100 || maxDecimals === 0) return Math.round(x);
    return Number(x.toFixed(maxDecimals));
  }

  /** Números grandes: 3,0 M / 960 mil (o 3.0M / 960K; en chino/japonés 61,2万, en coreano 61.2만). */
  big(x: number): { value: string; unit: string } {
    if (this.lang === 'zh' || this.lang === 'ja' || this.lang === 'ko') {
      const [wan, yi] = this.lang === 'ko' ? ['만', '억'] : this.lang === 'ja' ? ['万', '億'] : ['万', '亿'];
      if (x >= 1e8) return { value: this.num(x / 1e8, x >= 1e9 ? 0 : 1), unit: yi };
      if (x >= 1e4) return { value: this.num(x / 1e4, x >= 1e5 ? 0 : 1), unit: wan };
      return { value: this.num(Math.round(x), 0), unit: '' };
    }
    if (x >= 1e6) return { value: this.num(x / 1e6, x >= 1e7 ? 0 : 1), unit: this.upper(this.m('unit.million')) };
    if (x >= 1e4) return { value: this.num(Math.round(x / 1000), 0), unit: this.upper(this.m('unit.thousand')) };
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
    return this.m(this.imperial ? 'unit.mi' : 'unit.km');
  }
  distWithUnit(m: number, decimals?: number): string {
    return `${this.dist(m, decimals)} ${this.distUnit}`;
  }

  elevValue(m: number): number {
    return this.imperial ? m * FT_PER_M : m;
  }
  elev(m: number): string {
    return this.num(this.elevValue(m), 0);
  }
  get elevUnit(): string {
    return this.m(this.imperial ? 'unit.ft' : 'unit.m');
  }
  elevWithUnit(m: number): string {
    return `${this.elev(m)} ${this.elevUnit}`;
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
    return `/${this.distUnit}`;
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

  /** 05:12 (24 h) o 5:12 AM (inglés). */
  clock(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    if (this.lang !== 'en') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  /** Hora en punto: "19:00" o "7 PM". */
  hour(h: number): string {
    return this.lang === 'en' ? this.clock(h * 60).replace(':00', '') : `${String(h).padStart(2, '0')}:00`;
  }

  // ---- Fechas (Intl) ----
  private dtf(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    return memo(`dtf:${this.locale}:${JSON.stringify(opts)}`, () => new Intl.DateTimeFormat(this.locale, { ...opts, timeZone: 'UTC' }));
  }
  private utc(d: { y?: number; mo: number; d: number }): Date {
    return new Date(Date.UTC(d.y ?? 2026, d.mo - 1, d.d, 12));
  }
  /** "3 de marzo", "March 3", "3 mars", "3. März", "3月3日"… */
  date(d: { y?: number; mo: number; d: number }): string {
    return this.dtf({ day: 'numeric', month: 'long' }).format(this.utc(d));
  }
  /**
   * Fecha con el artículo/preposición que pide el idioma delante: "el 3 de marzo", "l’1 de març",
   * "le 1er mars", "am 3. März", "on March 3", "il 3 marzo", "l’8 marzo", "em 3 de março"…
   */
  dateArt(d: { y?: number; mo: number; d: number }): string {
    const plain = this.date(d);
    switch (this.lang) {
      case 'es':
        return `el ${plain}`;
      case 'ca':
        return d.d === 1 || d.d === 11 ? `l’${plain}` : `el ${plain}`;
      case 'fr':
        return `le ${d.d === 1 ? plain.replace(/^1(?=\s)/, '1er') : plain}`;
      case 'it':
        return d.d === 1 || d.d === 8 || d.d === 11 ? `l’${plain}` : `il ${plain}`;
      case 'pt':
        return `em ${plain}`;
      case 'de':
        return `am ${plain}`;
      case 'en':
        return `on ${plain}`;
      case 'nl':
        return `op ${plain}`;
      default:
        return plain;
    }
  }
  /** "3 mar", "Mar 3"… (sin punto final de abreviatura). */
  dateShort(d: { y?: number; mo: number; d: number }): string {
    return this.dtf({ day: 'numeric', month: 'short' }).format(this.utc(d)).replace(/\.$/, '');
  }
  /** "del 3 al 9 de marzo" (es/ca) o el rango de Intl ("Mar 3 – 9", "3–9 mars"…). */
  dateRange(a: { y?: number; mo: number; d: number }, b: { y?: number; mo: number; d: number }, short = false): string {
    if (this.lang === 'es') return `del ${a.mo === b.mo ? a.d : this.date(a)} al ${this.date(b)}`;
    if (this.lang === 'ca') {
      // "de l’1 a l’11 d’abril" (apostrofació davant d’1 i 11)
      const vowel = (n: number) => n === 1 || n === 11;
      const from = a.mo === b.mo ? String(a.d) : this.date(a);
      return `${vowel(a.d) ? 'de l’' : 'del '}${from} ${vowel(b.d) ? 'a l’' : 'al '}${this.date(b)}`;
    }
    const f = this.dtf({ day: 'numeric', month: short ? 'short' : 'long' });
    try {
      return f.formatRange(this.utc(a), this.utc(b));
    } catch {
      return `${f.format(this.utc(a))} – ${f.format(this.utc(b))}`;
    }
  }
  /** Nombre del mes (forma suelta: "marzo", "март", "3月"). */
  month(i: number): string {
    return this.dtf({ month: 'long' }).format(new Date(Date.UTC(2026, i, 15)));
  }
  monthShort(i: number): string {
    return this.dtf({ month: 'short' }).format(new Date(Date.UTC(2026, i, 15))).replace(/\.$/, '');
  }
  /** Inicial del mes para ejes ("E F M…", "J F M…", "1月"→"1"). */
  monthLetter(i: number): string {
    if (!this.cased) return String(i + 1);
    return this.dtf({ month: 'narrow' }).format(new Date(Date.UTC(2026, i, 15))).toLocaleUpperCase(this.locale);
  }
  /** Día de la semana (0 = lunes). */
  weekday(i: number): string {
    return this.dtf({ weekday: 'long' }).format(new Date(Date.UTC(2026, 0, 5 + i, 12)));
  }
  weekdayShort(i: number): string {
    return this.dtf({ weekday: 'short' }).format(new Date(Date.UTC(2026, 0, 5 + i, 12))).replace(/\.$/, '');
  }
  weekdayLetter(i: number): string {
    if (this.lang === 'es') return ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i];
    if (this.lang === 'ca') return ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'][i];
    return this.dtf({ weekday: 'narrow' }).format(new Date(Date.UTC(2026, 0, 5 + i, 12)));
  }

  country(code: string): string {
    try {
      const dn = memo(`dn:${this.locale}`, () => {
        try {
          return new Intl.DisplayNames([this.locale], { type: 'region' });
        } catch {
          return null;
        }
      });
      return dn?.of(code) ?? code;
    } catch {
      return code;
    }
  }

  temp(c: number): string {
    return this.imperial ? `${this.num(c * 1.8 + 32, 0)} °F` : `${this.num(c, 0)} °C`;
  }

  /** Porcentaje según el idioma ("12 %", "12%", "12 %"), con decimales solo si aportan. */
  pct(x: number, maxDecimals = 0): string {
    if (!Number.isFinite(x)) return '–';
    const p = memo(`pct:${this.locale}:${maxDecimals}`, () => new Intl.NumberFormat(this.locale, { style: 'percent', maximumFractionDigits: maxDecimals }));
    const k = 10 ** maxDecimals;
    return p.format(Math.round(x * 100 * k) / k / 100).replace(/\s/g, ' ');
  }

  /** Plural del idioma para una cantidad (one/few/many/other). */
  plural(n: number, one: string, many: string): string {
    return n === 1 ? one : many;
  }
}
