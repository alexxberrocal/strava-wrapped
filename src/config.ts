// Configuración de marca y despliegue. Cambia aquí el nombre y el dominio de la web.
export const BRAND = {
  /** Nombre que aparece en la web y en las tarjetas. */
  name: 'RUNRECAP',
  /** Dominio que se imprime como marca de agua en las imágenes y vídeos compartidos. */
  domain: 'runrecap.app',
  /** Enlace directo a la página de Strava donde se solicita el archivo. */
  stravaExportUrl: 'https://www.strava.com/athlete/delete_your_account',
};

/** Distancia (m) que se recorta al principio y al final de cada ruta para no revelar tu casa. */
export const PRIVACY_TRIM_METERS = 250;
