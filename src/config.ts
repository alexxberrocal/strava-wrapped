// Configuración de marca y despliegue. Cambia aquí el nombre y el dominio de la web.
export const BRAND = {
  /** Nombre que aparece en la web y en las tarjetas. */
  name: 'RUNRECAP',
  /** Dominio que se imprime como marca de agua en las imágenes y vídeos compartidos. */
  domain: 'runrecap.app',
  /**
   * Página de Strava donde se pide el archivo ("Descarga tu cuenta" → "Solicitar descarga").
   * Ojo: /athlete/delete_your_account es ahora la de ELIMINAR la cuenta.
   */
  stravaExportUrl: 'https://www.strava.com/athlete/download_my_account',
};

/** Distancia (m) que se recorta al principio y al final de cada ruta para no revelar tu casa. */
export const PRIVACY_TRIM_METERS = 250;
