import { LANGS } from '../i18n/langs';

const LANG_DIR = new RegExp(`/(?:${LANGS.join('|')})/$`);

/**
 * Raíz de la web (con barra final), también desde las páginas de cada idioma (/en/, /fr/…):
 * el despliegue usa rutas relativas y puede vivir en la raíz o en una subcarpeta.
 */
export function siteRootUrl(): string {
  const href = typeof location !== 'undefined' ? location.href : 'http://localhost/';
  const dir = new URL('.', href);
  dir.pathname = dir.pathname.replace(LANG_DIR, '/');
  dir.search = '';
  dir.hash = '';
  return dir.href;
}

/** URL de un fichero de /public/data respetando la base del despliegue (raíz o subcarpeta). */
export function dataUrl(name: string): string {
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  if (base.startsWith('/') || /^https?:/.test(base)) return `${base.endsWith('/') ? base : base + '/'}data/${name}`;
  return new URL(`data/${name}`, siteRootUrl()).href;
}
