import { describe, expect, it } from 'vitest';
import { Encoder, Profile } from '@garmin/fitsdk';
import { num, parseCsv } from '../src/parse/csv';
import { inferNumericOrder, parseDateParts, partsToUtcMs } from '../src/parse/dates';
import { classifySport } from '../src/parse/sports';
import { parseActivitiesCsv, parseProfileFirstName } from '../src/parse/activitiesCsv';
import { decodeFit } from '../src/parse/fit';
import { decodeGpx, decodeTcx } from '../src/parse/gpx';
import { bestEffort, summarizeTrack } from '../src/parse/track';
import { decodeActivityBytes } from '../src/worker/core';
import { csvRow, fixture, handmadeFit, rowAt } from './helpers';

const iso = (raw: string, order?: 'DMY' | 'MDY') => {
  const p = parseDateParts(raw, order);
  return p ? new Date(partsToUtcMs(p)).toISOString().slice(0, 19) : null;
};

describe('csv', () => {
  it('handles quotes, escaped quotes, newlines and CRLF', () => {
    const rows = parseCsv('﻿a,b,c\r\n1,"x, y","he said ""hi""\nbye"\r\n2,,3\n');
    expect(rows).toEqual([
      ['a', 'b', 'c'],
      ['1', 'x, y', 'he said "hi"\nbye'],
      ['2', '', '3'],
    ]);
  });
  it('parses tolerant numbers', () => {
    expect(num('2544.10009765625')).toBeCloseTo(2544.1, 3);
    expect(num('2,54')).toBeCloseTo(2.54);
    expect(num('')).toBeNaN();
  });
});

describe('dates (UTC, todos los idiomas de Strava)', () => {
  it.each([
    ['Oct 31, 2026, 9:49:58 AM', '2026-10-31T09:49:58'],
    ['Oct 31, 2026, 9:49:58 PM', '2026-10-31T21:49:58'],
    ['Dec 31, 2024, 12:04:34 AM', '2024-12-31T00:04:34'],
    ['Mar 10, 2024, 6:03:02 PM', '2024-03-10T18:03:02'],
    ['9 sept. 2018 17:26:30', '2018-09-09T17:26:30'],
    ['6 ene. 2021 15:09:36', '2021-01-06T15:09:36'],
    ['2 ago 2026, 12:20:32 p.m.', '2026-08-02T12:20:32'],
    ['18 jul 2026, 12:33:16 a.m.', '2026-07-18T00:33:16'],
    ['22 ene 2026, 9:40:46 p.m.', '2026-01-22T21:40:46'],
    ['16.10.2024, 15:57:17', '2024-10-16T15:57:17'],
    ['31 oct. 2026, 09:49:58', '2026-10-31T09:49:58'],
    ['1 févr. 2026, 07:00:00', '2026-02-01T07:00:00'],
    ['3 août 2026 18:00:00', '2026-08-03T18:00:00'],
    ['12 juil. 2026, 06:30:00', '2026-07-12T06:30:00'],
    ['12 juin 2026, 06:30:00', '2026-06-12T06:30:00'],
    ['31 de out. de 2026 09:49:58', '2026-10-31T09:49:58'],
    ['7 mag 2026, 07:05:00', '2026-05-07T07:05:00'],
    ['3 mrt 2026 07:00:00', '2026-03-03T07:00:00'],
    ['2026/10/31 9:49:58', '2026-10-31T09:49:58'],
    ['2026年10月31日 下午9:49:58', '2026-10-31T21:49:58'],
    ['2026. 10. 31. 오전 9:49:58', '2026-10-31T09:49:58'],
    ['31 окт. 2026 г., 9:49:58', '2026-10-31T09:49:58'],
    ['5 мая 2026 г., 9:49:58', '2026-05-05T09:49:58'],
    ['2026-10-31 09:49:58', '2026-10-31T09:49:58'],
  ])('%s', (raw, expected) => {
    expect(iso(raw)).toBe(expected);
  });

  it('numeric order inference', () => {
    expect(inferNumericOrder(['10/31/2026 9:49', '11/02/2026 9:49'], true)).toBe('MDY');
    expect(inferNumericOrder(['31/10/2026 9:49'], false)).toBe('DMY');
    expect(iso('31/10/2026 9:49', 'DMY')).toBe('2026-10-31T09:49:00');
    expect(iso('10/31/2026 9:49 AM', 'MDY')).toBe('2026-10-31T09:49:00');
    expect(iso('03/04/2026 9:49', 'MDY')).toBe('2026-03-04T09:49:00');
  });

  it('rejects garbage', () => {
    expect(parseDateParts('')).toBeNull();
    expect(parseDateParts('hola')).toBeNull();
  });
});

describe('sport classification', () => {
  it.each([
    ['Run', 'run'], ['Trail Run', 'run'], ['Virtual Run', 'run'], ['Carrera', 'run'], ['Lauf', 'run'],
    ['Course à pied', 'run'], ['Corsa', 'run'], ['Corrida', 'run'], ['Hardloopsessie', 'run'], ['跑步', 'run'],
    ['Ride', 'ride'], ['Bicicleta', 'ride'], ['Vuelta ciclista', 'ride'], ['Radfahrt', 'ride'], ['E-Bike Ride', 'ride'],
    ['Virtual Ride', 'ride'], ['Swim', 'swim'], ['Natación', 'swim'], ['Schwimmen', 'swim'],
    ['Walk', 'walk'], ['Caminata', 'walk'], ['Hike', 'hike'], ['Excursión', 'hike'], ['Wanderung', 'hike'],
    ['Weight Training', 'weights'], ['Entrenamiento con pesas', 'weights'], ['Workout', 'workout'],
    ['Entrenamiento', 'workout'], ['Yoga', 'yoga'], ['Nordic Ski', 'winter'], ['Skilanglauf', 'winter'],
    ['Snowboard', 'winter'], ['Stand Up Paddling', 'water'], ['Rowing', 'water'], ['Golf', 'other'],
  ])('%s -> %s', (raw, cat) => {
    expect(classifySport(raw)).toBe(cat);
  });
});

describe('activities.csv', () => {
  it('es-ES export (87 columnas, fechas "9 sept. 2018", distancia con coma)', () => {
    const header = fixture('headers-es-ES.csv');
    const n = parseCsv(header)[0].length;
    expect(n).toBe(87);
    const text = [
      header,
      rowAt(n, { 0: 1830727582, 1: '9 sept. 2018 17:26:30', 2: 'Carrera de tarde', 3: 'Carrera', 5: 437, 6: '2,54', 9: 'false', 11: 'Pegasus 40', 12: 'activities/1830727582.gpx', 15: '437.0', 16: '433.0', 17: '2544.10009765625', 20: '40.86', 23: '232.1', 30: '171.0', 31: '154.0', 34: '121.0', 86: 'media/a.jpg|media/b.jpg' }),
      rowAt(n, { 0: 1830749090, 1: '20 mar. 2019 17:57:36', 2: 'Ciclismo', 3: 'Bicicleta', 5: 219, 6: '1,27', 12: 'activities/1830749090.fit.gz', 15: '219.0', 16: '218.0', 17: '1271.0' }),
    ].join('\n');
    const r = parseActivitiesCsv(text);
    expect(r.headerLanguage).toBe('es');
    expect(r.activities).toHaveLength(2);
    const a = r.activities[0];
    expect(a.category).toBe('run');
    expect(a.distance).toBeCloseTo(2544.1, 1);
    expect(a.moving).toBe(433);
    expect(a.elapsed).toBe(437);
    expect(a.elevGain).toBeCloseTo(40.86);
    expect(a.elevHigh).toBeCloseTo(232.1);
    expect(a.maxHr).toBe(171);
    expect(a.avgHr).toBe(154);
    expect(a.calories).toBe(121);
    expect(a.gear).toBe('Pegasus 40');
    expect(a.filename).toBe('activities/1830727582.gpx');
    expect(a.media).toEqual(['media/a.jpg', 'media/b.jpg']);
    expect(new Date(a.startUtc).toISOString()).toBe('2018-09-09T17:26:30.000Z');
    expect(r.activities[1].category).toBe('ride');
  });

  it('es-419 export (103 columnas, a.m./p.m. con U+202F, etiqueta Competencia)', () => {
    const header = fixture('headers-es-419.csv');
    const n = parseCsv(header)[0].length;
    expect(n).toBe(103);
    const text = [
      header,
      rowAt(n, { 0: 19569811741, 1: '2 ago 2026, 12:20:32 p.m.', 2: 'Carrera | Corre 10k', 3: 'Carrera', 5: 2735, 6: '9.75', 9: 'false', 12: 'activities/20694837169.fit.gz', 15: '2735.0', 16: '2722.0', 17: '9749.0', 20: '137.4', 31: '163.0', 95: '1.0', 102: 'media/x.jpg|media/y.mp4' }),
    ].join('\n');
    const r = parseActivitiesCsv(text);
    const a = r.activities[0];
    expect(a.category).toBe('run');
    expect(a.distance).toBe(9749);
    expect(a.race).toBe(true);
    expect(a.media).toEqual(['media/x.jpg', 'media/y.mp4']);
    expect(new Date(a.startUtc).toISOString()).toBe('2026-08-02T12:20:32.000Z');
  });

  it('de export (16.10.2024, Lauf)', () => {
    const header = fixture('headers-de.csv');
    const n = parseCsv(header)[0].length;
    const text = [header, rowAt(n, { 0: 1001, 1: '16.10.2024, 15:57:17', 2: 'Lauf am Abend', 3: 'Lauf', 5: 2272, 6: '4,15', 12: 'activities/1001.gpx', 15: '2272.0', 16: '1846.0', 17: '4146.2' })].join('\n');
    const a = parseActivitiesCsv(text).activities[0];
    expect(a.category).toBe('run');
    expect(a.distance).toBeCloseTo(4146.2);
    expect(a.moving).toBe(1846);
    expect(new Date(a.startUtc).toISOString()).toBe('2024-10-16T15:57:17.000Z');
  });

  it('en export: columnas duplicadas por posición/nombre', () => {
    const header = csvRow([
      'Activity ID', 'Activity Date', 'Activity Name', 'Activity Type', 'Activity Description', 'Elapsed Time', 'Distance',
      'Max Heart Rate', 'Relative Effort', 'Commute', 'Activity Private Note', 'Activity Gear', 'Filename', 'Athlete Weight',
      'Bike Weight', 'Elapsed Time', 'Moving Time', 'Distance', 'Max Speed', 'Average Speed', 'Elevation Gain', 'Elevation Loss',
      'Elevation Low', 'Elevation High', 'Max Grade', 'Average Grade', 'Average Positive Grade', 'Average Negative Grade',
      'Max Cadence', 'Average Cadence', 'Max Heart Rate', 'Average Heart Rate', 'Max Watts', 'Average Watts', 'Calories',
      'Max Temperature', 'Average Temperature', 'Relative Effort', 'Total Work', 'Number of Runs', 'Uphill Time',
      'Downhill Time', 'Other Time', 'Perceived Exertion', 'Total Steps', 'Media',
    ]);
    const n = parseCsv(header)[0].length;
    const text = [
      header,
      rowAt(n, { 0: 42, 1: 'Mar 10, 2024, 6:03:02 PM', 2: 'Evening Run', 3: 'Run', 5: 3000, 6: '10.02', 12: 'activities/42.fit.gz', 15: '3000.0', 16: '2950.0', 17: '10020.5', 29: '84', 31: '150', 44: '9000', 45: 'media/1.jpg' }),
    ].join('\n');
    const a = parseActivitiesCsv(text).activities[0];
    expect(a.distance).toBeCloseTo(10020.5);
    expect(a.moving).toBe(2950);
    expect(a.avgCadence).toBe(84);
    expect(a.steps).toBe(9000);
    expect(a.media).toEqual(['media/1.jpg']);
    expect(new Date(a.startUtc).toISOString()).toBe('2024-03-10T18:03:02.000Z');
  });

  it('profile.csv first name', () => {
    expect(parseProfileFirstName('Athlete ID,Email Address,First Name,Last Name\n1,a@b.c,Alex,B')).toBe('Alex');
    expect(parseProfileFirstName('Id. del deportista,Correo electrónico,Nombre,Apellidos\n1,a@b.c,Lucía,G')).toBe('Lucía');
  });
});

// ---------------------------------------------------------------------------

const mesg = (o: Record<string, unknown>) => o as never;

function garminRunFit(opts: { points: number; speed: number; start: Date; offsetH: number }) {
  const enc = new Encoder();
  const startS = opts.start.getTime() / 1000;
  enc.onMesg(Profile.MesgNum.FILE_ID, mesg({ manufacturer: 'development', product: 1, timeCreated: opts.start, type: 'activity' }));
  const lat0 = 40.4168, lon0 = -3.7038;
  for (let i = 0; i < opts.points; i++) {
    const d = i * opts.speed;
    const lat = lat0 + d / 110574;
    enc.onMesg(Profile.MesgNum.RECORD, mesg({
      timestamp: new Date((startS + i) * 1000),
      positionLat: Math.round((lat * 2147483648) / 180),
      positionLong: Math.round((lon0 * 2147483648) / 180),
      distance: d,
      enhancedAltitude: 650 + i * 0.1,
      heartRate: 140 + (i % 20),
      cadence: 85,
    }));
  }
  const end = new Date((startS + opts.points) * 1000);
  enc.onMesg(Profile.MesgNum.SESSION, mesg({
    timestamp: end, startTime: opts.start, sport: 'running', subSport: 'generic',
    totalElapsedTime: opts.points, totalTimerTime: opts.points, totalDistance: opts.points * opts.speed,
  }));
  enc.onMesg(Profile.MesgNum.ACTIVITY, mesg({
    timestamp: end, localTimestamp: Math.round(end.getTime() / 1000 - 631065600 + opts.offsetH * 3600),
    numSessions: 1, type: 'manual', event: 'activity', eventType: 'stop',
  }));
  return enc.close();
}

describe('FIT', () => {
  it('decodes a FIT file written by the official Garmin SDK', () => {
    const bytes = garminRunFit({ points: 1200, speed: 10 / 3, start: new Date('2026-03-01T08:00:00Z'), offsetH: 1 });
    const t = decodeFit(bytes);
    expect(t.time).toHaveLength(1200);
    expect(t.sport).toBe('running');
    expect(t.localOffset).toBe(3600);
    expect(t.startTime).toBe(Date.parse('2026-03-01T08:00:00Z') / 1000);
    expect(t.lat[0]).toBeCloseTo(40.4168, 5);
    expect(t.lon[10]).toBeCloseTo(-3.7038, 5);
    expect(t.alt[10]).toBeCloseTo(651, 0);
    expect(t.hr[5]).toBe(145);
    expect(t.dist[600]).toBeCloseTo(2000, 0);

    const s = summarizeTrack(t, { id: '1', csvDistance: 4000 });
    expect(s.hasGps).toBe(true);
    expect(s.localOffsetMin).toBe(60);
    expect(s.efforts['1000']).toBeCloseTo(300, 0);
    expect(s.efforts['5000']).toBeUndefined();
    expect(s.steps).toBeGreaterThan(3300);
    expect(s.steps).toBeLessThan(3500);
    expect(s.maxHr).toBeGreaterThanOrEqual(158);
    expect(s.hrHist).not.toBeNull();
    expect(s.track!.length / 2).toBeLessThan(50); // una recta se simplifica a pocos puntos
    expect(s.altMax).toBeGreaterThan(760);
    expect(decodeActivityBytes(bytes).time).toHaveLength(1200);
  });

  it('big-endian + compressed timestamps', () => {
    const base = Date.parse('2025-06-01T06:00:00Z') / 1000;
    const points = Array.from({ length: 100 }, (_, i) => ({ ts: base + i, lat: 41.38 + i * 1e-4, lon: 2.17, hr: 120 + (i % 10) }));
    for (const bigEndian of [true, false]) {
      for (const compressed of [true, false]) {
        const t = decodeFit(handmadeFit({ bigEndian, compressed, points }));
        expect(t.time).toHaveLength(100);
        expect(t.time[0]).toBe(base);
        expect(t.time[99]).toBe(base + 99);
        expect(t.lat[50]).toBeCloseTo(41.385, 5);
        expect(t.hr[3]).toBe(123);
      }
    }
  });

  it('survives truncated files', () => {
    const bytes = garminRunFit({ points: 300, speed: 3, start: new Date('2026-01-01T08:00:00Z'), offsetH: 0 });
    const t = decodeFit(bytes.slice(0, Math.floor(bytes.length * 0.6)));
    expect(t.time.length).toBeGreaterThan(100);
    expect(t.time.length).toBeLessThan(300);
  });
});

describe('GPX / TCX', () => {
  it('Strava GPX with namespaced extensions', () => {
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
 <metadata><time>2026-05-01T07:00:00Z</time></metadata>
 <trk><name>Carrera matutina</name><type>running</type><trkseg>
  <trkpt lat="40.4168000" lon="-3.7038000"><ele>650.2</ele><time>2026-05-01T07:00:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>120</gpxtpx:hr><gpxtpx:cad>84</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>
  <trkpt lon="-3.7037000" lat="40.4169000"><ele>651.0</ele><time>2026-05-01T07:00:05Z</time></trkpt>
  <trkpt lat="40.4170000" lon="-3.7036000"/>
 </trkseg></trk></gpx>`;
    const t = decodeGpx(gpx);
    expect(t.sport).toBe('running');
    expect(t.time).toHaveLength(3);
    expect(t.lat[1]).toBeCloseTo(40.4169);
    expect(t.lon[1]).toBeCloseTo(-3.7037);
    expect(t.hr[0]).toBe(120);
    expect(t.cad[0]).toBe(84);
    expect(t.alt[1]).toBeCloseTo(651);
    expect(t.startTime).toBe(Date.parse('2026-05-01T07:00:00Z') / 1000);
  });

  it('TCX with leading whitespace and Garmin extensions', () => {
    const tcx = `          <?xml version="1.0"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
<Activities><Activity Sport="Running"><Id>2024-12-31T11:04:34Z</Id><Lap StartTime="2024-12-31T11:04:34Z"><Track>
<Trackpoint><Time>2024-12-31T11:04:34Z</Time><Position><LatitudeDegrees>51.5</LatitudeDegrees><LongitudeDegrees>-0.12</LongitudeDegrees></Position><AltitudeMeters>12.0</AltitudeMeters><DistanceMeters>0.0</DistanceMeters><HeartRateBpm><Value>130</Value></HeartRateBpm><Extensions><ns3:TPX><ns3:RunCadence>82</ns3:RunCadence></ns3:TPX></Extensions></Trackpoint>
<Trackpoint><Time>2024-12-31T11:04:40Z</Time><Position><LatitudeDegrees>51.5001</LatitudeDegrees><LongitudeDegrees>-0.12</LongitudeDegrees></Position><DistanceMeters>11.1</DistanceMeters><HeartRateBpm><Value>132</Value></HeartRateBpm></Trackpoint>
</Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
    const bytes = new TextEncoder().encode(tcx);
    const t = decodeActivityBytes(bytes);
    expect(t.sport).toBe('running');
    expect(t.time).toHaveLength(2);
    expect(t.hr[1]).toBe(132);
    expect(t.cad[0]).toBe(82);
    expect(t.dist[1]).toBeCloseTo(11.1);
    expect(decodeTcx(tcx).startTime).toBe(Date.parse('2024-12-31T11:04:34Z') / 1000);
  });
});

describe('track metrics', () => {
  it('best effort uses interpolation', () => {
    // 4 m/s constantes durante 3000 s => 1 km en 250 s
    const time = Array.from({ length: 3001 }, (_, i) => i);
    const cum = time.map((t) => t * 4);
    expect(bestEffort(time, cum, 1000)).toBeCloseTo(250, 5);
    expect(bestEffort(time, cum, 10000)).toBeCloseTo(2500, 5);
    expect(bestEffort(time, cum, 21097.5)).toBeNaN();
  });

  it('finds the fast segment inside a slower run', () => {
    // 2000 s a 3 m/s, luego 400 s a 5 m/s, luego 2000 s a 3 m/s
    const time: number[] = [];
    const cum: number[] = [];
    let d = 0;
    for (let t = 0; t <= 4400; t++) {
      time.push(t);
      cum.push(d);
      d += t < 2000 || t >= 2400 ? 3 : 5;
    }
    expect(bestEffort(time, cum, 1000)).toBeCloseTo(200, 0);
    expect(bestEffort(time, cum, 2000)).toBeCloseTo(400, 0);
  });

  it('drops GPS spikes', () => {
    const n = 200;
    const t = {
      time: Array.from({ length: n }, (_, i) => 1_700_000_000 + i),
      lat: Array.from({ length: n }, (_, i) => (i === 100 ? 45 : 40.4 + i * 3e-5)),
      lon: Array.from({ length: n }, () => -3.7),
      alt: new Array(n).fill(NaN), hr: new Array(n).fill(NaN), cad: new Array(n).fill(NaN),
      dist: new Array(n).fill(NaN), temp: new Array(n).fill(NaN),
      localOffset: null, sport: null, subSport: null, startTime: null,
    };
    const s = summarizeTrack(t, { id: 'x', csvDistance: 0 });
    expect(s.bbox![2]).toBeLessThan(40.5);
    expect(s.gpsDistance).toBeGreaterThan(600);
    expect(s.gpsDistance).toBeLessThan(700);
  });
});
