import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigates from home to /skills via the CV button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /CV/i }).first().click();
    await expect(page).toHaveURL(/\/skills$/);
    // /skills was reduced in stage-32: the section h2 "Work Experience"
    // was removed (the h1 + Total-years card already announce the page).
    // Assert the page title h1 instead.
    await expect(
      page.getByRole('heading', { name: 'Skills & Work Experience', level: 1 })
    ).toBeVisible();
  });

  test('navigates to /education via the Education button', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('link', { name: /Education/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/education$/);
    await expect(
      page.getByRole('heading', { name: 'Degrees', exact: true, level: 2 })
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
