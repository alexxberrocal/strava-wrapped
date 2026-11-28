/**
 * Páginas de texto de la web (guía, cómo se calcula, sobre el proyecto, aviso legal, privacidad y
 * cookies). Se convierten en HTML estático al compilar (scripts/site-pages.ts): no viajan en el
 * JavaScript de la web.
 *
 * Marcas dentro de los textos:
 *   - `**negrita**` y `[texto](destino)`. Destinos: `home`, `home#crear`, `page:privacy`,
 *     `page:privacy#cookies`, `strava` (la página de Strava para pedir el archivo), `mail`,
 *     `licenses` o una dirección `https://…`.
 *   - Variables: {brand}, {domain}, {owner}, {nif}, {address}, {email}.
 *   - Un bloque cuyas líneas empiezan por "- " es una lista; por "1. ", "2. "…, una lista numerada.
 */
export const PAGE_IDS = ['guide', 'how', 'about', 'legal', 'privacy'] as const;
export type PageId = (typeof PAGE_IDS)[number];

/** Carpeta de cada página dentro de la de su idioma: /es/guide/, /en/guide/… */
export const PAGE_SLUG: Record<PageId, string> = {
  guide: 'guide',
  how: 'how-it-works',
  about: 'about',
  legal: 'legal',
  privacy: 'privacy',
};

/** Condición para que un bloque salga: con o sin publicidad, o con el NIF / el domicilio rellenados. */
export type Cond = 'ads' | 'noads' | 'nif' | 'address';

export type Block = string | { when: Cond; text: string };

export interface Section {
  /** Ancla (#cookies) para enlazar la sección. */
  id?: string;
  when?: Cond;
  h: string;
  body: Block[];
}

export interface PageDoc {
  /** Título de la página (h1 y <title>). */
  title: string;
  /** Descripción para buscadores y vistas previas. */
  description: string;
  /** Antetítulo. */
  kicker: string;
  /** Entradilla. */
  lead: string;
  sections: Section[];
}

export type PagesContent = Record<PageId, PageDoc> & {
  ui: {
    /** "Última actualización: {date}" */
    updated: string;
    /** Título de la lista de idiomas al pie. */
    languages: string;
  };
};
