import tzlookup from 'tz-lookup';

const fmtCache = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat | null {
  let f = fmtCache.get(tz);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      });
    } catch {
      return null;
    }
    fmtCache.set(tz, f);
  }
  return f;
}

/** Zona horaria IANA en unas coordenadas (offline). */
export function tzAt(lat: number, lon: number): string | null {
  try {
    return tzlookup(lat, lon);
  } catch {
    return null;
  }
}

/** Minutos que hay que sumar a UTC para obtener la hora local en `tz` en ese instante. */
export function offsetMinutes(tz: string, utcMs: number): number | null {
  const f = formatter(tz);
  if (!f) return null;
  const parts: Record<string, number> = {};
  for (const p of f.formatToParts(new Date(utcMs))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour % 24, parts.minute, parts.second);
  const sec = Math.floor(utcMs / 1000) * 1000;
  return Math.round((asUtc - sec) / 60000);
}

export function browserTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
