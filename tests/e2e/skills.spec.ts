import { expect, test } from '@playwright/test';

test.describe('Skills (/skills)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills');
  });

  test('renders work experience timeline and total years card', async ({ page }) => {
    // /skills page title — the section <h2> "Work Experience" was
    // removed since the h1 + Total-years card already announce the
    // page.
    await expect(
      page.getByRole('heading', { name: 'Skills & Work Experience', level: 1 })
    ).toBeVisible();
    // Qubika (most recent role) is the topmost timeline entry post-Stage-24
    // reversal — assert against it instead of Globant so the assertion
    // doesn't depend on the IntersectionObserver having fired for off-screen
    // entries (the react-vertical-timeline-component only mounts entries
    // that have intersected the viewport).
    await expect(
      page
        .getByRole('link')
        .filter({ hasText: /Qubika/i })
        .first()
    ).toBeVisible();
    await expect(page.getByText(/Total years of experience/i)).toBeVisible();
  });

  test('autocomplete filters timeline entries', async ({ page }) => {
    const input = page.getByPlaceholder(/Filter by a specific technology/i);
    await input.fill('Vue');
    // After filter, Globant (which lists Vue) is still present
    await expect(
      page
        .getByRole('link')
        .filter({ hasText: /Globant/i })
        .first()
    ).toBeVisible();
  });

  test('renders the Skills section and tenure heatmap', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^Skills$/ })).toBeVisible();
    // Heatmap container.
    await expect(page.locator('.tenure-heatmap').first()).toBeVisible();
    // The heatmap is derived from WORK_ITEMS — read its row-header
    // skill labels and assert core technologies are present and
    // CHART_EXCLUDE filter-chips are not.
    const skillLabels = page.locator('.tenure-heatmap__skill[role="rowheader"]');
    await expect(skillLabels.first()).toBeVisible();
    const labelTexts = (await skillLabels.allTextContents()).map((t) => t.trim());
    expect(labelTexts).toContain('React');
    expect(labelTexts).toContain('TypeScript');
    expect(labelTexts).not.toContain('Front End');
    expect(labelTexts).not.toContain('Back End');
    expect(labelTexts).not.toContain('Agile');
  });

  test('renders the Extra Activities section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Extra Activities/i })).toBeVisible();
  });
});

test.describe('Skill detail (/skills/:uuid)', () => {
  test('navigates from timeline card to detail page', async ({ page }) => {
    await page.goto('/skills');
    // Qubika is the topmost timeline card (most recent role) — using
    // it instead of an older entry avoids the IntersectionObserver-
    // based lazy mount issue (see timeline-render test for the long
    // version).
    await page
      .getByRole('link')
      .filter({ hasText: /Qubika/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/skills\/\d+/);
    await expect(page.getByRole('heading', { name: /Qubika/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/Hire Date/i)).toBeVisible();
    await expect(page.getByText(/Role \/ Job Description/i)).toBeVisible();
  });
});
