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
    // Disable animations and transitions so entrance fades, the
    // theme-toggle slide, and the vertical-timeline intersection
    // animation can't make screenshots flaky.
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
  // Wait for every <img> to finish decoding. `loading="lazy"` images
  // (e.g. the company logo on /skills/:uuid) don't block `networkidle`,
  // so without this the screenshot captures the page before the image
  // lays out — the page reads ~600px shorter than its final height,
  // baseline mismatches CI consistently.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined)))
    );
  });
  // Lazy-loaded chunks (TenureHeatmap, TechTree, Timeline) mount after
  // their Suspense boundary resolves; give them a frame to lay out
  // before capturing.
  await page.waitForTimeout(200);
}

// /skills (the index) is intentionally NOT in this list. The
// tenure-heatmap renders ~30 SVG cells × ~10 years on a tight grid,
// and sub-pixel anti-aliasing on those cells drifts ~0.4% across
// regen environments (Apple Silicon under amd64 emulation vs GitHub
// Actions x86_64) — invisible to the eye but consistently above the
// 0.2% diff budget. This is a tool-agnostic limitation: Percy /
// Chromatic pixel-diff SVG the same way. Masking the chart would
// leave the gate covering very little of the page, so the route
// stays out. Behavioural coverage in skills.spec.ts already asserts
// the page loads and renders its content; tracked in TECH-DEBT.md
// (T11 was closed with this rationale, not "switch to Percy").
//
// /skills/:uuid + /education (the index) were previously excluded
// because of a local-Docker `useLocation()` hydration race, but
// T7's CI-side regen workflow runs Playwright in the actual CI
// container where the race doesn't fire — so both routes are gated
// again. To regenerate their baselines after an intentional UI
// change: gh workflow run regen-baselines.yml --ref <branch>.
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'education-index', path: '/education' },
  { name: 'education-detail', path: '/education/degree' },
  { name: 'skills-detail', path: '/skills/1' },
  { name: 'contact', path: '/contact' },
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
      // behavioural specs will catch it via the LinkedIn link. (No-op
      // on mobile where the QR is `display: none`.)
      const masks = [page.locator('.navbar-component__qr')];

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
