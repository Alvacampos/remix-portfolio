import { expect, test } from '@playwright/test';

test.describe('Root error boundary', () => {
  test('renders a 404 panel for an unknown URL', async ({ page }) => {
    // Hit a path that's definitively not a route. Use waitUntil:
    // 'domcontentloaded' because Remix surfaces the error response
    // immediately and we don't need to wait for any further loads.
    const response = await page.goto('/this-route-does-not-exist', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(404);

    await expect(page.getByText('404', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /page not found/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });

  test('localizes the 404 panel under es', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist?lang=es', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBe(404);

    await expect(
      page.getByRole('heading', { name: /página no encontrada/i, level: 1 })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /volver al inicio/i })).toBeVisible();
  });
});
