import '@fontsource/anton/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo/800.css';

let ready: Promise<void> | null = null;

/** Carga las tipografías antes de dibujar en canvas (el canvas no espera a las fuentes). */
export function ensureFonts(sample = ''): Promise<void> {
  const text = `ÁÉÍÓÚÑÜ0123456789 ${sample}`;
  const load = () =>
    Promise.all([
      document.fonts.load('400 100px Anton', text),
      document.fonts.load('500 40px Archivo', text),
      document.fonts.load('600 40px Archivo', text),
      document.fonts.load('700 40px Archivo', text),
      document.fonts.load('800 40px Archivo', text),
    ]).then(() => undefined);
  if (sample) return load();
  if (!ready) ready = load().catch(() => undefined);
  return ready;
}
