import type { Lang } from './langs';

/**
 * Detalles tipográficos de los textos de la web: "100 %" no se parte nunca entre líneas y, en
 * francés, espacio fino irrompible antes de : ; ! ? » y después de «. Lo usan la web y las
 * páginas estáticas de cada idioma que se generan al compilar.
 */
export function polishSite<K extends string>(lang: Lang, dict: Record<K, string>): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const [k, v] of Object.entries(dict) as [K, string][]) {
    let s = v.replace(/(\d) %/g, '$1 %');
    if (lang === 'fr') s = s.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');
    out[k] = s;
  }
  return out;
}
