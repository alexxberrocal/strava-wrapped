import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function fixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8').replace(/\r?\n$/, '');
}

/** Construye una fila CSV (con comillas cuando hace falta). */
export function csvRow(values: (string | number)[]): string {
  return values
    .map((v) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}

/** Fila de N columnas vacías con valores en posiciones concretas. */
export function rowAt(n: number, values: Record<number, string | number>): string {
  const arr: (string | number)[] = new Array(n).fill('');
  for (const [k, v] of Object.entries(values)) arr[Number(k)] = v;
  return csvRow(arr);
}

/**
 * Escritor FIT mínimo para tests de casos raros que el SDK oficial no genera:
 * arquitectura big-endian y cabeceras de timestamp comprimido.
 */
export function handmadeFit(opts: { bigEndian: boolean; compressed: boolean; points: { ts: number; lat: number; lon: number; hr: number }[] }): Uint8Array {
  const bytes: number[] = [];
  const le = !opts.bigEndian;
  const u16 = (v: number) => (le ? [v & 0xff, (v >> 8) & 0xff] : [(v >> 8) & 0xff, v & 0xff]);
  const u32 = (v: number) => {
    const b = [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
    return le ? b : b.reverse();
  };
  const s32 = (v: number) => u32(v >>> 0);
  const semi = (deg: number) => Math.round((deg * 2147483648) / 180);
  const FIT_EPOCH = 631065600;

  // Definición local 0: record con timestamp(253, uint32), lat(0, sint32), lon(1, sint32), hr(3, uint8)
  bytes.push(0x40, 0, le ? 0 : 1, ...u16(20), 4, 253, 4, 0x86, 0, 4, 0x85, 1, 4, 0x85, 3, 1, 0x02);
  // Definición local 1: record SIN timestamp (para cabeceras comprimidas)
  bytes.push(0x41, 0, le ? 0 : 1, ...u16(20), 3, 0, 4, 0x85, 1, 4, 0x85, 3, 1, 0x02);
  opts.points.forEach((p, i) => {
    const ts = p.ts - FIT_EPOCH;
    if (opts.compressed && i > 0) {
      bytes.push(0x80 | (1 << 5) | (ts & 0x1f), ...s32(semi(p.lat)), ...s32(semi(p.lon)), p.hr);
    } else {
      bytes.push(0x00, ...u32(ts), ...s32(semi(p.lat)), ...s32(semi(p.lon)), p.hr);
    }
  });
  const dataSize = bytes.length;
  const header = [14, 0x20, 0x08, 0x08, dataSize & 0xff, (dataSize >> 8) & 0xff, (dataSize >> 16) & 0xff, (dataSize >>> 24) & 0xff, 0x2e, 0x46, 0x49, 0x54, 0, 0];
  return new Uint8Array([...header, ...bytes, 0, 0]);
}
