import { expect, test } from '@playwright/test';

test.describe('Education (/education)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/education');
  });

  test('shows the degree section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Degree/i, level: 2 })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /Software Development and Quality Control Technician/i,
      })
    ).toBeVisible();
  });

  test('shows certifications with their institutions', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Certification/i, level: 2 }).first()
    ).toBeVisible();
    await expect(page.getByText(/University of Cambridge/i)).toBeVisible();
    await expect(page.getByText(/EF SET English/i)).toBeVisible();
  });

  test('certification links point at credential URLs', async ({ page }) => {
    const certLinks = page.getByRole('link', { name: /Certification Link/i });
    await expect(certLinks.first()).toBeVisible();
  });
});
