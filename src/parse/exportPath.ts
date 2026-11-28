// Aparte de archive.ts a propósito: lo usa la portada, que no debe cargar el lector de .zip hasta que haga falta.

/** Ficheros sueltos del export que se usan (el resto ni se abre). */
const USED_FILE = /^(activities|profile|reactions|global_challenges|goals|privacy_zones|general_preferences)\.csv$/i;

/**
 * Ruta de un fichero dentro del export, sin la carpeta de fuera ("export_123/activities/1.fit.gz" →
 * "activities/1.fit.gz"), o null si ese fichero no se usa. Para cuando se elige o se suelta la
 * carpeta ya descomprimida: así no se cargan miles de ficheros que no hacen falta, pero sí los de
 * las zonas de privacidad, los objetivos o las unidades.
 */
export function exportPath(path: string): string | null {
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  const last = parts.length - 1;
  const k = parts.findIndex((x, i) => (i < last && /^(activities|media)$/i.test(x)) || (i === last && USED_FILE.test(x)));
  return k < 0 ? null : parts.slice(k).join('/');
}
