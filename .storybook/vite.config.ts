// Vite config used exclusively by Storybook. The project's root vite.config.ts
// wires up the @remix-run/dev plugin, which only works inside Remix's own
// dev/build pipeline — Storybook needs a clean Vite config without it.
//
// PostCSS auto-discovers postcss.config.js from the project root, so design
// tokens (postcss-simple-vars), nesting, and Tailwind all keep working in
// stories without needing to be repeated here.
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  // SVGR-generated icon components (app/components/icons/*.jsx) don't import
  // React explicitly — make sure esbuild applies the automatic JSX runtime,
  // same trick as vitest.config.ts. Without this, Storybook falls back to
  // the classic runtime and every icon throws "React is not defined".
  esbuild: {
    jsx: 'automatic',
  },
});
