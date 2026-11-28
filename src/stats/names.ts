/** Quita emojis y símbolos raros de un nombre (la tipografía de las tarjetas no los tiene). */
export function cleanName(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Partículas con las que un nombre no debe acabar al recortarlo ("Juan Carlos de la"). */
const PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'i', 'da', 'do', 'dos', 'das', 'di', 'du', 'le', 'van', 'von', 'der', 'den', 'ten', 'bin', 'al']);

/**
 * Nombre del atleta tal como sale en las tarjetas: sin emojis y con 18 letras como mucho (el campo
 * de la web tiene ese tope, pero el nombre del perfil de Strava puede ser larguísimo y pisaría la
 * marca de la cabecera). Si puede, corta por un espacio en vez de partir una palabra.
 */
export function athleteName(raw: string, max = 18): string {
  const chars = [...cleanName(raw ?? '')];
  if (chars.length <= max) return chars.join('');
  const cut = chars.slice(0, max).join('');
  const space = cut.lastIndexOf(' ');
  if (space < 3) return cut.trim();
  const words = cut.slice(0, space).trim().split(' ');
  while (words.length > 1 && PARTICLES.has(words[words.length - 1].toLowerCase())) words.pop();
  return words.join(' ');
}
