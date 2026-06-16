import type { Meta, StoryObj } from '@storybook/react-vite';

import Timeline from './index';

const SAMPLE_ITEMS = [
  {
    id: '1',
    title: 'Globant',
    date: '08/2018 - 12/2020',
    texts: ['Jr Web developer.'],
    skills: ['HTML', 'CSS', 'JavaScript', 'Vue', 'React'],
  },
  {
    id: '2',
    title: 'Cliengo',
    date: '12/2020 - 08/2021',
    texts: ['Mid Level Full-stack developer.'],
    skills: ['JavaScript', 'TypeScript', 'React', 'Redux', 'Cypress'],
  },
  {
    id: '7',
    title: 'Qubika',
    date: '04/2022 - Present',
    texts: ['Senior Frontend developer.'],
    skills: ['React', 'Remix', 'TypeScript', 'GraphQL', 'Playwright'],
  },
];

const meta: Meta<typeof Timeline> = {
  title: 'Components/Timeline',
  component: Timeline,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof Timeline>;

export const ThreeJobs: Story = {
  args: {
    filteredData: SAMPLE_ITEMS,
  },
};

export const SingleJob: Story = {
  args: {
    filteredData: [SAMPLE_ITEMS[0]],
  },
};
