import { BlobReader, ZipReader, configure, type FileEntry } from '@zip.js/zip.js';
import { gunzipSync } from 'fflate';

/** Lo que el usuario nos da: el .zip del export o la carpeta ya descomprimida (Safari la descomprime sola). */
export type ArchiveInput =
  | { kind: 'zip'; file: File }
  | { kind: 'files'; files: { path: string; file: File }[] };

export class ArchiveError extends Error {
  constructor(
    public code: 'bad-zip' | 'no-csv' | 'encrypted' | 'read',
    message: string,
  ) {
    super(message);
  }
}

interface Item {
  size: number;
  modified: number | null;
  read(): Promise<Uint8Array>;
}

/**
 * Acceso uniforme a los ficheros del export. Con zip se lee solo el directorio central y las
 * entradas que pedimos (acceso aleatorio sobre el File): exports de varios GB sin problema.
 */
export class Archive {
  private items = new Map<string, Item>();
  private root = '';
  private zip: ZipReader<Blob> | null = null;

  static async open(input: ArchiveInput): Promise<Archive> {
    const a = new Archive();
    if (input.kind === 'zip') await a.openZip(input.file);
    else a.openFiles(input.files);
    a.detectRoot();
    return a;
  }

  private async openZip(file: File) {
    configure({ useWebWorkers: false });
    try {
      this.zip = new ZipReader(new BlobReader(file));
      const entries = await this.zip.getEntries();
      for (const e of entries) {
        if (e.directory) continue;
        const fe = e as FileEntry;
        if (fe.encrypted) throw new ArchiveError('encrypted', 'El zip está cifrado');
        this.items.set(normPath(fe.filename), {
          size: fe.uncompressedSize ?? 0,
          modified: fe.lastModDate ? fe.lastModDate.getTime() : null,
          read: async () => new Uint8Array(await fe.arrayBuffer()),
        });
      }
    } catch (err) {
      if (err instanceof ArchiveError) throw err;
      throw new ArchiveError('bad-zip', String((err as Error)?.message ?? err));
    }
  }

  private openFiles(files: { path: string; file: File }[]) {
    for (const { path, file } of files) {
      this.items.set(normPath(path || file.name), {
        size: file.size,
        modified: file.lastModified || null,
        read: async () => new Uint8Array(await file.arrayBuffer()),
      });
    }
  }

  /** El export puede venir dentro de una carpeta (export_123/...) si alguien lo re-comprime. */
  private detectRoot() {
    let best: string | null = null;
    for (const p of this.items.keys()) {
      if (p === 'activities.csv' || p.endsWith('/activities.csv')) {
        const root = p.slice(0, p.length - 'activities.csv'.length);
        if (best == null || root.length < best.length) best = root;
      }
    }
    if (best == null) throw new ArchiveError('no-csv', 'No encuentro activities.csv');
    this.root = best;
  }

  private get(rel: string): Item | undefined {
    const k = normPath(rel);
    return this.items.get(this.root + k) ?? this.items.get(k);
  }

  has(rel: string): boolean {
    return !!this.get(rel);
  }

  size(rel: string): number {
    return this.get(rel)?.size ?? 0;
  }

  modified(rel: string): number | null {
    return this.get(rel)?.modified ?? null;
  }

  /** Rutas relativas a la raíz del export. */
  list(prefix = ''): string[] {
    const out: string[] = [];
    const full = this.root + prefix.toLowerCase();
    for (const k of this.items.keys()) if (k.startsWith(full)) out.push(k.slice(this.root.length));
    return out;
  }

  async bytes(rel: string): Promise<Uint8Array> {
    const it = this.get(rel);
    if (!it) throw new ArchiveError('read', `No existe ${rel}`);
    return it.read();
  }

  async text(rel: string): Promise<string> {
    return new TextDecoder('utf-8').decode(await this.bytes(rel));
  }

  /** Bytes descomprimidos si el fichero es .gz (por contenido, no por nombre). */
  async payload(rel: string): Promise<Uint8Array> {
    let b = await this.bytes(rel);
    if (b.length > 2 && b[0] === 0x1f && b[1] === 0x8b) b = gunzipSync(b);
    return b;
  }

  async close() {
    try {
      await this.zip?.close();
    } catch {
      /* nada */
    }
  }
}

function normPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.?\//, '').toLowerCase();
}
