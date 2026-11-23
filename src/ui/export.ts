import type { Card, CardPainter } from '../render/card';
import { H, W } from '../render/kit';

/** Imagen final de una tarjeta a 1080×1920 (formato historia de Instagram). */
export async function renderPng(painter: CardPainter, card: Card): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  painter.clone().paint(ctx, card, 0, 1, { still: true });
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}

/** Miniatura en un canvas existente (estado final). */
export function paintThumb(painter: CardPainter, card: Card, canvas: HTMLCanvasElement, cssWidth: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(((cssWidth * H) / W) * dpr);
  painter.paint(canvas.getContext('2d')!, card, 0, canvas.width / W, { still: true });
}

let videoSupport: Promise<string | null> | null = null;

/** Códec de vídeo que el navegador sabe codificar (H.264 preferido: es lo que acepta Instagram). */
export function videoCodec(): Promise<string | null> {
  if (!videoSupport) {
    videoSupport = (async () => {
      if (typeof VideoEncoder === 'undefined') return null;
      try {
        const mb = await import('mediabunny');
        return (await mb.getFirstEncodableVideoCodec(['avc', 'hevc'], { width: W, height: H })) ?? null;
      } catch {
        return null;
      }
    })();
  }
  return videoSupport;
}

/**
 * Vídeo MP4 (1080×1920, 30 fps) con la animación de la tarjeta, fotograma a fotograma con
 * WebCodecs: más rápido que tiempo real y sin saltos.
 */
export async function renderVideo(painter: CardPainter, card: Card, onProgress: (p: number) => void, signal?: AbortSignal): Promise<Blob> {
  const codec = await videoCodec();
  if (!codec) throw new Error('no-video');
  const mb = await import('mediabunny');
  painter = painter.clone();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const fps = 30;
  const totalMs = card.duration + 600;
  const frames = Math.ceil((totalMs / 1000) * fps);
  const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new mb.BufferTarget() });
  const source = new mb.CanvasSource(canvas, { codec: codec as 'avc' | 'hevc', bitrate: 8_000_000, keyFrameInterval: 2 });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();
  for (let i = 0; i < frames; i++) {
    if (signal?.aborted) {
      await output.cancel();
      throw new DOMException('Cancelado', 'AbortError');
    }
    painter.paint(ctx, card, (i * 1000) / fps, 1);
    await source.add(i / fps, 1 / fps);
    if (i % 6 === 0) {
      onProgress(i / frames);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  await output.finalize();
  onProgress(1);
  const buf = output.target.buffer;
  if (!buf) throw new Error('video-empty');
  return new Blob([buf], { type: 'video/mp4' });
}

/** Todas las tarjetas como PNG dentro de un .zip. */
export async function renderZip(painter: CardPainter, cards: Card[], prefix: string, onProgress: (p: number) => void): Promise<Blob> {
  const { BlobWriter, BlobReader, ZipWriter } = await import('@zip.js/zip.js');
  const writer = new ZipWriter(new BlobWriter('application/zip'), { level: 0, useWebWorkers: false });
  painter = painter.clone();
  for (let i = 0; i < cards.length; i++) {
    const png = await renderPng(painter, cards[i]);
    await writer.add(`${prefix}-${String(i + 1).padStart(2, '0')}-${cards[i].id}.png`, new BlobReader(png));
    onProgress((i + 1) / cards.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  return writer.close();
}
