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

/**
 * Titular de la web (aviso legal, art. 10 de la LSSI). El NIF y el domicilio son obligatorios desde
 * que la web tenga ingresos (publicidad): sin ellos no se pueden activar los anuncios (el build falla).
 */
export const OWNER = {
  name: 'Àlex Berrocal',
  nif: '',
  address: '',
  /** Correo de contacto (redirigido con Cloudflare Email Routing: no enseña el personal). */
  email: 'hola@myrunyear.com',
};

/**
 * Publicidad (Google AdSense). Con `client` vacío no hay anuncios ni cookies, y los textos legales
 * dicen eso mismo. Al rellenarlo ("ca-pub-…"): se carga el script de AdSense (con su aviso de
 * consentimiento homologado), se publica ads.txt, aparece "Preferencias de privacidad" en el pie y
 * los textos legales pasan a su versión con publicidad. Los huecos de anuncio solo se pintan si
 * tienen su identificador (`slots`), y nunca dentro de la historia ni en las imágenes.
 */
export const ADS = {
  client: '',
  slots: {
    /** Portada, entre la galería y las preguntas. */
    home: '',
    /** Bajo la parrilla de pantallas, tras ver la historia. */
    results: '',
    /** Al final de las páginas de contenido (guía, cómo se calcula…). */
    page: '',
  },
};

/** Fecha de la última revisión de los textos legales (AAAA-MM-DD). */
export const LEGAL_UPDATED = '2026-11-28';

/** Enlace para compartir: la página del idioma, con su vista previa traducida. */
export function shareUrl(lang: Lang): string {
  return `${BRAND.siteUrl}${lang}/`;
}

/** Distancia (m) que se recorta al principio y al final de cada ruta para no revelar tu casa. */
export const PRIVACY_TRIM_METERS = 250;
