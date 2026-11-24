/**
 * Mensajes con variables y plurales al estilo ICU, sin dependencias:
 *   "{n} km"                                      → variable
 *   "{n, plural, one {# carrera} other {# carreras}}" → plural según el idioma (Intl.PluralRules),
 *                                                    con "#" = el número ya formateado
 * Las reglas de plural de cada idioma vienen de Intl (el ruso tiene one/few/many/other…).
 */
export type Vars = Record<string, string | number>;

const rulesCache = new Map<string, Intl.PluralRules>();
function rules(locale: string): Intl.PluralRules {
  let r = rulesCache.get(locale);
  if (!r) {
    r = new Intl.PluralRules(locale);
    rulesCache.set(locale, r);
  }
  return r;
}

/** Busca la llave de cierre que empareja con la de apertura en `i`. */
function closing(s: string, i: number): number {
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === '{') depth++;
    else if (s[k] === '}') {
      depth--;
      if (depth === 0) return k;
    }
  }
  return -1;
}

export function formatMessage(msg: string, vars: Vars, locale: string, numFmt: (n: number) => string): string {
  let out = '';
  for (let i = 0; i < msg.length; i++) {
    const c = msg[i];
    if (c !== '{') {
      out += c;
      continue;
    }
    const end = closing(msg, i);
    if (end === -1) {
      out += msg.slice(i);
      break;
    }
    const body = msg.slice(i + 1, end);
    const m = /^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/.exec(body);
    if (m) {
      const name = m[1];
      const raw = vars[name];
      const n = typeof raw === 'number' ? raw : Number(raw);
      const options = parseOptions(m[2]);
      const exact = options.get(`=${n}`);
      const cat = Number.isFinite(n) ? rules(locale).select(n) : 'other';
      const branch = exact ?? options.get(cat) ?? options.get('other') ?? '';
      const shown = typeof raw === 'number' ? numFmt(raw) : String(raw ?? '');
      out += formatMessage(branch, vars, locale, numFmt).split('#').join(shown);
    } else {
      const v = vars[body.trim()];
      out += v == null ? `{${body}}` : typeof v === 'number' ? numFmt(v) : v;
    }
    i = end;
  }
  return out;
}

/** "one {…} few {…} other {…}" → mapa categoría → texto. */
function parseOptions(s: string): Map<string, string> {
  const out = new Map<string, string>();
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    const k0 = i;
    while (i < s.length && s[i] !== '{' && !/\s/.test(s[i])) i++;
    const key = s.slice(k0, i);
    while (i < s.length && s[i] !== '{') i++;
    if (i >= s.length) break;
    const end = closing(s, i);
    if (end === -1) break;
    out.set(key, s.slice(i + 1, end));
    i = end + 1;
  }
  return out;
}
