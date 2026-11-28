import '@fontsource/anton/400.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/archivo/800.css';
import { SCRIPT, type Lang, type Script } from '../i18n/langs';
import { cardMessagesText, loadCardMessages } from '../i18n/format';
import type { Card, CardPainter } from './card';

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

// ---------------- Titulares en cirílico, chino, japonés y coreano ----------------
// Anton solo tiene alfabeto latino. Para el resto hay un alias "MRY Display …" (generado con
// scripts/gen-fonts.ts) que se descarga solo si hace falta y, dentro de él, solo los trozos
// (unicode-range) con las letras que aparecen.

type OtherScript = Exclude<Script, 'latin'>;

export const DISPLAY_ALIAS: Record<OtherScript, string> = {
  cyrillic: 'MRY Display Cyr',
  sc: 'MRY Display SC',
  ja: 'MRY Display JP',
  ko: 'MRY Display KR',
};

const SCRIPT_CSS: Record<OtherScript, () => Promise<unknown>> = {
  cyrillic: () => import('../styles/fonts/cyr.css'),
  sc: () => import('../styles/fonts/sc.css'),
  ja: () => import('../styles/fonts/ja.css'),
  ko: () => import('../styles/fonts/ko.css'),
};
const cssLoads = new Map<OtherScript, Promise<unknown>>();

function loadScriptCss(s: OtherScript): Promise<unknown> {
  let p = cssLoads.get(s);
  if (!p) {
    p = SCRIPT_CSS[s]().catch(() => cssLoads.delete(s));
    cssLoads.set(s, p);
  }
  return p;
}

/** Escrituras no latinas que aparecen en un texto (los ideogramas, según el idioma). */
export function scriptsIn(text: string, lang: Lang): Set<OtherScript> {
  const out = new Set<OtherScript>();
  if (/[Ѐ-ӿԀ-ԯ]/.test(text)) out.add('cyrillic');
  if (/[ᄀ-ᇿ㄰-㆏가-힯]/.test(text)) out.add('ko');
  if (/[぀-ヿㇰ-ㇿ]/.test(text)) out.add('ja');
  if (/[㐀-䶿一-鿿豈-﫿]/.test(text)) {
    const s = SCRIPT[lang];
    out.add(s === 'ja' || s === 'ko' ? s : 'sc');
  }
  return out;
}

/** Tipografías de titulares para las escrituras del texto (y siempre la del idioma). */
export async function ensureScriptFonts(text: string, lang: Lang): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const scripts = scriptsIn(text, lang);
  const own = SCRIPT[lang];
  if (own !== 'latin') scripts.add(own);
  await Promise.all(
    [...scripts].map(async (s) => {
      await loadScriptCss(s);
      await document.fonts.load(`400 100px "${DISPLAY_ALIAS[s]}"`, text || 'А').catch(() => undefined);
    }),
  );
}

/** Todo lo que necesitan las tarjetas de un idioma antes del primer dibujo: textos y tipografías. */
export async function ensureCardAssets(lang: Lang, sample = ''): Promise<void> {
  await Promise.all([loadCardMessages(lang), ensureFonts(sample)]);
  await ensureScriptFonts(`${cardMessagesText(lang)} ${sample}`, lang);
}

/**
 * Antes de enseñar una baraja en otra escritura: la dibuja en miniatura (con un pintor aparte,
 * para no cachear medidas con la letra de respaldo), apunta cada texto y descarga los trozos de
 * tipografía de esas letras (ciudades, países, nombres de actividades…).
 */
export async function preloadDeckText(painter: CardPainter, cards: Card[], lang: Lang, extra = ''): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  if (SCRIPT[lang] === 'latin' && !scriptsIn(extra, lang).size) return;
  const seen: string[] = [extra];
  const canvas = document.createElement('canvas');
  canvas.width = 108;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const record = (text: string) => {
    seen.push(String(text));
  };
  Object.assign(ctx, { fillText: record, strokeText: record });
  const probe = painter.clone();
  for (const card of cards) {
    try {
      probe.paint(ctx, card, 60_000, 0.1, { still: true });
    } catch {
      /* el dibujo de verdad avisará */
    }
  }
  await ensureScriptFonts(seen.join(' '), lang);
}
