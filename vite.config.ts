/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el build funciona en cualquier hosting estático (raíz o subcarpeta).
  base: './',
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
