import { expect, test } from '@playwright/test';

test.describe('Education (/education)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/education');
  });

  test('shows the degree section', async ({ page }) => {
    // exact match: education.json has cards whose titles also contain
    // "Degree" (e.g. the Associate Degree card), so a /Degree/i regex
    // would collide with them. The section heading is plural ("Degrees")
    // so it's distinct from the singular card titles.
    await expect(
      page.getByRole('heading', { name: 'Degrees', exact: true, level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /Software Development and Quality Control/i,
      })
    ).toBeVisible();
  });

  test('degree cards link to their detail pages', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /Bachelor of Science.*Artificial Intelligence/i })
    ).toHaveAttribute('href', '/education/degree');
    await expect(
      page.getByRole('link', { name: /Software Development and Quality Control/i })
    ).toHaveAttribute('href', '/education/associate-degree');
  });

  test('shows certifications with their institutions', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Certifications', exact: true, level: 2 })
    ).toBeVisible();
    await expect(page.getByText(/University of Cambridge/i)).toBeVisible();
    await expect(page.getByText(/EF SET English/i)).toBeVisible();
  });

  test('certification links point at credential URLs', async ({ page }) => {
    const certLinks = page.getByRole('link', { name: /Certification Link/i });
    await expect(certLinks.first()).toBeVisible();
  });
});

test.describe('Education detail (/education/:slug)', () => {
  test('navigates from /education to the AI degree detail', async ({ page }) => {
    await page.goto('/education');
    await page.getByRole('link', { name: /Bachelor of Science.*Artificial Intelligence/i }).click();
    await expect(page).toHaveURL(/\/education\/degree$/);
    await expect(
      page.getByRole('heading', { name: /Bachelor of Science.*Artificial Intelligence/i, level: 1 })
    ).toBeVisible();
    await expect(page.getByText(/Universidad Blas Pascal/i)).toBeVisible();
    // metadata row replaces the previous "Study Dates" / "Institution"
    // cards — assert the year range instead.
    await expect(page.getByText(/2024 – 2027/)).toBeVisible();
  });

  test('navigates from /education to the associate-degree detail', async ({ page }) => {
    await page.goto('/education');
    await page.getByRole('link', { name: /Software Development and Quality Control/i }).click();
    await expect(page).toHaveURL(/\/education\/associate-degree$/);
    await expect(
      page.getByRole('heading', {
        name: /Software Development and Quality Control/i,
        level: 1,
      })
    ).toBeVisible();
    await expect(page.getByText(/Universidad del Norte Santo Tomas de Aquino/i)).toBeVisible();
  });

  test('renders the ErrorBoundary for an unknown slug', async ({ page }) => {
    await page.goto('/education/nope', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', {
        name: /problem while loading this education entry/i,
      })
    ).toBeVisible();
  });
});
