import type { LocalTime } from './types';

const DAY = 86400000;

export function localTimeOf(utcMs: number, offsetMin: number): LocalTime {
  const d = new Date(utcMs + offsetMin * 60000);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const doy = Math.round((Date.UTC(y, mo - 1, day) - Date.UTC(y, 0, 1)) / DAY);
  return {
    y,
    mo,
    d: day,
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    dow: (d.getUTCDay() + 6) % 7,
    doy,
    key: `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

export function localFromDoy(year: number, doy: number): LocalTime {
  return localTimeOf(Date.UTC(year, 0, 1) + doy * DAY, 0);
}

export function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/** Día de la semana (0 = lunes) del 1 de enero. */
export function jan1Dow(year: number): number {
  return (new Date(Date.UTC(year, 0, 1)).getUTCDay() + 6) % 7;
}

/** Índice de semana (lunes a domingo) dentro del año: la semana 0 contiene el 1 de enero. */
export function weekIndex(year: number, doy: number): number {
  return Math.floor((doy + jan1Dow(year)) / 7);
}
