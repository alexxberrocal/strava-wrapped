import { describe, expect, it } from 'vitest';
import { parseChallenges, parseGoals, parsePrivacyZones, parseReactions } from '../src/parse/extras';
import { Cities } from '../src/geo/cities';
import { trimTrack } from '../src/stats/compute';
import { splitLines } from '../src/render/cards/common';
import { layoutRich, type Ctx } from '../src/render/kit';

describe('extras del export', () => {
  it('kudos por año (solo "Kudos" si los hay)', () => {
    const csv = [
      'Reaction Date,Reaction Type,Parent Type,Parent ID',
      '"Aug 31, 2023, 7:19:26 PM",Kudos,Activity,1',
      '"Mar 23, 2026, 10:15:20 AM",Kudos,Activity,2',
      '"Nov 7, 2026, 7:51:20 PM",Kudos,Activity,3',
      '"Nov 8, 2026, 7:51:20 PM",Like,Comment,4',
    ].join('\n');
    expect(parseReactions(csv, 'MDY')).toEqual({ 2023: 1, 2026: 2 });
  });

  it('retos completados', () => {
    const csv = 'Join Date,Name,Completed\n"Nov 28, 2024, 5:16:22 PM",San Silvestre,true\n"Oct 20, 2025, 7:13:08 PM","Reto, con coma",false\n';
    const c = parseChallenges(csv, 'MDY');
    expect(c).toHaveLength(2);
    expect(c[0].completed).toBe(true);
    expect(c[1].completed).toBe(false);
    expect(new Date(c[1].joinUtc).getUTCFullYear()).toBe(2025);
  });

  it('objetivos (inglés y español)', () => {
    const en = parseGoals('Goal Type,Activity Type,Goal,Start Date,End Date,Segment ID,Time Period,Interval Time\nDistance Goal,All Run,20000.0,"May 22, 2025, 6:28:48 PM",,,Week,\n', 'MDY');
    expect(en).toEqual([{ kind: 'distance', running: true, value: 20000, period: 'week', startUtc: Date.UTC(2025, 4, 22, 18, 28, 48) }]);
    const es = parseGoals('Tipo de objetivo,Tipo de actividad,Objetivo,Fecha de inicio,Fecha de fin,Id,Periodo\nObjetivo de distancia,Carrera,100000.0,1 ene 2026 8:00:00,,,Mes\n', 'DMY');
    expect(es[0].period).toBe('month');
    expect(es[0].running).toBe(true);
    expect(es[0].kind).toBe('distance');
  });

  it('zonas de privacidad', () => {
    const z = parsePrivacyZones('Address,Radius,Latitude & Longitude\n"Calle Falsa 123",201.168,"41.22, 1.72"\nCasa,0.25,41.3 2.1\n');
    expect(z).toHaveLength(2);
    expect(z[0]).toMatchObject({ lat: 41.22, lon: 1.72 });
    expect(z[0].radius).toBeCloseTo(261.168, 2);
    expect(z[1].radius).toBeCloseTo(0.25 * 1609.344 + 60, 1);
  });
});

describe('país de respaldo por ciudad cercana', () => {
  it('islas pequeñas (Koh Tao) toman el país de la ciudad más cercana', () => {
    const tsv = ['Ko Samui\tTH\t9.53\t100.06\t60', 'Chumphon\tTH\t10.49\t99.18\t55', 'Lisbon\tPT\t38.72\t-9.14\t517'].join('\n');
    const c = new Cities(tsv);
    expect(c.nearestCountry(10.09, 99.83)).toBe('TH');
    expect(c.nearestCountry(0, -150)).toBeNull();
  });
});

describe('recorte por zonas de privacidad', () => {
  it('quita inicio y fin dentro de la zona', () => {
    const n = 50;
    const tr = new Float32Array(n * 2);
    const cum = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      tr[i * 2] = 41 + i * 0.001; // ~111 m por punto
      tr[i * 2 + 1] = 2;
      cum[i] = i * 111;
    }
    const zone = [{ lat: 41, lon: 2, radius: 600 }];
    const t = trimTrack(tr, cum, 0, zone)!;
    // Los ~6 primeros puntos (dentro de 600 m) desaparecen.
    expect(t[0]).toBeGreaterThan(41.0053);
    expect(t[t.length - 2]).toBeCloseTo(41.049, 3);
  });
});

describe('textos', () => {
  it('reparte títulos en dos líneas equilibradas', () => {
    expect(splitLines('ASICS NOVABLAST 5', 2, 16)).toEqual(['ASICS', 'NOVABLAST 5']);
    expect(splitLines('MARATÓ DE BARCELONA', 2, 18)).toEqual(['MARATÓ DE', 'BARCELONA']);
    expect(splitLines('CORTO', 2, 16)).toEqual(['CORTO']);
  });

  it('no separa el número de su unidad', () => {
    const ctx = { font: '', measureText: (t: string) => ({ width: t.length * 10 }) } as unknown as Ctx;
    // Ancho para "Tu semana más fuerte: 56" pero no para la unidad: debe bajar "56 km" junto.
    const lay = layoutRich(ctx, 'Tu semana más fuerte: **56 km**, genial.', 240, 20);
    const lines = lay.lines.map((l) => l.runs.map((r) => r.text).join(''));
    expect(lines.some((l) => l.includes('56 km'))).toBe(true);
    expect(lines.some((l) => /56$/.test(l))).toBe(false);
  });
});

import { summarizeTrack } from '../src/parse/track';

describe('GPS con mal arranque', () => {
  it('si el primer punto está lejísimos, se queda con la ruta buena', () => {
    const n = 300;
    const time = Array.from({ length: n }, (_, i) => 1_700_000_000 + i * 2);
    // Punto 0: 400 km al norte (GPS frío). El resto: carrera normal a ~3 m/s.
    const lat = time.map((_, i) => (i === 0 ? 45 : 41.38 + i * 5.4e-5));
    const lon = time.map(() => 2.17);
    const nan = () => new Array(n).fill(NaN);
    const s = summarizeTrack(
      { time, lat, lon, alt: nan(), hr: nan(), cad: nan(), dist: nan(), temp: nan(), localOffset: null, sport: 'running', subSport: null, startTime: null },
      { id: 'x', csvDistance: 0 },
    );
    expect(s.hasGps).toBe(true);
    expect(s.start![0]).toBeLessThan(41.5);
    expect(s.gpsDistance).toBeGreaterThan(1500);
  });
});
