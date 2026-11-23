import { dataUrl } from '../lib/assets';

export interface City {
  name: string;
  cc: string;
  lat: number;
  lon: number;
  /** Población en miles. */
  pop: number;
}

const toRad = Math.PI / 180;
function distKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const x = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * toRad);
  const y = lat2 - lat1;
  return Math.sqrt(x * x + y * y) * 111.2;
}

/** Ciudades de >15.000 habitantes (GeoNames, CC BY 4.0) con índice espacial por celdas de 1°. */
export class Cities {
  private grid = new Map<string, City[]>();

  constructor(tsv: string) {
    for (const line of tsv.split('\n')) {
      if (!line) continue;
      const [name, cc, la, lo, pop] = line.split('\t');
      const c: City = { name, cc, lat: +la, lon: +lo, pop: +pop || 15 };
      if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) continue;
      const k = `${Math.floor(c.lat)},${Math.floor(c.lon)}`;
      let cell = this.grid.get(k);
      if (!cell) this.grid.set(k, (cell = []));
      cell.push(c);
    }
  }

  private around(lat: number, lon: number, cells = 1): City[] {
    const out: City[] = [];
    const la = Math.floor(lat), lo = Math.floor(lon);
    for (let i = -cells; i <= cells; i++)
      for (let j = -cells; j <= cells; j++) {
        const cell = this.grid.get(`${la + i},${((lo + j + 540) % 360) - 180}`);
        if (cell) out.push(...cell);
      }
    return out;
  }

  /**
   * Ciudad "a la que pertenece" un punto: distancia relativa al tamaño de la ciudad, para que
   * un barrio de Madrid sea Madrid y no el pueblo de al lado.
   */
  locate(lat: number, lon: number, maxKm = 40): City | null {
    let best: City | null = null;
    let bestScore = Infinity;
    for (const c of this.around(lat, lon)) {
      const d = distKm(lat, lon, c.lat, c.lon);
      if (d > maxKm) continue;
      const radius = 0.26 * Math.sqrt(c.pop) + 1;
      const score = d / radius;
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }
}

let loading: Promise<Cities> | null = null;

export function loadCities(): Promise<Cities> {
  if (!loading) {
    loading = fetch(dataUrl('cities.tsv'))
      .then((r) => {
        if (!r.ok) throw new Error(`cities.tsv ${r.status}`);
        return r.text();
      })
      .then((t) => new Cities(t))
      .catch((e) => {
        loading = null;
        throw e;
      });
  }
  return loading;
}
