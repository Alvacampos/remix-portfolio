import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  // SVGR-generated icon components (app/components/icons/*.jsx) don't import
  // React explicitly — make sure esbuild applies the automatic JSX runtime.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'build', '.wrangler', 'tests/e2e/**'],
  },
});
