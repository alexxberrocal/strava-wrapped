import type { Fmt } from '../../i18n/format';
import type { CardKey } from '../../i18n/cards/es';
import type { RunRef, HabitKey, ArchetypeKey } from '../../stats/types';

export { cleanName } from '../../stats/names';

/** Parte un texto en como mucho `maxLines` líneas equilibradas (sin dejar una palabra suelta). */
export function splitLines(text: string, maxLines: number, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  if (text.length <= maxChars || words.length === 1 || maxLines < 2) return [words.join(' ')];
  if (maxLines === 2 || words.length === 2) {
    let best: [string, string] = [words.join(' '), ''];
    let bestScore = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const score = Math.max(a.length, b.length);
      if (score < bestScore) {
        bestScore = score;
        best = [a, b];
      }
    }
    return best;
  }
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  const head = lines.slice(0, maxLines - 1);
  head.push(lines.slice(maxLines - 1).join(' '));
  return head;
}

/** "1 maratón", "1,4 maratones", "53 maratones" (el plural cuadra con la cifra que se ve). */
export function marathonsLabel(fmt: Fmt, m: number): string {
  return fmt.m('unit.marathons', { n: fmt.round(m, m < 10 ? 1 : 0) });
}

/** Tiempo legible para totales: "40 min", "1,5 horas", "37 horas". */
export function hoursLabel(fmt: Fmt, seconds: number): string {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} ${fmt.m('unit.min')}`;
  const h = seconds / 3600;
  return fmt.m('unit.hours', { n: fmt.round(h, h < 10 ? 1 : 0) });
}

/**
 * Comparación con el año anterior: "+12 %", "−8 %", "×2,1" o "IGUAL" y su pie ("VS 2025",
 * "VS 2025 A ESTAS ALTURAS"). `up` = has corrido más.
 */
export function yearDelta(fmt: Fmt, cur: number, prev: { year: number; distance: number; partial: boolean }): { value: string; caption: string; up: boolean } | null {
  if (!(prev.distance > 0) || !(cur > 0)) return null;
  const year = String(prev.year);
  const ratio = cur / prev.distance;
  const caption = fmt.upper(fmt.m(prev.partial ? 'delta.vsPartial' : 'delta.vs', { year }));
  if (ratio >= 2) return { value: `×${fmt.smart(ratio, ratio < 10 ? 1 : 0)}`, caption, up: true };
  const pct = Math.round((ratio - 1) * 100);
  if (pct === 0) return { value: fmt.upper(fmt.m('delta.same')), caption: fmt.upper(fmt.m(prev.partial ? 'delta.sameVsPartial' : 'delta.sameVs', { year })), up: true };
  const sign = pct > 0 ? '+' : '−';
  return { value: `${sign}${fmt.pct(Math.abs(pct) / 100)}`, caption, up: pct > 0 };
}

export function effortLabel(fmt: Fmt, target: number): string {
  if (target === 1000) return fmt.upper(fmt.m('effort.1k'));
  if (target < 1700) return fmt.upper(fmt.m('effort.mile'));
  if (target === 5000) return '5K';
  if (target === 10000) return '10K';
  if (target < 30000) return fmt.upper(fmt.m('effort.half'));
  return fmt.upper(fmt.m('effort.marathon'));
}

export function runWhen(fmt: Fmt, r: RunRef): string {
  return fmt.date(r.local);
}

/**
 * Título del perfil horario (dos líneas, en mayúsculas). `alt` = variante para no repetir el
 * título del perfil runner (si ese ya es "Alma madrugadora" o "Criatura nocturna").
 */
export function habitTitle(fmt: Fmt, key: HabitKey, alt = false): [string, string] {
  const k = (alt && (key === 'dawn' || key === 'night') ? `habit.${key}Alt` : `habit.${key}`) as CardKey;
  const [a, b = ''] = fmt.lines(k).map((l) => fmt.upper(l));
  return [a, b];
}

/** Frase del perfil horario ("El 64 % de tus carreras fueron…"). */
export function habitSentence(fmt: Fmt, key: HabitKey, share: number): string {
  return fmt.m(`habitText.${key}` as CardKey, { pct: fmt.pct(share) });
}

export function archetypeText(fmt: Fmt, key: ArchetypeKey): { title: [string, string]; desc: string } {
  const [a, b = ''] = fmt.lines(`arch.${key}` as CardKey).map((l) => fmt.upper(l));
  return { title: [a, b], desc: fmt.m(`arch.${key}.desc` as CardKey) };
}

const SPORTS = new Set(['ride', 'swim', 'walk', 'hike', 'workout', 'weights', 'yoga', 'winter', 'water']);
export function sportLabel(fmt: Fmt, cat: string, raw: string): string {
  if (SPORTS.has(cat)) return fmt.m(`sport.${cat}` as CardKey);
  return raw ? raw.charAt(0).toLocaleUpperCase(fmt.locale) + raw.slice(1) : fmt.m('sport.other');
}
