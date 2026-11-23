/// <reference types="vitest/config" />
import { createReadStream, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Solo en desarrollo: sirve el export de prueba (npm run sample) en /__sample.zip. */
function sampleExport(): Plugin {
  return {
    name: 'sample-export',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__sample.zip', (_req, res) => {
        const file = resolve(import.meta.dirname, 'samples', 'export_12345678.zip');
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.end('Ejecuta primero: npm run sample');
          return;
        }
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Length', String(statSync(file).size));
        createReadStream(file).pipe(res);
      });
      // Guarda imágenes generadas en el navegador (og.png, apple-touch-icon.png) en /public.
      server.middlewares.use('/__save', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? '';
        if (req.method !== 'POST' || !/^(og|apple-touch-icon|icon-512)\.png$/.test(name)) {
          res.statusCode = 400;
          res.end('no');
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          writeFileSync(resolve(import.meta.dirname, 'public', name), Buffer.concat(chunks));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier hosting estático (raíz o subcarpeta).
  base: './',
  plugins: [sampleExport()],
  worker: { format: 'es' },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
