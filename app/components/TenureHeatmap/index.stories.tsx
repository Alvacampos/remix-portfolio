import type { Meta, StoryObj } from '@storybook/react-vite';

import TenureHeatmap from './index';

const meta: Meta<typeof TenureHeatmap> = {
  title: 'Components/TenureHeatmap',
  component: TenureHeatmap,
};
export default meta;

type Story = StoryObj<typeof TenureHeatmap>;

export const Default: Story = {
  args: {
    data: {
      years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
      rows: [
        // Active: cells in the last column (2026), sorted by total DESC.
        {
          skill: 'JavaScript',
          monthsPerYear: [12, 12, 12, 12, 12, 12, 12, 12, 6],
          total: 102,
          isActive: true,
        },
        {
          skill: 'React',
          monthsPerYear: [5, 12, 12, 12, 12, 12, 12, 12, 6],
          total: 95,
          isActive: true,
        },
        {
          skill: 'Python',
          monthsPerYear: [12, 12, 4, 0, 0, 5, 12, 12, 6],
          total: 63,
          isActive: true,
        },
        {
          skill: 'TypeScript',
          monthsPerYear: [0, 0, 0, 8, 12, 12, 12, 12, 6],
          total: 62,
          isActive: true,
        },
        {
          skill: 'Django',
          monthsPerYear: [12, 12, 4, 0, 0, 0, 6, 12, 6],
          total: 52,
          isActive: true,
        },
        // Lapsed: no cells in 2026, sorted by last-used year DESC.
        {
          skill: 'Storybook',
          monthsPerYear: [0, 12, 12, 12, 12, 4, 4, 4, 0],
          total: 60,
          isActive: false,
        },
        {
          skill: 'Tailwind',
          monthsPerYear: [0, 0, 0, 0, 0, 6, 6, 6, 0],
          total: 18,
          isActive: false,
        },
        {
          skill: 'Cypress',
          monthsPerYear: [0, 0, 0, 12, 12, 0, 0, 0, 0],
          total: 24,
          isActive: false,
        },
      ],
    },
  },
};

export const ManyRows: Story = {
  args: {
    data: {
      years: [2020, 2021, 2022, 2023, 2024, 2025, 2026],
      // 14 skills — triggers the "Show N more" toggle (default visible: 12)
      rows: Array.from({ length: 14 }, (_, i) => {
        const monthsPerYear = [12, 12, 12, 12, 12, 12, 6 - i].map((m) => Math.max(0, m));
        return {
          skill: `Skill ${i + 1}`,
          monthsPerYear,
          total: monthsPerYear.reduce((s, m) => s + m, 0),
          isActive: monthsPerYear[monthsPerYear.length - 1] > 0,
        };
      }),
    },
  },
};
