import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Visual-regression suite. Baselines live next to this spec at
// tests/e2e/visual.spec.ts-snapshots/<name>-<project>-<platform>.png.
//
// Baselines are committed for `linux` only (Playwright's official Docker
// image, matching CI's ubuntu-latest runners). On macOS the suite runs but
// skips the assertion — see SKIP_VISUAL below — so local `npm run test:e2e`
// stays green without committing platform-specific PNGs. To regenerate
// baselines, use:
//
//   npm run test:visual:update
//
// which spins up the Playwright Docker image to produce linux baselines
// regardless of host OS. See tests/e2e/README.md for details.

const SKIP_VISUAL = process.platform !== 'linux' && !process.env.UPDATE_VISUAL;

// Pin the clock to a fixed instant. `formatDate(start, undefined)` and the
// /skills bar chart both call `new Date()` for ongoing items; without
// freezing, the "X years Y months" total and the bars for skills attached
// to "Present" jobs drift every day.
const FIXED_NOW = new Date('2026-06-18T12:00:00.000Z');

async function prepare(page: Page) {
  await page.clock.install({ time: FIXED_NOW });
  await page.addInitScript(() => {
    // Disable animations and transitions so entrance fades, recharts
    // tweens, the carousel auto-scroll, and the Front End / Back End
    // button neon-loops can't make screenshots flaky.
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `;
    document.documentElement.appendChild(style);
  });
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  // Recharts mounts after Suspense boundary resolves; give it a frame
  // to lay out before capturing.
  await page.waitForTimeout(200);
}

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'skills-index', path: '/skills' },
  { name: 'skills-detail', path: '/skills/1' }, // Globant — first WORK_ITEM
  { name: 'education-index', path: '/education' },
  { name: 'education-detail', path: '/education/degree' },
];

test.describe('Visual regression', () => {
  test.skip(SKIP_VISUAL, 'baselines are linux-only; run via Docker to update');

  test.beforeEach(async ({ page }) => {
    await prepare(page);
  });

  for (const { name, path } of ROUTES) {
    test(`${name} matches baseline`, async ({ page }) => {
      await page.goto(path);
      await settle(page);

      // The carousel auto-scrolls and recharts decorations have minor
      // sub-pixel jitter; mask both. The bar-chart container itself
      // (bars + axis text) is left visible — that's the part we want
      // to gate on.
      const masks = [page.locator('.carousel-component')];

      await expect(page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        mask: masks,
        // Allow tiny anti-aliasing differences between the local Docker
        // run that generates baselines and the GitHub Actions run that
        // checks them. 0.2% of pixels is the standard "barely
        // perceptible" tolerance.
        maxDiffPixelRatio: 0.002,
      });
    });
  }
});
