import type { Card, DeckEnv } from './card';
import { distanceCard, elevationCard, heartCard, introCard, monthsCard, paceCard, timeCard } from './cards/core';
import { allRunsCard, countriesCard, hasMapData, heatmapCard, longestCard } from './cards/maps';
import { archetypeCard, calendarCard, curiositiesCard, habitsCard, othersCard, photosCard, recordsCard, shoesCard, summaryCard } from './cards/more';

export interface DeckOptions {
  /** Mostrar el mapa de calor de tu ciudad (se puede ocultar por privacidad). */
  cityMap: boolean;
}

/** Elige y ordena las tarjetas según los datos disponibles. */
export function buildDeck(env: DeckEnv, opts: DeckOptions = { cityMap: true }): Card[] {
  const s = env.stats;
  const cards: Card[] = [];
  const add = (cond: unknown, make: () => Card) => {
    if (cond) {
      try {
        cards.push(make());
      } catch (err) {
        console.warn('Tarjeta omitida', err);
      }
    }
  };
  const othersCount = s.others.reduce((a, o) => a + o.count, 0);
  add(true, () => introCard(env));
  add(s.distance > 0, () => distanceCard(env));
  add(s.moving > 0, () => timeCard(env));
  add(s.activeDays >= 3, () => calendarCard(env));
  add(s.runs >= 6, () => monthsCard(env));
  add(s.elevation > 100, () => elevationCard(env));
  add(s.runs >= 3 && Number.isFinite(s.avgPace), () => paceCard(env));
  add(s.efforts.length >= 2, () => recordsCard(env));
  add(s.longestRun && s.longestRun.distance > 3000, () => longestCard(env));
  add(opts.cityMap && s.home && s.home.tracks.length >= 3, () => heatmapCard(env));
  add(hasMapData(env) && (s.countries.length > 1 || s.cities.length > 1), () => countriesCard(env));
  add(s.routes.length >= 6, () => allRunsCard(env));
  add(s.runs >= 5, () => habitsCard(env));
  add(s.hr, () => heartCard(env));
  add(s.shoes.length >= 1 && s.shoes[0].distance > 20000, () => shoesCard(env));
  add(s.runs >= 5, () => curiositiesCard(env));
  add(s.others.length >= 1 && othersCount >= 4, () => othersCard(env));
  add(env.photos.length >= 3, () => photosCard(env));
  add(s.runs >= 5, () => archetypeCard(env));
  add(true, () => summaryCard(env));
  return cards;
}
