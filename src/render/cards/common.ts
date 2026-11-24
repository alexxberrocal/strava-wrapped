import type { Fmt } from '../../i18n/format';
import type { RunRef, HabitKey, ArchetypeKey } from '../../stats/types';

/** Quita emojis y símbolos raros de los nombres de actividad (la tipografía no los tiene). */
export function cleanName(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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

/** "1 maratón", "1,4 maratones", "53 maratones" (el plural depende de la cifra ya redondeada). */
export function marathonsLabel(fmt: Fmt, m: number): string {
  const txt = fmt.smart(m, m < 10 ? 1 : 0);
  const one = txt === '1';
  return `${txt} ${fmt.t(one ? 'maratón' : 'maratones', one ? 'marathon' : 'marathons')}`;
}

/** Tiempo legible para totales: "40 min", "1,5 horas", "37 horas". */
export function hoursLabel(fmt: Fmt, seconds: number): string {
  if (seconds < 3600) {
    const m = Math.max(1, Math.round(seconds / 60));
    return `${m} min`;
  }
  const h = seconds / 3600;
  const txt = h < 10 ? fmt.smart(h, 1) : fmt.num(h, 0);
  return `${txt} ${fmt.t(txt === '1' ? 'hora' : 'horas', txt === '1' ? 'hour' : 'hours')}`;
}

/**
 * Comparación con el año anterior: "+12 %", "−8 %", "×2,1" o "=" y su pie ("VS 2025",
 * "VS 2025 A ESTAS ALTURAS"). `up` = has corrido más.
 */
export function yearDelta(fmt: Fmt, cur: number, prev: { year: number; distance: number; partial: boolean }): { value: string; caption: string; up: boolean } | null {
  if (!(prev.distance > 0) || !(cur > 0)) return null;
  const ratio = cur / prev.distance;
  const caption = prev.partial ? fmt.t(`VS ${prev.year} A ESTAS ALTURAS`, `VS THIS TIME IN ${prev.year}`) : `VS ${prev.year}`;
  if (ratio >= 2) return { value: `×${fmt.smart(ratio, ratio < 10 ? 1 : 0)}`, caption, up: true };
  const pct = Math.round((ratio - 1) * 100);
  if (pct === 0) return { value: fmt.t('IGUAL', 'SAME'), caption: prev.partial ? fmt.t(`QUE ${prev.year} A ESTAS ALTURAS`, `AS THIS TIME IN ${prev.year}`) : fmt.t(`QUE EN ${prev.year}`, `AS ${prev.year}`), up: true };
  const sign = pct > 0 ? '+' : '−';
  return { value: `${sign}${fmt.num(Math.abs(pct))}%`, caption, up: pct > 0 };
}

export function effortLabel(fmt: Fmt, target: number): string {
  if (target === 1000) return '1 KM';
  if (target < 1700) return fmt.t('1 MILLA', '1 MILE');
  if (target === 5000) return '5K';
  if (target === 10000) return '10K';
  if (target < 30000) return fmt.t('MEDIA', 'HALF');
  return fmt.t('MARATÓN', 'MARATHON');
}

export function runWhen(fmt: Fmt, r: RunRef): string {
  return fmt.date(r.local);
}

/**
 * Título del perfil horario. `alt` = variante para no repetir el título del perfil runner
 * (si ese ya es "Alma madrugadora" o "Criatura nocturna").
 */
export function habitTitle(fmt: Fmt, key: HabitKey, alt = false): [string, string] {
  const es: Record<HabitKey, [string, string]> = {
    dawn: alt ? ['LAS CALLES', 'SON TUYAS'] : ['ALMA', 'MADRUGADORA'],
    sunrise: ['RUNNER DEL', 'AMANECER'],
    morning: ['RUNNER DE', 'MAÑANAS'],
    midday: ['A LA HORA', 'DE COMER'],
    afternoon: ['RUNNER DE', 'TARDES'],
    golden: ['RUNNER DEL', 'ATARDECER'],
    evening: ['RUNNER DE', 'ÚLTIMA HORA'],
    night: alt ? ['LA NOCHE', 'ES TUYA'] : ['CRIATURA', 'NOCTURNA'],
    anytime: ['RUNNER', 'SIN HORARIO'],
  };
  const en: Record<HabitKey, [string, string]> = {
    dawn: alt ? ['EMPTY', 'STREETS'] : ['EARLY', 'BIRD'],
    sunrise: ['SUNRISE', 'RUNNER'],
    morning: ['MORNING', 'RUNNER'],
    midday: ['LUNCH BREAK', 'RUNNER'],
    afternoon: ['AFTERNOON', 'RUNNER'],
    golden: ['GOLDEN HOUR', 'RUNNER'],
    evening: ['EVENING', 'RUNNER'],
    night: alt ? ['YOU OWN', 'THE NIGHT'] : ['NIGHT', 'OWL'],
    anytime: ['ANYTIME', 'RUNNER'],
  };
  return fmt.t(es, en)[key];
}

/** Frase del perfil horario ("El 64% de tus carreras fueron…"). */
export function habitSentence(fmt: Fmt, key: HabitKey, share: number): string {
  const pct = `**${fmt.pct(share)}**`;
  const es: Record<HabitKey, string> = {
    dawn: `El ${pct} de tus carreras empezaron entre las 4:00 y las 8:00.`,
    sunrise: `El ${pct} de tus carreras fueron con el sol saliendo.`,
    morning: `El ${pct} de tus carreras fueron por la mañana.`,
    midday: `El ${pct} de tus carreras fueron a mediodía.`,
    afternoon: `El ${pct} de tus carreras fueron por la tarde.`,
    golden: `El ${pct} de tus carreras fueron en la hora dorada, con el sol cayendo.`,
    evening: `El ${pct} de tus carreras fueron entre las 19:00 y las 22:00.`,
    night: `El ${pct} de tus carreras fueron de noche, entre las 22:00 y las 4:00.`,
    anytime: `Ninguna franja pasa del ${pct} de tus carreras: sales cuando te cuadra.`,
  };
  const en: Record<HabitKey, string> = {
    dawn: `${pct} of your runs started between 4 and 8 AM.`,
    sunrise: `${pct} of your runs were at sunrise.`,
    morning: `${pct} of your runs were in the morning.`,
    midday: `${pct} of your runs were around midday.`,
    afternoon: `${pct} of your runs were in the afternoon.`,
    golden: `${pct} of your runs were in golden hour, with the sun going down.`,
    evening: `${pct} of your runs were between 7 and 10 PM.`,
    night: `${pct} of your runs were at night, between 10 PM and 4 AM.`,
    anytime: `No time slot gets more than ${pct} of your runs: you go whenever it fits.`,
  };
  return fmt.t(es, en)[key];
}

export function archetypeText(fmt: Fmt, key: ArchetypeKey): { title: [string, string]; desc: string } {
  const es: Record<ArchetypeKey, { title: [string, string]; desc: string }> = {
    earlybird: { title: ['ALMA', 'MADRUGADORA'], desc: 'Sales cuando la ciudad aún duerme. Para ti, el día empieza con kilómetros.' },
    nightowl: { title: ['CRIATURA', 'NOCTURNA'], desc: 'Las farolas son tus mejores aliadas. Corres cuando los demás ya cenan.' },
    globetrotter: { title: ['TROTA', 'MUNDOS'], desc: 'Tus zapatillas tienen más sellos que tu pasaporte. Cada viaje, una ruta nueva.' },
    goat: { title: ['CABRA', 'MONTESA'], desc: 'Donde otros ven una cuesta, tú ves un plan. El llano te aburre.' },
    longhauler: { title: ['MÁQUINA', 'DE FONDO'], desc: 'Lo tuyo son los kilómetros largos. Cuando otros paran, tú acabas de calentar.' },
    speedster: { title: ['PURO', 'RAYO'], desc: 'El reloj se queda corto contigo. Ritmos que dan envidia en cualquier grupeta.' },
    metronome: { title: ['EL', 'METRÓNOMO'], desc: 'Llueva o haga sol, tú sales. La constancia es tu superpoder.' },
    weekender: { title: ['FIEBRE', 'DEL FINDE'], desc: 'De lunes a viernes, la vida. Sábado y domingo, los kilómetros.' },
    treadmill: { title: ['REY DE', 'LA CINTA'], desc: 'Ni frío ni lluvia: tu ruta favorita mide lo mismo que tu salón.' },
    allrounder: { title: ['RUNNER', 'TODOTERRENO'], desc: 'Un poco de todo y mucho de nada que te pare. El equilibrio también es un talento.' },
  };
  const en: Record<ArchetypeKey, { title: [string, string]; desc: string }> = {
    earlybird: { title: ['EARLY', 'BIRD'], desc: 'You head out while the city is still asleep. Your day starts with miles.' },
    nightowl: { title: ['NIGHT', 'OWL'], desc: 'Street lights are your best friends. You run while everyone else has dinner.' },
    globetrotter: { title: ['GLOBE', 'TROTTER'], desc: 'Your shoes have more stamps than your passport. Every trip, a new route.' },
    goat: { title: ['MOUNTAIN', 'GOAT'], desc: 'Where others see a hill, you see a plan. Flat roads bore you.' },
    longhauler: { title: ['DISTANCE', 'MACHINE'], desc: 'Long runs are your thing. When others stop, you are just warming up.' },
    speedster: { title: ['PURE', 'LIGHTNING'], desc: 'The clock struggles to keep up. Paces that make any group jealous.' },
    metronome: { title: ['THE', 'METRONOME'], desc: 'Rain or shine, you show up. Consistency is your superpower.' },
    weekender: { title: ['WEEKEND', 'WARRIOR'], desc: 'Monday to Friday is for life. Saturday and Sunday are for miles.' },
    treadmill: { title: ['TREADMILL', 'ROYALTY'], desc: 'No cold, no rain: your favourite route is the size of your living room.' },
    allrounder: { title: ['ALL-ROUND', 'RUNNER'], desc: 'A bit of everything and nothing that stops you. Balance is a talent too.' },
  };
  return fmt.t(es, en)[key];
}

export function sportLabel(fmt: Fmt, cat: string, raw: string): string {
  const es: Record<string, string> = { ride: 'Bici', swim: 'Natación', walk: 'Caminar', hike: 'Montaña', workout: 'Entrenos', weights: 'Pesas', yoga: 'Yoga', winter: 'Nieve', water: 'Agua' };
  const en: Record<string, string> = { ride: 'Ride', swim: 'Swim', walk: 'Walk', hike: 'Hike', workout: 'Workout', weights: 'Weights', yoga: 'Yoga', winter: 'Snow', water: 'Water' };
  const m = fmt.t(es, en);
  return m[cat] ?? (raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : fmt.t('Otros', 'Other'));
}
