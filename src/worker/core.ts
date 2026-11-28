import { Archive, ArchiveError, type ArchiveInput } from '../parse/archive';
import { parseActivitiesCsv, parseProfileFirstName, type CsvParseResult } from '../parse/activitiesCsv';
import { decodeFit, isFit } from '../parse/fit';
import { decodeGpx, decodeTcx } from '../parse/gpx';
import { summarizeTrack, type TrackSummary } from '../parse/track';
import type { DecodedTrack } from '../parse/decoded';
import { emptyExtras, parseChallenges, parseGoals, parsePrivacyZones, parseReactions, parseUnits, type Extras } from '../parse/extras';
import { inferNumericOrder } from '../parse/dates';

export interface ScanResult {
  csv: CsvParseResult;
  firstName: string | null;
  /** Fecha aproximada en la que Strava generó el export (ms). */
  exportDate: number | null;
  fileCount: number;
  activityFileCount: number;
  extras: Extras;
}

export interface TrackJob {
  id: string;
  filename: string;
  csvDistance: number;
}

export interface MediaItem {
  path: string;
  bytes: Uint8Array;
  type: string;
}

const textDecoder = new TextDecoder('utf-8');

export function decodeActivityBytes(bytes: Uint8Array): DecodedTrack {
  if (isFit(bytes)) return decodeFit(bytes);
  // Texto: GPX o TCX (algunos TCX traen espacios/basura antes de <?xml).
  const head = textDecoder.decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
  const text = textDecoder.decode(bytes);
  if (/<TrainingCenterDatabase/i.test(head) || /<TrainingCenterDatabase/i.test(text.slice(0, 20000))) return decodeTcx(text);
  return decodeGpx(text);
}

/** Lógica del procesador, usada dentro del Web Worker (o en el hilo principal si no hay workers). */
export class ParserCore {
  private archive: Archive | null = null;

  async open(input: ArchiveInput): Promise<void> {
    await this.archive?.close();
    this.archive = await Archive.open(input);
  }

  async scan(): Promise<ScanResult> {
    const a = this.need();
    const csvText = await a.text('activities.csv');
    const csv = parseActivitiesCsv(csvText);
    let firstName: string | null = null;
    if (a.has('profile.csv')) {
      try {
        firstName = parseProfileFirstName(await a.text('profile.csv'));
      } catch {
        firstName = null;
      }
    }
    const files = a.list('activities/');
    // Extras opcionales: si algo falla, se ignora sin romper nada.
    const extras = emptyExtras();
    const order = inferNumericOrder([], csv.headerLanguage === 'en');
    const optional = async (name: string, fn: (text: string) => void) => {
      if (!a.has(name)) return;
      try {
        fn(await a.text(name));
      } catch {
        /* sin este dato */
      }
    };
    await optional('reactions.csv', (t) => (extras.kudosByYear = parseReactions(t, order)));
    await optional('global_challenges.csv', (t) => (extras.challenges = parseChallenges(t, order)));
    await optional('goals.csv', (t) => (extras.goals = parseGoals(t, order)));
    await optional('privacy_zones.csv', (t) => (extras.privacyZones = parsePrivacyZones(t)));
    await optional('general_preferences.csv', (t) => (extras.units = parseUnits(t)));
    return {
      csv,
      firstName,
      exportDate: a.modified('activities.csv'),
      fileCount: a.list('').length,
      activityFileCount: files.length,
      extras,
    };
  }

  async track(job: TrackJob): Promise<TrackSummary> {
    const a = this.need();
    try {
      if (!job.filename || !a.has(job.filename)) {
        return failed(job.id, 'missing');
      }
      const bytes = await a.payload(job.filename);
      const decoded = decodeActivityBytes(bytes);
      return summarizeTrack(decoded, { id: job.id, csvDistance: job.csvDistance });
    } catch (err) {
      return failed(job.id, String((err as Error)?.message ?? err));
    }
  }

  async media(paths: string[], maxBytes: number): Promise<MediaItem[]> {
    const a = this.need();
    const out: MediaItem[] = [];
    for (const p of paths) {
      try {
        if (!a.has(p) || a.size(p) > maxBytes) continue;
        const bytes = await a.bytes(p);
        const ext = p.split('.').pop()?.toLowerCase() ?? '';
        const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'heic' ? 'image/heic' : 'image/jpeg';
        out.push({ path: p, bytes, type });
      } catch {
        /* sigue */
      }
    }
    return out;
  }

  async close() {
    await this.archive?.close();
    this.archive = null;
  }

  private need(): Archive {
    if (!this.archive) throw new ArchiveError('read', 'Archivo no abierto');
    return this.archive;
  }
}

function failed(id: string, error: string): TrackSummary {
  return {
    id,
    ok: false,
    error,
    startUtc: null,
    localOffsetMin: null,
    sport: null,
    subSport: null,
    hasGps: false,
    start: null,
    end: null,
    track: null,
    trackCum: null,
    bbox: null,
    efforts: {},
    hrHist: null,
    maxHr: NaN,
    avgHr: NaN,
    altMax: NaN,
    altMin: NaN,
    tempAvg: NaN,
    tempMin: NaN,
    tempMax: NaN,
    steps: NaN,
    gpsDistance: 0,
  };
}

export function transferablesOf(results: TrackSummary[]): Transferable[] {
  const t: Transferable[] = [];
  for (const r of results) {
    if (r.track) t.push(r.track.buffer as ArrayBuffer);
    if (r.trackCum) t.push(r.trackCum.buffer as ArrayBuffer);
    if (r.hrHist) t.push(r.hrHist.buffer as ArrayBuffer);
  }
  return t;
}
