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

  // Regression guard: PR #266 fixed a bug where the RR v8 migration
  // broke the /contact action end-to-end. The route bundle and the
  // wrangler-built worker bundle each had their own `createContext()`
  // call, so `context.set(cloudflareContext, …)` in the worker never
  // matched `.get(cloudflareContext)` in the action → 500 in prod.
  //
  // We can't easily fire a full form-submit E2E here — Playwright's
  // `page.route()` intercepts BROWSER requests, but Resend is fetched
  // from the Worker's server-side runtime, out of Playwright's reach.
  // Instead we test the load-context handoff via the mechanism unit
  // test at [app/utils/load-context.test.ts](app/utils/load-context.test.ts).
  // On top of that unit coverage, submit the form so we catch a form-
  // level regression (validation, honeypot ordering, origin check).
  // Assert on the `send-failed` copy because Resend intentionally
  // returns a real 401 for our dev-stub API key — we're validating
  // the action reached the send code path, not that the email lands.
  test('submits the form and reaches the Resend send path', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/subject/i).fill('E2E regression test');
    await page.getByLabel(/message/i).fill('This is a test submission from the E2E suite.');
    await page.getByRole('button', { name: /send message/i }).click();
    // Either success or send-failed proves the action ran past
    // validation + origin + honeypot + rate-limit and into the
    // Resend fetch. A regression of the load-context handoff surfaces
    // as a 500 with the RR error boundary — that's what we're
    // guarding against.
    await expect(page.getByText(/message sent|something went wrong sending/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
