// Configuración de marca y despliegue. Cambia aquí el nombre, el dominio y los datos del titular.
import type { Lang } from './i18n/langs';

/** URL pública de la web con barra final. La fija el build (VITE_SITE_URL, ver vite.config.ts). */
const SITE_URL = ((import.meta.env?.VITE_SITE_URL as string | undefined) || 'https://myrunyear.com/').replace(/\/?$/, '/');

export const BRAND = {
  /** Logotipo: así sale en la cabecera de la web y en las tarjetas. */
  name: 'MY RUN YEAR',
  /** El nombre dentro de una frase, en títulos de página y al compartir. */
  text: 'My Run Year',
  /** Para nombres de archivo y claves guardadas en el navegador. */
  slug: 'myrunyear',
  /** Dominio que se imprime como marca de agua en las imágenes y vídeos compartidos. */
  domain: 'myrunyear.com',
  /** Dirección pública de la web (enlaces al compartir y vista previa en WhatsApp y redes). */
  siteUrl: SITE_URL,
  /**
   * Página de Strava donde se pide el archivo ("Descarga tu cuenta" → "Solicitar descarga").
   * Ojo: /athlete/delete_your_account es ahora la de ELIMINAR la cuenta.
   */
  stravaExportUrl: 'https://www.strava.com/athlete/download_my_account',
};

/** Enlace para compartir: la página del idioma, con su vista previa traducida. */
export function shareUrl(lang: Lang): string {
  return `${BRAND.siteUrl}${lang}/`;
}

/** Distancia (m) que se recorta al principio y al final de cada ruta para no revelar tu casa. */
export const PRIVACY_TRIM_METERS = 250;
