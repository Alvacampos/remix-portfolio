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

// /skills (the index route) is intentionally not in this list. Recharts
// emits SVG <text> for axis labels and the inline QR <svg> in the nav
// hits the same anti-aliasing pipeline; sub-pixel font hinting drifts
// ~0.4% of pixels between the local Docker regen environment and CI's
// runner — invisible to the eye but consistently above the 0.2% diff
// budget. Trying to mask both the chart and the QR leaves the route
// gating very little, so it earns its keep less than the simpler routes.
// The other 4 routes have no recharts and only stable DOM-rendered text.
const ROUTES = [
  { name: 'home', path: '/' },
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

      // The QR <svg> in the nav is rendered with embedded font data and
      // drifts on sub-pixel anti-aliasing across environments; mask it
      // even though it's stable in content. Worth keeping in the suite
      // for now — if a future regression is the QR breaking, the
      // behavioural specs will catch it via the LinkedIn link.
      const masks = [page.locator('.nav-bar-component__qr')];

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
