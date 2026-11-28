import { BRAND, shareUrl } from '../config';
import { siteLang, tr } from '../i18n/site';
import { toast } from './dom';

/**
 * Invita a otros a hacerse su resumen: texto + enlace a la página del idioma (con su vista previa
 * traducida en WhatsApp y redes). Sin hoja nativa de compartir, se copia al portapapeles.
 */
export async function inviteFriends(): Promise<void> {
  const text = tr('share.textFull', { url: shareUrl(siteLang()) });
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: BRAND.text, text });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast(tr('share.copied'));
  } catch {
    toast(text, 8000);
  }
}
