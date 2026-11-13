import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/modules/onboarding',

  plugins: [react()],

  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    setupFiles: ['./src/vitest.setup.ts'],
    coverage: {
      reportsDirectory: '../../coverage/modules/onboarding',
      provider: 'v8',
    },
  },
});
