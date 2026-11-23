import type { Fmt } from '../../i18n/format';
import type { RunRef, TimeOfDay, ArchetypeKey } from '../../stats/types';

/** Quita emojis y símbolos raros de los nombres de actividad (la tipografía no los tiene). */
export function cleanName(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Parte un texto en como mucho `maxLines` líneas equilibradas. */
export function splitLines(text: string, maxLines: number, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
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

export function timeOfDayTitle(fmt: Fmt, tod: TimeOfDay): [string, string] {
  const es: Record<TimeOfDay, [string, string]> = {
    dawn: ['ALMA', 'MADRUGADORA'],
    morning: ['RUNNER DE', 'MAÑANAS'],
    midday: ['A LA HORA', 'DE COMER'],
    afternoon: ['RUNNER DE', 'TARDES'],
    evening: ['RUNNER DEL', 'ATARDECER'],
    night: ['CRIATURA', 'NOCTURNA'],
  };
  const en: Record<TimeOfDay, [string, string]> = {
    dawn: ['EARLY', 'BIRD'],
    morning: ['MORNING', 'RUNNER'],
    midday: ['LUNCH BREAK', 'RUNNER'],
    afternoon: ['AFTERNOON', 'RUNNER'],
    evening: ['GOLDEN HOUR', 'RUNNER'],
    night: ['NIGHT', 'OWL'],
  };
  return fmt.t(es, en)[tod];
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
