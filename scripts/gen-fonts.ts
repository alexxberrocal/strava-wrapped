// Genera src/styles/fonts/*.css: la tipografía de titulares para cirílico (Oswald 700) y para
// chino, japonés y coreano (Noto Sans 900), con un alias propio ("MRY Display …") declarado con
// peso 400 para que el canvas y la web las pidan igual que a Anton (sin negrita sintética).
// Solo woff2 y cada trozo con su unicode-range: el navegador baja únicamente los trozos con las
// letras que de verdad aparecen. Uso: npx tsx scripts/gen-fonts.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, 'src/styles/fonts');
mkdirSync(outDir, { recursive: true });

export const FONT_SETS = [
  { file: 'cyr', family: 'MRY Display Cyr', pkg: 'oswald', css: '700.css' },
  { file: 'sc', family: 'MRY Display SC', pkg: 'noto-sans-sc', css: '900.css' },
  { file: 'ja', family: 'MRY Display JP', pkg: 'noto-sans-jp', css: '900.css' },
  { file: 'ko', family: 'MRY Display KR', pkg: 'noto-sans-kr', css: '900.css' },
] as const;

for (const s of FONT_SETS) {
  const src = readFileSync(join(root, 'node_modules/@fontsource', s.pkg, s.css), 'utf8');
  const blocks = src.match(/@font-face\s*\{[^}]*\}/g) ?? [];
  const faces = blocks.map((b) => {
    const woff2 = b.match(/url\(\.\/files\/([^)]+\.woff2)\)/)?.[1];
    const range = b.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim();
    if (!woff2) throw new Error(`${s.pkg}: @font-face sin woff2`);
    return (
      `@font-face{font-family:'${s.family}';font-style:normal;font-display:swap;font-weight:400;` +
      `src:url(../../../node_modules/@fontsource/${s.pkg}/files/${woff2}) format('woff2');` +
      (range ? `unicode-range:${range};` : '') +
      '}'
    );
  });
  if (!faces.length) throw new Error(`${s.pkg}: no hay @font-face`);
  const head = `/* Generado por scripts/gen-fonts.ts (@fontsource/${s.pkg}/${s.css} → '${s.family}'). No editar a mano. */\n`;
  writeFileSync(join(outDir, `${s.file}.css`), head + faces.join('\n') + '\n');
  console.log(`${s.file}.css: ${faces.length} trozos`);
}
