import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import { dataUrl } from '../lib/assets';

export type CountryFeature = Feature<Polygon | MultiPolygon, { n?: string }> & { id?: string };

interface PolyIndex {
  code: string;
  bbox: [number, number, number, number]; // minLon, minLat, maxLon, maxLat
  rings: Position[][];
}

function ringContains(ring: Position[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function bboxOf(ring: Position[]): [number, number, number, number] {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of ring) {
    if (x < a) a = x;
    if (y < b) b = y;
    if (x > c) c = x;
    if (y > d) d = y;
  }
  return [a, b, c, d];
}

export class Countries {
  readonly features: CountryFeature[];
  private polys: PolyIndex[] = [];

  constructor(topology: Topology) {
    const fc = feature(topology, topology.objects.countries as GeometryCollection) as unknown as FeatureCollection<Polygon | MultiPolygon, { n?: string }>;
    this.features = fc.features as CountryFeature[];
    for (const f of this.features) {
      const code = (f.id as string | undefined) ?? '';
      if (!code || !f.geometry) continue;
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const rings of polys) {
        if (!rings.length) continue;
        this.polys.push({ code, bbox: bboxOf(rings[0]), rings });
      }
    }
  }

  /** Código ISO alpha-2 del país que contiene el punto (o el más cercano a < ~25 km: carreras por la playa). */
  lookup(lat: number, lon: number): string | null {
    for (const p of this.polys) {
      const [a, b, c, d] = p.bbox;
      if (lon < a || lon > c || lat < b || lat > d) continue;
      if (!ringContains(p.rings[0], lon, lat)) continue;
      let inHole = false;
      for (let k = 1; k < p.rings.length; k++) if (ringContains(p.rings[k], lon, lat)) inHole = true;
      if (!inHole) return p.code;
    }
    // Cerca de la costa o de una frontera mal resuelta a esta escala.
    const pad = 0.3;
    let best: string | null = null;
    let bestD = Infinity;
    const kx = Math.cos((lat * Math.PI) / 180);
    for (const p of this.polys) {
      const [a, b, c, d] = p.bbox;
      if (lon < a - pad || lon > c + pad || lat < b - pad || lat > d + pad) continue;
      for (const [x, y] of p.rings[0]) {
        const dx = ((((x - lon + 540) % 360) - 180) * kx), dy = y - lat;
        const dd = dx * dx + dy * dy;
        if (dd < bestD) {
          bestD = dd;
          best = p.code;
        }
      }
    }
    return bestD < 0.25 * 0.25 ? best : null;
  }

  byCode(code: string): CountryFeature | undefined {
    return this.features.find((f) => f.id === code);
  }
}

let loading: Promise<Countries> | null = null;

export function loadCountries(): Promise<Countries> {
  if (!loading) {
    loading = fetch(dataUrl('countries.json'))
      .then((r) => {
        if (!r.ok) throw new Error(`countries.json ${r.status}`);
        return r.json();
      })
      .then((t: Topology) => new Countries(t))
      .catch((e) => {
        loading = null;
        throw e;
      });
  }
  return loading;
}
