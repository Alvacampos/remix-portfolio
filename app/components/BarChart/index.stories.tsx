import type { Meta, StoryObj } from '@storybook/react-vite';

import BarChart from './index';

const SAMPLE_DATA: (string | number)[][] = [
  ['HTML', 7.83],
  ['CSS', 7.83],
  ['JavaScript', 7.83],
  ['React', 7.17],
  ['TypeScript', 4.83],
  ['Cypress', 4.83],
  ['Tailwind', 4.83],
  ['Remix', 4.17],
  ['GraphQL', 4.17],
  ['Playwright', 4.17],
];

const meta: Meta<typeof BarChart> = {
  title: 'Components/BarChart',
  component: BarChart,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof BarChart>;

export const RealisticPortfolio: Story = {
  args: {
    data: SAMPLE_DATA,
  },
};

export const Sparse: Story = {
  args: {
    data: [
      ['React', 5],
      ['TypeScript', 3],
      ['Python', 1],
    ],
  },
};
