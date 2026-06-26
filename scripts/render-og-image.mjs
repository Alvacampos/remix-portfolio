// Batch-render every SVG in scripts/og/ to public/assets/img/og-<name>.png
// at exactly 1200x630, using Playwright's bundled chromium so we don't
// need a separate SVG-to-PNG tool installed.
//
// Run with `npm run build:og`. Re-run after editing any scripts/og/*.svg.
// Outputs are committed under public/assets/img/og-*.png.
//
// Routes map their OG image via mergeRouteMeta's `ogImage` override
// — see app/utils/utils.tsx. Detail routes inherit their parent's
// OG (no per-item template):
//
//   /                  → og-home.png
//   /skills            → og-skills.png
//   /skills/:uuid      → og-skills.png
//   /education         → og-education.png
//   /education/:slug   → og-education.png
//   /projects          → og-projects.png
//   /projects/<slug>   → og-projects.png

import { chromium } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const svgDir = resolve('scripts/og');
const outDir = resolve('public/assets/img');

const svgFiles = readdirSync(svgDir).filter((f) => f.endsWith('.svg'));
if (svgFiles.length === 0) {
  console.error('No SVGs found in scripts/og/');
  process.exit(1);
}

const browser = await chromium.launch();
try {
  for (const file of svgFiles) {
    const name = file.replace(/\.svg$/, '');
    const svgPath = resolve(svgDir, file);
    const outPath = resolve(outDir, `og-${name}.png`);
    const svg = readFileSync(svgPath, 'utf-8');

    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(
      `<!doctype html>
      <html><head><style>
        html, body { margin: 0; padding: 0; background: #010408; }
        svg { display: block; }
      </style></head>
      <body>${svg}</body></html>`,
      { waitUntil: 'networkidle' }
    );
    // `document` here is the browser context inside page.waitForFunction —
    // not the Node script's globals. ESLint's no-undef can't know that.
    // eslint-disable-next-line no-undef
    await page.waitForFunction(() => document.fonts.ready);
    await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
    await page.close();
    console.log(`  ${outPath.replace(`${process.cwd()}/`, '')}`);
  }
} finally {
  await browser.close();
}
console.log(`Rendered ${svgFiles.length} OG images.`);
