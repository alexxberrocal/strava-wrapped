/** Datos crudos de un fichero de actividad (FIT/GPX/TCX). NaN = sin dato en ese punto. */
export interface DecodedTrack {
  /** Segundos Unix (UTC). */
  time: number[];
  lat: number[];
  lon: number[];
  alt: number[];
  hr: number[];
  /** Cadencia tal cual viene (rpm de una pierna en FIT/GPX de carrera). */
  cad: number[];
  /** Distancia acumulada del dispositivo (m), si la hay. */
  dist: number[];
  temp: number[];
  /** Diferencia hora local - UTC (s) declarada por el dispositivo (solo FIT). */
  localOffset: number | null;
  sport: string | null;
  subSport: string | null;
  /** Inicio declarado en el fichero (s Unix). */
  startTime: number | null;
}

export function emptyTrack(): DecodedTrack {
  return {
    time: [],
    lat: [],
    lon: [],
    alt: [],
    hr: [],
    cad: [],
    dist: [],
    temp: [],
    localOffset: null,
    sport: null,
    subSport: null,
    startTime: null,
  };
}

export function pushPoint(
  t: DecodedTrack,
  time: number,
  lat: number,
  lon: number,
  alt: number,
  hr: number,
  cad: number,
  dist: number,
  temp: number,
): void {
  t.time.push(time);
  t.lat.push(lat);
  t.lon.push(lon);
  t.alt.push(alt);
  t.hr.push(hr);
  t.cad.push(cad);
  t.dist.push(dist);
  t.temp.push(temp);
}
