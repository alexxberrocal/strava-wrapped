/**
 * Posición del sol (algoritmo de SunCalc / Astronomical Algorithms, precisión ~0,5°): sirve para
 * saber si una carrera fue de verdad en la "hora dorada", al amanecer o ya de noche, en el sitio y
 * la fecha exactos (a las 19:00 es de día en junio y noche cerrada en diciembre).
 */
const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J2000_DAYS = 10957.5; // 1 ene 2000 12:00 UTC en días desde 1970

export interface SunPosition {
  /** Altura sobre el horizonte en grados (negativa = bajo el horizonte). */
  altitude: number;
  /** true si es después del mediodía solar (el sol ya baja). */
  afternoon: boolean;
}

export function sunPosition(utcMs: number, lat: number, lon: number): SunPosition {
  const d = utcMs / DAY_MS - J2000_DAYS;
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  const e = RAD * 23.4397;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const theta = RAD * (280.16 + 360.9856235 * d) + RAD * lon;
  const H = theta - ra;
  const phi = RAD * lat;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  return { altitude: alt / RAD, afternoon: Math.sin(H) > 0 };
}

export type SunPhase = 'dark' | 'sunrise' | 'golden' | 'day';

/**
 * Fase del día para una carrera: "golden" = el sol cae (de 8° sobre el horizonte hasta el final
 * del crepúsculo civil, −6°: la hora dorada y la azul), "sunrise" = lo mismo por la mañana,
 * "dark" = con el sol más de 6° bajo el horizonte (hace falta frontal o farolas).
 */
export function sunPhase(utcMs: number, lat: number, lon: number): SunPhase {
  const { altitude, afternoon } = sunPosition(utcMs, lat, lon);
  if (altitude < -6) return 'dark';
  if (altitude <= 8) return afternoon ? 'golden' : 'sunrise';
  return 'day';
}
