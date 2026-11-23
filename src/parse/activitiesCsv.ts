import { cleanHeader, normKey, num, parseCsv } from './csv';
import { inferNumericOrder, parseDateParts, partsToUtcMs } from './dates';
import { classifySport, type SportCategory } from './sports';

/** Una fila de activities.csv ya interpretada. Unidades: metros, segundos, m/s, ppm. */
export interface CsvActivity {
  id: string;
  /** Inicio en UTC (ms). NaN si la fecha no se pudo leer. */
  startUtc: number;
  name: string;
  typeRaw: string;
  category: SportCategory;
  elapsed: number;
  moving: number;
  distance: number;
  elevGain: number;
  elevHigh: number;
  elevLow: number;
  maxSpeed: number;
  avgSpeed: number;
  maxHr: number;
  avgHr: number;
  avgCadence: number;
  calories: number;
  avgTemp: number;
  gear: string;
  filename: string;
  commute: boolean;
  race: boolean;
  steps: number;
  media: string[];
}

export interface CsvParseResult {
  activities: CsvActivity[];
  /** Idioma aproximado de las cabeceras (solo informativo). */
  headerLanguage: string;
  warnings: string[];
}

// Posiciones estables del export (iguales en en/es/de… comprobado con exports reales de 87 y 103 columnas).
const POS = {
  id: 0,
  date: 1,
  name: 2,
  type: 3,
  elapsedInt: 5,
  distanceDisplay: 6,
  maxHr1: 7,
  commute: 9,
  gear: 11,
  filename: 12,
  elapsed: 15,
  moving: 16,
  distance: 17,
  maxSpeed: 18,
  avgSpeed: 19,
  elevGain: 20,
  elevLow: 22,
  elevHigh: 23,
  avgCadence: 29,
  maxHr: 30,
  avgHr: 31,
  calories: 34,
  avgTemp: 36,
} as const;

// Nombres en inglés para exports antiguos/reordenados. [campo, nombre, nº de aparición]
const EN_NAMES: [keyof typeof POS, string, number][] = [
  ['id', 'activity id', 1],
  ['date', 'activity date', 1],
  ['name', 'activity name', 1],
  ['type', 'activity type', 1],
  ['elapsedInt', 'elapsed time', 1],
  ['distanceDisplay', 'distance', 1],
  ['maxHr1', 'max heart rate', 1],
  ['commute', 'commute', 1],
  ['gear', 'activity gear', 1],
  ['filename', 'filename', 1],
  ['elapsed', 'elapsed time', 2],
  ['moving', 'moving time', 1],
  ['distance', 'distance', 2],
  ['maxSpeed', 'max speed', 1],
  ['avgSpeed', 'average speed', 1],
  ['elevGain', 'elevation gain', 1],
  ['elevLow', 'elevation low', 1],
  ['elevHigh', 'elevation high', 1],
  ['avgCadence', 'average cadence', 1],
  ['maxHr', 'max heart rate', 2],
  ['avgHr', 'average heart rate', 1],
  ['calories', 'calories', 1],
  ['avgTemp', 'average temperature', 1],
];

const STEPS_NAMES = ['total steps', 'pasos en total', 'pasos totales', 'schritte gesamt', 'schritte insgesamt', 'nombre total de pas', 'passi totali', 'total de passos', 'totaal aantal stappen'];
const RACE_NAMES = ['competition', 'race', 'competencia', 'competicion', 'wettkampf', 'competition sportive', 'competizione', 'gara', 'competicao', 'wedstrijd'];
const MEDIA_NAMES = ['media', 'multimedia', 'medien', 'medias', 'midia', 'mídia'];

function detectLanguage(h0: string): string {
  const k = normKey(h0);
  if (k.startsWith('activity')) return 'en';
  if (k.includes('actividad')) return 'es';
  if (k.includes('aktivit')) return 'de';
  if (k.includes('activite')) return 'fr';
  if (k.includes('attivit')) return 'it';
  if (k.includes('atividade')) return 'pt';
  if (k.includes('activiteit')) return 'nl';
  return 'other';
}

function truthy(v: string | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === 'true' || s === '1' || s === '1.0' || s === 'yes' || s === 'sí' || s === 'si';
}

export function parseActivitiesCsv(text: string): CsvParseResult {
  const rows = parseCsv(text);
  const warnings: string[] = [];
  if (rows.length === 0) throw new Error('activities.csv está vacío');
  const headers = rows[0].map(cleanHeader);
  const keys = headers.map(normKey);
  const lang = detectLanguage(headers[0] ?? '');
  const body = rows.slice(1).filter((r) => r.length >= 4);

  // Mapa columna -> índice.
  const col: Record<string, number> = {};
  const useNames = lang === 'en' && keys.indexOf('activity id') === 0;
  if (useNames) {
    for (const [field, name, occ] of EN_NAMES) {
      let seen = 0;
      for (let i = 0; i < keys.length; i++) {
        if (keys[i] === name && ++seen === occ) {
          col[field] = i;
          break;
        }
      }
    }
  }
  for (const [field, idx] of Object.entries(POS)) {
    if (col[field] == null && idx < headers.length) col[field] = idx;
  }

  // Comprobación por contenido: la columna de fichero debe parecer "activities/123.fit.gz".
  const looksLikeFile = (i: number | undefined) =>
    i != null && body.some((r) => /^activities\//i.test(r[i] ?? ''));
  if (!looksLikeFile(col.filename)) {
    const found = headers.findIndex((_, i) => looksLikeFile(i));
    if (found !== -1) col.filename = found;
  }

  const findByNames = (names: string[]) => {
    const set = new Set(names.map(normKey));
    // Empezamos por el final: las columnas nuevas se añaden detrás.
    for (let i = keys.length - 1; i >= 0; i--) if (set.has(keys[i])) return i;
    return -1;
  };
  let mediaCol = findByNames(MEDIA_NAMES);
  if (mediaCol === -1) {
    for (let i = headers.length - 1; i > 12 && mediaCol === -1; i--) {
      if (body.some((r) => /^media\//i.test(r[i] ?? ''))) mediaCol = i;
    }
  }
  const stepsCol = findByNames(STEPS_NAMES);
  const raceCol = findByNames(RACE_NAMES);

  const order = inferNumericOrder(
    body.slice(0, 400).map((r) => r[col.date] ?? ''),
    lang === 'en',
  );

  const get = (r: string[], field: keyof typeof POS) => {
    const i = col[field];
    return i == null ? '' : (r[i] ?? '');
  };

  let badDates = 0;
  const activities: CsvActivity[] = [];
  for (const r of body) {
    const id = get(r, 'id').trim();
    if (!id) continue;
    const parts = parseDateParts(get(r, 'date'), order);
    if (!parts) badDates++;
    const typeRaw = get(r, 'type').trim();
    let distance = num(get(r, 'distance'));
    if (!Number.isFinite(distance)) {
      const disp = num(get(r, 'distanceDisplay'));
      distance = Number.isFinite(disp) ? (disp > 400 ? disp : disp * 1000) : 0;
    }
    let elapsed = num(get(r, 'elapsed'));
    if (!Number.isFinite(elapsed)) elapsed = num(get(r, 'elapsedInt'));
    let moving = num(get(r, 'moving'));
    if (!Number.isFinite(moving) || moving <= 0) moving = elapsed;
    let maxHr = num(get(r, 'maxHr'));
    if (!Number.isFinite(maxHr)) maxHr = num(get(r, 'maxHr1'));
    const commuteRaw = get(r, 'commute');
    const mediaRaw = mediaCol >= 0 ? (r[mediaCol] ?? '') : '';
    activities.push({
      id,
      startUtc: parts ? partsToUtcMs(parts) : NaN,
      name: get(r, 'name').trim(),
      typeRaw,
      category: classifySport(typeRaw),
      elapsed: Number.isFinite(elapsed) ? elapsed : 0,
      moving: Number.isFinite(moving) ? moving : 0,
      distance: Math.max(0, distance || 0),
      elevGain: num(get(r, 'elevGain')),
      elevHigh: num(get(r, 'elevHigh')),
      elevLow: num(get(r, 'elevLow')),
      maxSpeed: num(get(r, 'maxSpeed')),
      avgSpeed: num(get(r, 'avgSpeed')),
      maxHr,
      avgHr: num(get(r, 'avgHr')),
      avgCadence: num(get(r, 'avgCadence')),
      calories: num(get(r, 'calories')),
      avgTemp: num(get(r, 'avgTemp')),
      gear: get(r, 'gear').trim(),
      filename: get(r, 'filename').trim(),
      commute: truthy(commuteRaw),
      race: raceCol >= 0 ? truthy(r[raceCol]) : false,
      steps: stepsCol >= 0 ? num(r[stepsCol]) : NaN,
      media: mediaRaw
        .split('|')
        .map((s) => s.trim())
        .filter((s) => /^media\//i.test(s)),
    });
  }
  if (badDates > 0) warnings.push(`${badDates} actividades con fecha ilegible`);
  return { activities, headerLanguage: lang, warnings };
}

/** profile.csv -> nombre de pila (cabeceras también traducidas; la 3ª columna es el nombre). */
export function parseProfileFirstName(text: string): string | null {
  const rows = parseCsv(text);
  if (rows.length < 2) return null;
  const headers = rows[0].map((h) => normKey(cleanHeader(h)));
  const names = ['first name', 'nombre', 'vorname', 'prenom', 'nome', 'voornaam', 'imie', 'имя'];
  let idx = headers.findIndex((h) => names.includes(h));
  if (idx === -1) idx = 2;
  const v = (rows[1][idx] ?? '').trim();
  if (!v || v.includes('@') || /^\d+$/.test(v)) return null;
  return v;
}
