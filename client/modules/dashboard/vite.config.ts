import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/modules/dashboard',

  plugins: [react()],

  test: {
    deps: {
      optimizer: {
        // Ant Design X uses extensionless antd/es imports that need Vite's resolver.
        client: {
          enabled: true,
          include: ['antd', '@ant-design/x'],
        },
      },
    },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/modules/dashboard',
      provider: 'v8',
    },
  },
});
