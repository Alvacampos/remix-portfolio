import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8788,
  },
  resolve: {
    // Vite 8 resolves tsconfig `paths` (`~/*` → `./app/*`, etc.)
    // natively — no plugin needed. Vitest already uses the same flag
    // (see vitest.config.ts).
    tsconfigPaths: true,
  },
  build: {
    // No sourcemaps in production — they leak source paths and add MB to
    // the deploy. Stack traces in browser tools still show minified names,
    // which is fine for a personal site.
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  plugins: [
    // Non-app config (ssr, prerender) lives in react-router.config.ts,
    // not here.
    reactRouter(),
  ],
});
