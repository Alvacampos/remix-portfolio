import { expect, test } from '@playwright/test';

test.describe('Skills (/skills)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/skills');
  });

  test('renders work experience timeline and total years card', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Work Experience/i })).toBeVisible();
    // Globant is the first work item in skills.json — pin to its detail link
    await expect(
      page
        .getByRole('link')
        .filter({ hasText: /Globant/i })
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

  test('Front End / Back End filter buttons toggle', async ({ page }) => {
    const frontEnd = page.getByRole('button', { name: /Front End/i });
    await frontEnd.click();
    // After filtering, the timeline should still render at least one entry
    await expect(
      page
        .getByRole('link')
        .filter({ hasText: /Globant|Cliengo|Endava|Qubika/i })
        .first()
    ).toBeVisible();
    await frontEnd.click(); // toggle off
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
    await page
      .getByRole('link')
      .filter({ hasText: /Globant/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/skills\/\d+/);
    await expect(page.getByRole('heading', { name: /Globant/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/Hire Date/i)).toBeVisible();
    await expect(page.getByText(/Role \/ Job Description/i)).toBeVisible();
  });
});
