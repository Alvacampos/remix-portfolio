import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
    include: ['app/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'build', '.wrangler', 'tests/e2e/**'],
  },
});
