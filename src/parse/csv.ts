/**
 * Parser CSV (RFC 4180) tolerante: comillas, comillas escapadas, saltos de línea dentro de
 * campos (las descripciones de Strava los tienen), CRLF y BOM.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const n = text.length;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let row: string[] = [];
  let field = '';
  let fieldStarted = false;

  while (i < n) {
    const c = text.charCodeAt(i);
    if (c === 34 /* " */ && !fieldStarted) {
      // Campo entrecomillado.
      i++;
      let value = '';
      for (;;) {
        const q = text.indexOf('"', i);
        if (q === -1) {
          value += text.slice(i);
          i = n;
          break;
        }
        value += text.slice(i, q);
        if (text.charCodeAt(q + 1) === 34) {
          value += '"';
          i = q + 2;
          continue;
        }
        i = q + 1;
        break;
      }
      field += value;
      fieldStarted = true;
      continue;
    }
    if (c === 44 /* , */) {
      row.push(field);
      field = '';
      fieldStarted = false;
      i++;
      continue;
    }
    if (c === 10 /* \n */ || c === 13 /* \r */) {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      fieldStarted = false;
      i += c === 13 && text.charCodeAt(i + 1) === 10 ? 2 : 1;
      continue;
    }
    // Tramo sin caracteres especiales.
    let j = i + 1;
    while (j < n) {
      const d = text.charCodeAt(j);
      if (d === 44 || d === 10 || d === 13) break;
      j++;
    }
    field += text.slice(i, j);
    fieldStarted = true;
    i = j;
  }
  if (fieldStarted || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Quita filas totalmente vacías (p. ej. línea final).
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

/** Número tolerante: "1234.5", "1234,5", "" -> NaN. Sin separadores de miles (los campos crudos no los tienen). */
export function num(v: string | undefined): number {
  if (v == null) return NaN;
  let s = v.trim();
  if (s === '') return NaN;
  if (s.indexOf(',') !== -1) {
    if (s.indexOf('.') === -1 && s.split(',').length === 2) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
  }
  const x = Number(s);
  return Number.isFinite(x) ? x : NaN;
}

/** Limpia una cabecera: quita HTML (Strava mete <span class="translation_missing">), espacios y BOM. */
export function cleanHeader(h: string): string {
  return h
    .replace(/<[^>]*>/g, '')
    .replace(/﻿/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normaliza para comparar: minúsculas, sin acentos ni puntuación. */
export function normKey(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
