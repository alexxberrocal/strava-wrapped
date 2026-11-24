import type { Card, DeckEnv } from './card';
import { distanceCard, elevationCard, heartCard, introCard, monthsCard, paceCard, timeCard } from './cards/core';
import { allRunsCard, countriesCard, hasMapData, heatmapCard, longestCard } from './cards/maps';
import { archetypeCard, calendarCard, curiositiesCard, curiosityTiles, habitsCard, othersCard, photosCard, recordsCard, recordRows, shoesCard, summaryCard } from './cards/more';
import type { WrappedStats } from '../stats/types';

export interface DeckOptions {
  /** Mostrar el mapa de calor de tu ciudad (se puede ocultar por privacidad). */
  cityMap: boolean;
}

export type CardId =
  | 'intro' | 'distance' | 'time' | 'calendar' | 'months' | 'elevation' | 'pace' | 'records' | 'longest' | 'heatmap'
  | 'countries' | 'allruns' | 'habits' | 'heart' | 'shoes' | 'curiosities' | 'others' | 'photos' | 'archetype' | 'summary';

/**
 * Cuándo merece la pena cada pantalla. No basta con "no está a cero": con pocos datos la tarjeta
 * queda pobre (o directamente engaña), así que no se enseña. Devuelve el motivo si no se muestra.
 */
export function cardSkipReason(id: CardId, env: DeckEnv, opts: DeckOptions = { cityMap: true }): string | null {
  const s = env.stats;
  const km = s.distance / 1000;
  const monthsWithRuns = s.months.filter((m) => m.runs > 0).length;
  switch (id) {
    case 'intro':
    case 'summary':
      return null;
    case 'distance':
      return km >= 1 ? null : 'menos de 1 km';
    case 'time':
      return s.runs >= 3 && s.moving >= 1800 ? null : 'pocas carreras o menos de 30 min';
    case 'calendar':
      return s.activeDays >= 10 ? null : 'menos de 10 días corriendo';
    case 'months':
      return s.runs >= 8 && monthsWithRuns >= 3 ? null : 'menos de 3 meses con carreras';
    case 'elevation':
      return s.elevation >= 300 ? null : 'menos de 300 m de desnivel';
    case 'pace':
      return s.runs >= 3 && km >= 5 && Number.isFinite(s.avgPace) && s.paceSamples.length >= 3 ? null : 'pocas carreras con ritmo';
    case 'records':
      return s.runs >= 3 && recordRows(env).length >= 2 ? null : 'menos de 3 carreras o de 2 marcas';
    case 'longest':
      return s.runs >= 3 && s.longestRun && s.longestRun.distance >= 3000 ? null : 'sin tirada larga destacable';
    case 'heatmap':
      return opts.cityMap && s.home && s.home.tracks.length >= 5 ? null : 'menos de 5 rutas en tu ciudad';
    case 'countries':
      return hasMapData(env) && s.gpsRuns >= 3 && (s.countries.length > 1 || s.cities.length > 1) ? null : 'un solo sitio';
    case 'allruns':
      return s.routes.length >= 6 ? null : 'menos de 6 rutas';
    case 'habits':
      return s.runs >= 8 ? null : 'menos de 8 carreras';
    case 'heart':
      return s.hr ? null : 'sin pulso';
    case 'shoes': {
      const top = s.shoes[0];
      if (!top) return 'sin zapatillas registradas';
      // Zapatillas apuntadas solo en unas pocas carreras: la tarjeta diría muy poco.
      if (top.distance < 50000 || top.runs < 3) return 'zapatillas con pocos km';
      return s.distance > 0 && s.gearDistance / s.distance >= 0.25 ? null : 'casi ninguna carrera con zapatillas';
    }
    case 'curiosities':
      return s.runs >= 6 && curiosityTiles(env).length >= 4 ? null : 'pocas curiosidades';
    case 'others': {
      const count = s.others.reduce((a, o) => a + o.count, 0);
      const secs = s.others.reduce((a, o) => a + o.moving, 0);
      return count >= 4 && (secs >= 3 * 3600 || count >= 8) ? null : 'pocos otros deportes';
    }
    case 'photos':
      return env.photos.length >= 3 ? null : 'menos de 3 fotos';
    case 'archetype':
      return s.runs >= 8 ? null : 'menos de 8 carreras';
  }
}

const ORDER: [CardId, (env: DeckEnv) => Card][] = [
  ['intro', introCard],
  ['distance', distanceCard],
  ['time', timeCard],
  ['calendar', calendarCard],
  ['months', monthsCard],
  ['elevation', elevationCard],
  ['pace', paceCard],
  ['records', recordsCard],
  ['longest', longestCard],
  ['heatmap', heatmapCard],
  ['countries', countriesCard],
  ['allruns', allRunsCard],
  ['habits', habitsCard],
  ['heart', heartCard],
  ['shoes', shoesCard],
  ['curiosities', curiositiesCard],
  ['others', othersCard],
  ['photos', photosCard],
  ['archetype', archetypeCard],
  ['summary', summaryCard],
];

/** Elige y ordena las tarjetas según los datos disponibles. */
export function buildDeck(env: DeckEnv, opts: DeckOptions = { cityMap: true }): Card[] {
  const cards: Card[] = [];
  for (const [id, make] of ORDER) {
    if (cardSkipReason(id, env, opts)) continue;
    try {
      cards.push(make(env));
    } catch (err) {
      console.warn('Tarjeta omitida', id, err);
    }
  }
  return cards;
}

export type { WrappedStats };
