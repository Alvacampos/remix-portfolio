// One-shot script: render scripts/og-image.svg to public/assets/img/og.png
// at exactly 1200x630, using Playwright's bundled chromium so we don't
// need a separate SVG-to-PNG tool installed.
//
// Run with `node scripts/render-og-image.mjs`. Re-run only when og-image.svg
// changes. The output PNG is committed under public/assets/img/og.png.

import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const svgPath = resolve('scripts/og-image.svg');
const outPath = resolve('public/assets/img/og.png');
const svg = readFileSync(svgPath, 'utf-8');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

// Wrap the SVG in a minimal HTML so the browser renders it at the
// viewport's exact dimensions with no body margin.
await page.setContent(
  `<!doctype html>
  <html><head><style>
    html, body { margin: 0; padding: 0; background: #010408; }
    svg { display: block; }
  </style></head>
  <body>${svg}</body></html>`,
  { waitUntil: 'networkidle' }
);

await page.waitForFunction(() => document.fonts.ready);
await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
await browser.close();
console.log(`Wrote ${outPath}`);
