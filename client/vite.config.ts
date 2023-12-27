/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import fs from 'fs';

export default defineConfig({
    root: __dirname,
    cacheDir: './node_modules/.vite/.',

    server: {
        port: 4200,
        host: 'designsafe.dev',
        https: {
            key: fs.readFileSync('../conf/nginx/certificates/designsafe.dev.key'),
            cert: fs.readFileSync('../conf/nginx/certificates/designsafe.dev.crt')
          },
    },

    preview: {
        port: 4300,
        host: 'localhost',
    },

    plugins: [react(), nxViteTsPaths()],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    build: {
        outDir: './dist/client',
        reportCompressedSize: true,
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },

    test: {
        globals: true,
        cache: {
            dir: './node_modules/.vitest',
        },
        environment: 'jsdom',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

        reporters: ['default'],
        coverage: {
            reportsDirectory: './coverage/client',
            provider: 'v8',
        },
    },
});
