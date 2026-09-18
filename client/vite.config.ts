/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  root: __dirname,
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

  plugins: [react(), tsconfigPaths()],

  build: {
    outDir: './dist/client',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        imports: path.resolve(__dirname, 'react-assets.html'),
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
