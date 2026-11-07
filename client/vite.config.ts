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
      output: {
        codeSplitting: {
          groups: [
            {
              // Split only third-party code: grouping application modules would
              // collapse the independently loaded roots back together.
              name: 'vendor',
              test: /node_modules[\\/]/,
              // Keep packages separated by the app roots that consume them so,
              // for example, Leaflet is never fetched by an onboarding page.
              entriesAware: true,
              entriesAwareMergeThreshold: 100_000,
              // Rolldown measures source bytes here. These limits currently
              // produce 40-450 kB minified chunks with no size warnings.
              minSize: 100_000,
              maxSize: 1_250_000,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
  },

  test: {
    deps: {
      optimizer: {
        client: {
          enabled: true,
          // Match dashboard's test config for Ant Design X's antd/es imports.
          include: ['antd', '@ant-design/x'],
        },
      },
    },
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
