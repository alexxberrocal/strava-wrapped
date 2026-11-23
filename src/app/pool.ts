import type { ArchiveInput } from '../parse/archive';
import type { TrackSummary } from '../parse/track';
import type { MediaItem, ScanResult, TrackJob } from '../worker/core';
import type { WorkerRequest, WorkerResponse } from '../worker/protocol';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Req = DistributiveOmit<WorkerRequest, 'reqId'>;

export class PoolError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

interface Endpoint {
  call<T>(req: Req, onProgress?: (done: number) => void): Promise<T>;
  terminate(): void;
}

let nextId = 1;

function workerEndpoint(w: Worker): Endpoint {
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; progress?: (d: number) => void }>();
  w.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
    const msg = e.data;
    const p = pending.get(msg.reqId);
    if (!p) return;
    if (msg.type === 'progress') p.progress?.(msg.done);
    else if (msg.type === 'result') {
      pending.delete(msg.reqId);
      p.resolve(msg.data);
    } else {
      pending.delete(msg.reqId);
      p.reject(new PoolError(msg.code, msg.message));
    }
  });
  w.addEventListener('error', (e) => {
    for (const [, p] of pending) p.reject(new PoolError('worker', e.message || 'Worker error'));
    pending.clear();
  });
  return {
    call<T>(req: Req, onProgress?: (done: number) => void) {
      const reqId = nextId++;
      return new Promise<T>((resolve, reject) => {
        pending.set(reqId, { resolve: resolve as (v: unknown) => void, reject, progress: onProgress });
        w.postMessage({ ...req, reqId });
      });
    },
    terminate: () => w.terminate(),
  };
}

/** Sin Web Workers (CSP muy restrictiva…): mismo código en el hilo principal, cediendo el control. */
async function inlineEndpoint(): Promise<Endpoint> {
  const { ParserCore } = await import('../worker/core');
  const core = new ParserCore();
  const yieldUi = () => new Promise((r) => setTimeout(r, 0));
  return {
    async call<T>(req: Req, onProgress?: (done: number) => void): Promise<T> {
      try {
        switch (req.type) {
          case 'open':
            await core.open(req.input);
            return (req.scan ? await core.scan() : null) as T;
          case 'tracks': {
            const out: TrackSummary[] = [];
            for (const job of req.jobs) {
              out.push(await core.track(job));
              onProgress?.(out.length);
              await yieldUi();
            }
            return out as T;
          }
          case 'media':
            return (await core.media(req.paths, req.maxBytes)) as T;
          case 'close':
            await core.close();
            return null as T;
        }
        throw new PoolError('unknown', 'Petición desconocida');
      } catch (err) {
        const code = (err as { code?: string }).code ?? 'unknown';
        throw new PoolError(code, String((err as Error)?.message ?? err));
      }
    },
    terminate() {
      void core.close();
    },
  };
}

function createWorker(): Worker | null {
  try {
    return new Worker(new URL('../worker/parser.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    return null;
  }
}

/**
 * Pool de workers: uno escanea el CSV; luego todos procesan ficheros de actividad en paralelo
 * con una cola dinámica (cada worker pide más trabajo al terminar su lote).
 */
export class ParserPool {
  private endpoints: Endpoint[] = [];
  private opened: Promise<unknown>[] = [];
  private size: number;

  constructor(private input: ArchiveInput) {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
    this.size = Math.max(1, Math.min(4, cores - 1));
  }

  async scan(): Promise<ScanResult> {
    const first = createWorker();
    let ep: Endpoint;
    if (first) {
      ep = workerEndpoint(first);
      try {
        const res = await ep.call<ScanResult>({ type: 'open', input: this.input, scan: true });
        this.endpoints.push(ep);
        this.opened.push(Promise.resolve());
        return res;
      } catch (err) {
        ep.terminate();
        if (err instanceof PoolError && err.code !== 'worker' && err.code !== 'unknown') throw err;
        // El worker no arrancó: modo sin workers.
      }
    }
    this.size = 1;
    ep = await inlineEndpoint();
    const res = await ep.call<ScanResult>({ type: 'open', input: this.input, scan: true });
    this.endpoints.push(ep);
    this.opened.push(Promise.resolve());
    return res;
  }

  private ensureWorkers(n: number) {
    while (this.endpoints.length < Math.min(n, this.size)) {
      const w = createWorker();
      if (!w) {
        this.size = this.endpoints.length;
        return;
      }
      const ep = workerEndpoint(w);
      this.endpoints.push(ep);
      this.opened.push(ep.call({ type: 'open', input: this.input, scan: false }));
    }
  }

  async tracks(jobs: TrackJob[], onProgress?: (done: number, total: number) => void): Promise<TrackSummary[]> {
    if (!jobs.length) return [];
    if (!this.endpoints.length) throw new PoolError('read', 'scan() primero');
    const wanted = jobs.length > 24 ? this.size : 1;
    this.ensureWorkers(wanted);
    const results: TrackSummary[] = [];
    const queue = [...jobs];
    const chunk = Math.max(2, Math.min(12, Math.ceil(jobs.length / (this.endpoints.length * 4))));
    let doneTotal = 0;
    const runner = async (ep: Endpoint, i: number) => {
      try {
        await this.opened[i];
      } catch {
        return; // este worker no pudo abrir el archivo; los demás siguen
      }
      while (queue.length) {
        const batch = queue.splice(0, chunk);
        let reported = 0;
        try {
          const res = await ep.call<TrackSummary[]>({ type: 'tracks', jobs: batch }, (d) => {
            doneTotal += d - reported;
            reported = d;
            onProgress?.(doneTotal, jobs.length);
          });
          doneTotal += batch.length - reported;
          onProgress?.(doneTotal, jobs.length);
          results.push(...res);
        } catch (err) {
          // Devolvemos el lote a la cola para otro worker y dejamos este.
          queue.push(...batch);
          throw err;
        }
      }
    };
    const runs = this.endpoints.map((ep, i) => runner(ep, i).catch(() => undefined));
    await Promise.all(runs);
    if (queue.length) {
      // Último intento con el primer endpoint (el del escaneo, que seguro abrió bien).
      const rest = await this.endpoints[0].call<TrackSummary[]>({ type: 'tracks', jobs: queue.splice(0) });
      results.push(...rest);
    }
    return results;
  }

  async media(paths: string[], maxBytes = 12_000_000): Promise<MediaItem[]> {
    if (!this.endpoints.length || !paths.length) return [];
    return this.endpoints[0].call<MediaItem[]>({ type: 'media', paths, maxBytes });
  }

  dispose() {
    for (const ep of this.endpoints) ep.terminate();
    this.endpoints = [];
    this.opened = [];
  }
}
