// Genera los datos geográficos que usa la web (se ejecuta una sola vez: `npm run geodata`).
//
//  - public/data/countries.json  -> TopoJSON de países (Natural Earth 1:50m vía world-atlas,
//                                    dominio público) con ids ISO 3166-1 alpha-2.
//  - public/data/cities.tsv      -> Ciudades de más de 15.000 habitantes (GeoNames, CC BY 4.0)
//                                    en un formato compacto: nombre, país, lat, lon, población (miles).
//
// Requiere scripts/cities15000.zip (https://download.geonames.org/export/dump/cities15000.zip).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { unzipSync, strFromU8 } from 'fflate';

const require = createRequire(import.meta.url);
const countries = require('i18n-iso-countries');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'data');
mkdirSync(outDir, { recursive: true });

// ---------- Países ----------
const world = JSON.parse(readFileSync(join(root, 'node_modules/world-atlas/countries-50m.json'), 'utf8'));
const manual = { Somaliland: 'SO', Kosovo: 'XK', 'N. Cyprus': 'CY', 'Indian Ocean Ter.': 'AU' };
let mapped = 0;
for (const g of world.objects.countries.geometries) {
  const name = g.properties?.name;
  const code = (g.id && countries.numericToAlpha2(g.id)) || manual[name] || null;
  if (code) { g.id = code; mapped++; } else { delete g.id; }
  g.properties = { n: name };
}
delete world.objects.land;
writeFileSync(join(outDir, 'countries.json'), JSON.stringify(world));
console.log(`countries.json: ${mapped}/${world.objects.countries.geometries.length} países con código`);

// ---------- Ciudades ----------
const zipPath = join(root, 'scripts', 'cities15000.zip');
if (!existsSync(zipPath)) {
  console.warn('Falta scripts/cities15000.zip; no se regenera cities.tsv');
} else {
  const files = unzipSync(readFileSync(zipPath));
  const txt = strFromU8(files['cities15000.txt']);
  const rows = [];
  for (const line of txt.split('\n')) {
    if (!line) continue;
    const c = line.split('\t');
    const name = c[1].trim();
    const lat = Number(c[4]);
    const lon = Number(c[5]);
    const fcode = c[7];
    const cc = c[8];
    const pop = Number(c[14]) || 0;
    if (!name || !cc || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    // Barrios/secciones de ciudad (PPLX) generan ruido: "Centro", "Retiro"... fuera.
    if (fcode === 'PPLX' || fcode === 'PPLH' || fcode === 'PPLQ' || fcode === 'PPLW') continue;
    rows.push({ name, cc, lat, lon, pop, cap: fcode === 'PPLC' });
  }
  rows.sort((a, b) => b.pop - a.pop);
  const out = rows
    .map((r) => [r.name.replace(/\t/g, ' '), r.cc, r.lat.toFixed(2), r.lon.toFixed(2), Math.round(r.pop / 1000)].join('\t'))
    .join('\n');
  writeFileSync(join(outDir, 'cities.tsv'), out);
  console.log(`cities.tsv: ${rows.length} ciudades, ${(out.length / 1024).toFixed(0)} KB`);
}
