import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigates from home to /skills via the CV button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /CV/i }).first().click();
    await expect(page).toHaveURL(/\/skills$/);
    await expect(page.getByRole('heading', { name: /Work Experience/i })).toBeVisible();
  });

  test('navigates to /education via the Education button', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('link', { name: /Education/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/education$/);
    // exact match: card titles on /education also contain "Degree", so a
    // /Degree/i regex would match more than the section heading.
    await expect(
      page.getByRole('heading', { name: 'Degree', exact: true, level: 2 })
    ).toBeVisible();
  });

  test('exposes external links to GitHub and LinkedIn', async ({ page }) => {
    await page.goto('/');
    const github = page.getByRole('link', { name: 'Github' }).first();
    const linkedin = page.getByRole('link', { name: 'Linkedin' }).first();
    await expect(github).toHaveAttribute('href', 'https://github.com/Alvacampos');
    await expect(linkedin).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/gonzaloalvarezcampos/'
    );
  });
});
