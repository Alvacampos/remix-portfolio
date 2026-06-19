import { expect, test } from '@playwright/test';

test.describe('Skills (/skills)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills');
  });

  test('renders work experience timeline and total years card', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Work Experience', exact: true, level: 2 })
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

  test('renders the Technologies section and bar chart', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Technologies/i })).toBeVisible();
    // Bar chart container
    await expect(page.locator('.bar-chart-component').first()).toBeVisible();
    // Chart is derived from WORK_ITEMS — read y-axis labels and assert that
    // core technologies are present and excluded filter-chips are not.
    // recharts 3.8+ renders tick labels under `.recharts-yAxis-tick-labels`
    // (was bare `<text>` children of `.recharts-yAxis` in older versions).
    const chartLabels = page.locator('.bar-chart-component .recharts-yAxis-tick-labels text');
    await expect(chartLabels.first()).toBeVisible();
    const labelTexts = (await chartLabels.allTextContents()).map((t) => t.trim());
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
    // Qubika (most recent) is the topmost timeline card after Stage 24's
    // reversal — using it instead of Globant avoids the
    // IntersectionObserver-based lazy mount issue (see timeline-render
    // test for the long version).
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
