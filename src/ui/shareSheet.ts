import type { Card, CardPainter } from '../render/card';
import { tr } from '../i18n/site';
import { canShareFiles, downloadBlob, h, iconButton, toast } from './dom';
import { paintThumb, renderPng, renderVideo, videoCodec } from './export';

export interface ShareOptions {
  painter: CardPainter;
  card: Card;
  index: number;
  filePrefix: string;
  brand: string;
  onClose?(): void;
}

/** Hoja de compartir: imagen (lista al instante) y vídeo animado (bajo demanda). */
export function openShareSheet(o: ShareOptions) {
  const name = `${o.filePrefix}-${String(o.index + 1).padStart(2, '0')}-${o.card.id}`;
  let png: File | null = null;
  let mp4: File | null = null;
  let abort: AbortController | null = null;

  const thumbCanvas = h('canvas');
  const thumb = h('div', { class: 'sheet__thumb' }, thumbCanvas);
  requestAnimationFrame(() => paintThumb(o.painter, o.card, thumbCanvas, 150));

  const shareImg = h('button', { type: 'button', class: 'btn btn--primary', disabled: true }, tr('share.image'));
  const dlImg = h('button', { type: 'button', class: 'btn btn--ghost', disabled: true }, tr('share.imageDl'));
  const makeVideo = h('button', { type: 'button', class: 'btn btn--ghost' }, tr('share.video'));
  const videoNote = h('p', { class: 'sheet__note', hidden: true });
  const buttons = h('div', { class: 'sheet__buttons' }, shareImg, dlImg, makeVideo, videoNote);

  const shareFile = async (file: File) => {
    if (canShareFiles([file])) {
      try {
        await navigator.share({ files: [file], title: o.brand, text: tr('share.text', { brand: o.brand }) });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    downloadBlob(file, file.name);
  };

  shareImg.addEventListener('click', () => png && shareFile(png));
  dlImg.addEventListener('click', () => png && downloadBlob(png, png.name));

  renderPng(o.painter, o.card)
    .then((blob) => {
      png = new File([blob], `${name}.png`, { type: 'image/png' });
      shareImg.disabled = false;
      dlImg.disabled = false;
      // Si no hay hoja nativa, "compartir" = descargar: evitamos dos botones iguales.
      if (!canShareFiles([png])) shareImg.hidden = true;
    })
    .catch(() => toast('No se pudo generar la imagen'));

  videoCodec().then((codec) => {
    if (!codec) {
      makeVideo.disabled = true;
      videoNote.hidden = false;
      videoNote.textContent = tr('share.videoNo');
    }
  });

  makeVideo.addEventListener('click', async () => {
    if (mp4) return;
    makeVideo.disabled = true;
    abort = new AbortController();
    try {
      const blob = await renderVideo(
        o.painter,
        o.card,
        (p) => {
          makeVideo.textContent = tr('share.videoMaking', { pct: `${Math.round(p * 100)}%` });
        },
        abort.signal,
      );
      mp4 = new File([blob], `${name}.mp4`, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const video = h('video', { src: url, autoplay: true, loop: true, muted: true, playsinline: true });
      (video as HTMLVideoElement).muted = true;
      thumb.replaceChildren(video);
      const shareVid = h('button', { type: 'button', class: 'btn btn--primary' }, tr('share.videoShare'));
      const dlVid = h('button', { type: 'button', class: 'btn btn--ghost' }, tr('share.videoDl'));
      shareVid.addEventListener('click', () => mp4 && shareFile(mp4));
      dlVid.addEventListener('click', () => mp4 && downloadBlob(mp4, mp4.name));
      if (!canShareFiles([mp4])) shareVid.hidden = true;
      makeVideo.replaceWith(shareVid, dlVid);
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') {
        makeVideo.disabled = true;
        makeVideo.textContent = tr('share.video');
        videoNote.hidden = false;
        videoNote.textContent = tr('share.videoNo');
        console.warn(err);
      }
    }
  });

  const close = () => {
    abort?.abort();
    sheet.remove();
    window.removeEventListener('keydown', onKey);
    o.onClose?.();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  window.addEventListener('keydown', onKey);

  const body = h(
    'div',
    { class: 'sheet__body', role: 'dialog', 'aria-modal': 'true', 'aria-label': tr('share.title') },
    h('div', { class: 'sheet__head' }, h('h2', { class: 'sheet__title' }, tr('share.title')), iconButton('close', tr('story.close'), close)),
    h('div', { class: 'sheet__preview' }, thumb, buttons),
    h('p', { class: 'sheet__tip' }, tr('share.ig')),
  );
  const sheet = h('div', { class: 'sheet' }, body);
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) close();
  });
  document.body.append(sheet);
  (shareImg.hidden ? dlImg : shareImg).focus({ preventScroll: true });
}
