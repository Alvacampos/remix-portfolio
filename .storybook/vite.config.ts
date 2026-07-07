// Vite config used exclusively by Storybook. The project's root vite.config.ts
// wires up the @react-router/dev plugin, which only works inside RR's own
// dev/build pipeline — Storybook needs a clean Vite config without it.
//
// PostCSS auto-discovers postcss.config.js from the project root, so design
// tokens (postcss-simple-vars), nesting, and Tailwind all keep working in
// stories without needing to be repeated here.
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // Vite 8's native tsconfig-paths resolver — same setting as
    // vite.config.ts. `~/*` and `~data/*` still resolve inside stories.
    tsconfigPaths: true,
  },
  // SVGR-generated icon components (app/components/icons/*.jsx) don't import
  // React explicitly — make sure esbuild applies the automatic JSX runtime,
  // same trick as vitest.config.ts. Without this, Storybook falls back to
  // the classic runtime and every icon throws "React is not defined".
  esbuild: {
    jsx: 'automatic',
  },
});
