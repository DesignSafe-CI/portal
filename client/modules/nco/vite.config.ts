import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/modules/nco',

  plugins: [react()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  test: {
    deps: {
      optimizer: {
        web: {
          enabled: true,
          // Ant Design X imports antd/es internals that need Vite's resolver.
          include: ['antd', '@ant-design/x'],
        },
      },
    },
    globals: true,
    cache: { dir: '../../node_modules/.vitest' },
    passWithNoTests: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/modules/nco',
      provider: 'v8',
    },
  },
});
