import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '~/../test/test-utils';

import TenureHeatmap from './index';

const FIXTURE = {
  years: [2020, 2021, 2022],
  rows: [
    { skill: 'React', monthsPerYear: [12, 12, 6], total: 30, isActive: true },
    { skill: 'TypeScript', monthsPerYear: [0, 12, 12], total: 24, isActive: true },
  ],
};

describe('TenureHeatmap', () => {
  it('renders one row per skill plus a header row', () => {
    const { container } = renderWithProviders(<TenureHeatmap data={FIXTURE} />);
    const rows = container.querySelectorAll('.tenure-heatmap__row');
    // Header row + skill rows
    expect(rows.length).toBe(3);
  });

  it('renders one cell per (skill, year) plus the legend cells', () => {
    const { container } = renderWithProviders(<TenureHeatmap data={FIXTURE} />);
    const cells = container.querySelectorAll('.tenure-heatmap__cell');
    // 2 skills × 3 years = 6 grid cells, plus 5 legend cells
    expect(cells.length).toBe(6 + 5);
  });
});
