/** Idiomas de la web y de las tarjetas. */
export const LANGS = ['es', 'ca', 'en', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'zh', 'ja', 'ko'] as const;
export type Lang = (typeof LANGS)[number];

/** Nombre de cada idioma en su propio idioma (para el selector). */
export const LANG_NAMES: Record<Lang, string> = {
  es: 'Español',
  ca: 'Català',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
};

/** Configuración regional para fechas y números (Intl). */
export const LOCALE: Record<Lang, string> = {
  es: 'es-ES',
  ca: 'ca-ES',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  nl: 'nl-NL',
  ru: 'ru-RU',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

/** Para Open Graph (og:locale). */
export const OG_LOCALE: Record<Lang, string> = {
  es: 'es_ES',
  ca: 'ca_ES',
  en: 'en_US',
  fr: 'fr_FR',
  de: 'de_DE',
  it: 'it_IT',
  pt: 'pt_BR',
  nl: 'nl_NL',
  ru: 'ru_RU',
  zh: 'zh_CN',
  ja: 'ja_JP',
  ko: 'ko_KR',
};

/** Escritura: decide la tipografía de las tarjetas (Anton no tiene cirílico ni CJK). */
export type Script = 'latin' | 'cyrillic' | 'sc' | 'ja' | 'ko';
export const SCRIPT: Record<Lang, Script> = {
  es: 'latin',
  ca: 'latin',
  en: 'latin',
  fr: 'latin',
  de: 'latin',
  it: 'latin',
  pt: 'latin',
  nl: 'latin',
  ru: 'cyrillic',
  zh: 'sc',
  ja: 'ja',
  ko: 'ko',
};

/** Idiomas sin mayúsculas (los titulares no se pasan a mayúsculas ni se espacian letra a letra). */
export const NO_CASE = new Set<Lang>(['zh', 'ja', 'ko']);

export function isLang(x: unknown): x is Lang {
  return typeof x === 'string' && (LANGS as readonly string[]).includes(x);
}

/** Idioma más parecido a una etiqueta del navegador ("pt-BR" → pt, "ca-ES" → ca, "zh-TW" → zh…). */
export function langFromTag(tag: string | null | undefined): Lang | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  if (base === 'va' || base === 'val') return 'ca'; // valenciano
  if (base === 'gl' || base === 'eu') return 'es';
  return isLang(base) ? base : null;
}
