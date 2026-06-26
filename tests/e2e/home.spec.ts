import { expect, test } from '@playwright/test';

test.describe('Home (/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the welcome heading, role, and tagline', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Welcome, my name is Gonzalo Alvarez Campos/i })
    ).toBeVisible();
    await expect(page.getByText(/Senior Frontend \/ Full-stack Engineer/i)).toBeVisible();
    await expect(page.getByText(/Building thoughtful web experiences/i)).toBeVisible();
  });

  test('surfaces years-of-experience and current-employer chips', async ({ page }) => {
    await expect(page.getByText(/\d+\+ years/)).toBeVisible();
    await expect(page.getByText(/Currently at Qubika/i)).toBeVisible();
  });

  test('links to the GitHub repo', async ({ page }) => {
    const repoLink = page.getByRole('link', { name: /repo on GitHub/i });
    await expect(repoLink).toHaveAttribute('href', 'https://github.com/Alvacampos/remix-portfolio');
    await expect(repoLink).toHaveAttribute('target', '_blank');
  });

  test('exposes the CV download button', async ({ page }) => {
    const download = page.getByRole('link', { name: /Download my CV/i });
    await expect(download).toHaveAttribute('href', '/assets/files/gonzalo_alvarez_campos_cv.pdf');
    await expect(download).toHaveAttribute('download', 'Gonzalo_Alvarez_CV.pdf');
  });

  test('links to /skills via the secondary CTA', async ({ page }) => {
    const cta = page.getByRole('link', { name: /View work experience/i });
    await expect(cta).toHaveAttribute('href', '/skills');
  });
});
