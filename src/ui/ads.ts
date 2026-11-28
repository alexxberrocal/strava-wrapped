/**
 * Publicidad (solo si está configurada en src/config.ts: ver `ADS`). Los huecos van en el HTML;
 * aquí se activan cuando ya se ven, porque AdSense necesita su anchura real. Nunca hay anuncios
 * dentro de la historia ni en las imágenes.
 */
export function fillAds(root: ParentNode = document) {
  const w = window as unknown as { adsbygoogle?: unknown[] };
  root.querySelectorAll<HTMLElement>('ins.adsbygoogle:not([data-adsbygoogle-status]):not([data-filled])').forEach((ins) => {
    if (!ins.offsetWidth) return;
    ins.dataset.filled = '1';
    try {
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* bloqueador de anuncios */
    }
  });
}
