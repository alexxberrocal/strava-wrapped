import type { Lang } from '../i18n/langs';
import type { CsvActivity } from '../parse/activitiesCsv';
import type { SportCategory } from '../parse/sports';
import type { TrackSummary } from '../parse/track';
import type { City } from '../geo/cities';

export interface LocalTime {
  y: number;
  mo: number; // 1-12
  d: number;
  h: number;
  mi: number;
  /** 0 = lunes … 6 = domingo */
  dow: number;
  /** Día del año, 0 = 1 de enero */
  doy: number;
  key: string; // YYYY-MM-DD
}

export interface Activity {
  id: string;
  csv: CsvActivity;
  category: SportCategory;
  startUtc: number;
  offsetMin: number;
  tz: string | null;
  local: LocalTime;
  track: TrackSummary | null;
  country: string | null;
  city: City | null;
  indoor: boolean;
}

export interface RunRef {
  id: string;
  name: string;
  local: LocalTime;
  distance: number;
  moving: number;
  elapsed: number;
  elevGain: number;
  /** segundos por metro */
  pace: number;
  avgHr: number;
  country: string | null;
  cityName: string | null;
  /** Ruta recortada por privacidad: [lat, lon, …] */
  track: Float32Array | null;
}

export interface Place {
  lat: number;
  lon: number;
  runs: number;
  country: string | null;
}

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

/** Perfil horario: una franja, la hora dorada / el amanecer (según el sol real) o "sin horario". */
export type HabitKey = TimeOfDay | 'golden' | 'sunrise' | 'twilight' | 'anytime';

export type ArchetypeKey =
  | 'earlybird'
  | 'nightowl'
  | 'globetrotter'
  | 'goat'
  | 'longhauler'
  | 'speedster'
  | 'metronome'
  | 'weekender'
  | 'treadmill'
  | 'allrounder';

export interface WrappedStats {
  year: number;
  name: string;
  lang: Lang;
  isPartialYear: boolean;
  periodEnd: LocalTime;
  daysInPeriod: number;

  runs: number;
  distance: number;
  moving: number;
  elapsed: number;
  elevation: number;
  activeDays: number;
  /** Día del año (local) de la primera carrera. */
  firstRunDoy: number;
  activeWeeks: number;
  weeksInPeriod: number;
  avgPace: number;
  avgDistance: number;

  longestRun: RunRef | null;
  fastestRun: RunRef | null;
  biggestClimb: RunRef | null;
  highestPoint: { elevation: number; run: RunRef } | null;

  months: { distance: number; runs: number; moving: number }[];
  bestMonth: number;
  weekdays: number[];
  favoriteWeekday: number;
  hours: number[];
  timeOfDay: TimeOfDay;
  timeOfDayShare: number;
  /** Perfil horario que se enseña (con su porcentaje de carreras). */
  habit: { key: HabitKey; share: number };
  /** Fase del sol en las carreras con GPS: hora dorada, amanecer, de noche. */
  sun: { outdoor: number; golden: number; sunrise: number; dark: number; evening: number; eveningGolden: number; eveningDark: number } | null;
  earlyShare: number;
  weekendShare: number;
  earliest: { minutes: number; run: RunRef } | null;
  latest: { minutes: number; run: RunRef } | null;

  /** Distancia por día del año (índice = día 0..365). */
  daily: Float32Array;
  activeDayFlags: Uint8Array;
  longestStreak: { days: number; startDoy: number; endDoy: number };
  bestWeek: { distance: number; startDoy: number; endDoy: number; runs: number } | null;

  efforts: { target: number; time: number; run: RunRef }[];
  paceTrend: { first: number; last: number } | null;

  hr: {
    avg: number;
    max: number;
    beats: number;
    zones: { lo: number; hi: number; seconds: number }[];
    zoneSeconds: number;
  } | null;

  /** Zapatillas del año; `lifetime` = km totales en el export hasta este año (también años anteriores). */
  shoes: { name: string; distance: number; runs: number; lifetime: number; months: number[] }[];
  /** Distancia de las carreras con zapatillas asignadas. */
  gearDistance: number;
  /** Ritmo (s/m) y distancia de cada carrera de 1 km o más. */
  paceSamples: { pace: number; distance: number }[];
  countries: { code: string; runs: number; distance: number }[];
  indoorRuns: number;
  gpsRuns: number;
  cities: { name: string; cc: string; runs: number; distance: number }[];
  places: Place[];
  home: {
    lat: number;
    lon: number;
    name: string | null;
    cc: string | null;
    runs: number;
    distance: number;
    tracks: Float32Array[];
  } | null;
  routes: { id: string; track: Float32Array; distance: number }[];

  steps: number | null;
  calories: number | null;
  hottest: { temp: number; run: RunRef } | null;
  coldest: { temp: number; run: RunRef } | null;
  races: RunRef[];
  photos: string[];
  others: { category: SportCategory; label: string; count: number; moving: number; distance: number }[];
  /** Año anterior (mismas fechas si este año aún no ha terminado: `partial`). */
  prev: { year: number; distance: number; runs: number; moving: number; partial: boolean } | null;
  archetype: { key: ArchetypeKey; runnerUp: ArchetypeKey | null };
  /** Kudos que has dado este año (reactions.csv). */
  kudos: number | null;
  /** Retos de Strava completados este año. */
  challenges: number | null;
  /** Objetivo de distancia de carrera (goals.csv): semanas/meses cumplidos o progreso anual. */
  goal: { period: 'week' | 'month' | 'year'; target: number; hit: number; total: number } | null;
}
