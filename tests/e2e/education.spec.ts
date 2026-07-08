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

  test('in-progress items sort before completed ones', async ({ page }) => {
    // Degree section: the AI Bachelor is `inProgress` (endDate 2027-09);
    // the Associate Degree ended 2021. AI Bachelor must render first —
    // its card title is unique so `<h2>` text discriminates.
    const degreeH2s = await page.locator('.education-route__degree-container h2').allTextContents();
    expect(degreeH2s[0]).toMatch(/Bachelor of Science.*Artificial Intelligence/i);

    // Certifications section: CCA-F is the only `inProgress: true`
    // cert; must render first even though a newer cert (Claude 101,
    // 2026-07) sits above it in JSON authoring order. All cert `<h2>`
    // values are "Certification"/"Certificación" so we key off the
    // institution text one level deeper (texts[1] in the Card body).
    const firstCertInstitution = await page
      .locator(
        '.education-route__card-wrapper--certification-wrapper > .education-route__card-wrapper'
      )
      .first()
      .locator('p')
      .nth(1)
      .textContent();
    expect(firstCertInstitution).toMatch(/Claude Certified Architect/i);
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
    // cards. Months are now full names (e.g. "March 2024 → December 2027").
    await expect(page.getByText(/2024.*→.*2027/)).toBeVisible();
  });

  test('back link returns to /education', async ({ page }) => {
    await page.goto('/education/degree');
    await page.getByRole('link', { name: /back to education/i }).click();
    await expect(page).toHaveURL(/\/education\/?$/);
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
        name: /this education entry isn't available/i,
      })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /back to education/i })).toBeVisible();
  });
});
