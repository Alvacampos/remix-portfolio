import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vitest 4 uses oxc for transforms (was esbuild in v3) and applies the
  // automatic JSX runtime by default — SVGR-generated icon components
  // (app/components/icons/*.jsx) don't import React explicitly and rely
  // on this. No `esbuild.jsx` override needed.
  resolve: {
    // Vitest 4 / Vite 6 ship native tsconfig path resolution, replacing
    // the `vite-tsconfig-paths` plugin we used under Vitest 3.
    tsconfigPaths: true,
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'build', '.wrangler', 'tests/e2e/**'],
  },
});
