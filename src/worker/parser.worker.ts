import { ArchiveError } from '../parse/archive';
import type { TrackSummary } from '../parse/track';
import { ParserCore, transferablesOf } from './core';
import type { WorkerRequest, WorkerResponse } from './protocol';

const scope = globalThis as unknown as {
  postMessage(msg: WorkerResponse, transfer?: Transferable[]): void;
  addEventListener(type: 'message', fn: (e: MessageEvent<WorkerRequest>) => void): void;
};

const core = new ParserCore();
let queue: Promise<void> = Promise.resolve();

scope.addEventListener('message', (e) => {
  const req = e.data;
  // Las peticiones se atienden en orden.
  queue = queue.then(() => handle(req)).catch(() => undefined);
});

async function handle(req: WorkerRequest): Promise<void> {
  try {
    switch (req.type) {
      case 'open': {
        await core.open(req.input);
        const scan = req.scan ? await core.scan() : null;
        scope.postMessage({ type: 'result', reqId: req.reqId, data: scan });
        break;
      }
      case 'tracks': {
        const results: TrackSummary[] = [];
        let done = 0;
        for (const job of req.jobs) {
          results.push(await core.track(job));
          done++;
          if (done % 4 === 0) scope.postMessage({ type: 'progress', reqId: req.reqId, done });
        }
        scope.postMessage({ type: 'result', reqId: req.reqId, data: results }, transferablesOf(results));
        break;
      }
      case 'media': {
        const items = await core.media(req.paths, req.maxBytes);
        scope.postMessage(
          { type: 'result', reqId: req.reqId, data: items },
          items.map((i) => i.bytes.buffer as ArrayBuffer),
        );
        break;
      }
      case 'close': {
        await core.close();
        scope.postMessage({ type: 'result', reqId: req.reqId, data: null });
        break;
      }
    }
  } catch (err) {
    const code = err instanceof ArchiveError ? err.code : 'unknown';
    scope.postMessage({ type: 'error', reqId: req.reqId, code, message: String((err as Error)?.message ?? err) });
  }
}
