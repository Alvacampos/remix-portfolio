import { expect, test } from '@playwright/test';

// Verifies the PendingBoundary skeleton shows during a slow client-side
// navigation. RR v8 fires an internal single-fetch request on client
// nav (`_data` query on the destination path); we delay just that so
// the outgoing route stays visible past SKELETON_DELAY_MS and the
// skeleton renders.
test.describe('PendingBoundary skeleton', () => {
  test('renders route-scoped skeleton on slow client navigation', async ({ page }) => {
    await page.goto('/');

    // Slow every request to /skills (both the RR single-fetch `.data`
    // request and any route-lazy chunk fetch) so the SPA transition
    // sits in the 'loading' state past the 150ms show-threshold.
    await page.route(/\/skills(\.data)?(\?|$)/, async (route) => {
      await new Promise((r) => {
        setTimeout(r, 1200);
      });
      await route.continue();
    });

    // Trigger client-side nav via the NavBar Skills link (labelled "CV"
    // in the nav — see MAIN_NAV in app/components/NavBar/index.tsx).
    await page.getByRole('link', { name: /CV/i }).first().click();

    // Skeleton exists briefly and is announced to assistive tech.
    // Use `waitFor` with a short window because the skeleton starts
    // hidden (150ms delay) and disappears once the throttled loader
    // resolves.
    const skeleton = page.getByRole('status', { name: /loading page/i });
    await expect(skeleton).toBeVisible({ timeout: 2000 });
    // Skeleton has the aria-busy attribute so screen readers announce
    // "loading" not "loaded" during the transition.
    await expect(skeleton).toHaveAttribute('aria-busy', 'true');

    // Once the loader resolves, the skeleton is gone and the real page
    // renders.
    await expect(page.getByRole('heading', { name: /Skills & Work Experience/i })).toBeVisible({
      timeout: 5000,
    });
    await expect(skeleton).toHaveCount(0);
  });
});
