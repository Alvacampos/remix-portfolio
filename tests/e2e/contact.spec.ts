import { expect, test } from '@playwright/test';

test.describe('Contact (/contact)', () => {
  test('renders the page title, lead copy, and form fields', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /get in touch/i, level: 1 })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/subject/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send message/i })).toBeVisible();
  });

  test('renders the localized title under es', async ({ page }) => {
    await page.goto('/contact?lang=es');
    await expect(page.getByRole('heading', { name: /hablemos/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /enviar mensaje/i })).toBeVisible();
  });

  test('honeypot is rendered but visually hidden', async ({ page }) => {
    await page.goto('/contact');
    // The honeypot is in the DOM (so bots that read it can fill it) but
    // off-screen so real users never see or tab into it.
    const honeypot = page.locator('input[name="website"]');
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    await expect(honeypot).toHaveAttribute('aria-hidden', 'true');
    await expect(honeypot).not.toBeInViewport();
  });
});
