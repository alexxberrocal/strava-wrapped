import type { ArchiveInput } from '../parse/archive';
import type { TrackJob } from './core';

export type WorkerRequest =
  | { type: 'open'; reqId: number; input: ArchiveInput; scan: boolean }
  | { type: 'tracks'; reqId: number; jobs: TrackJob[] }
  | { type: 'media'; reqId: number; paths: string[]; maxBytes: number }
  | { type: 'close'; reqId: number };

export type WorkerResponse =
  | { type: 'result'; reqId: number; data: unknown }
  | { type: 'progress'; reqId: number; done: number }
  | { type: 'error'; reqId: number; code: string; message: string };
