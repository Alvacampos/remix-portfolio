import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    port: 8788,
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
    // RR v7 Vite plugin. Single Fetch is on by default; the v3_* future
    // flags Remix v2 needed are all default behaviour now. Non-app config
    // (ssr, prerender) lives in react-router.config.ts, not here.
    reactRouter(),
    tsconfigPaths(),
  ],
});
