/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: import.meta.dirname,
  base: '/static/react-assets',
  cacheDir: './node_modules/.vite/.',

  server: {
    port: 4200,
    origin: 'designsafe.dev',
    cors: {
      origin: ['https://designsafe.dev'],
    },
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [react()],

  resolve: {
    tsconfigPaths: true,
  },

  build: {
    outDir: './dist/client',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        imports: path.resolve(import.meta.dirname, 'react-assets.html'),
      },
    },
  },

  test: {
    globals: true,
    setupFiles: ['./src/vitest.setup.ts'],
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'modules/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    reporters: ['default'],
    coverage: {
      reportsDirectory: './coverage/client',
      provider: 'v8',
    },
  },
});
