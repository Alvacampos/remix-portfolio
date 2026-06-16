import type { Meta, StoryObj } from '@storybook/react-vite';

import Card from './index';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
};

export default meta;

type Story = StoryObj<typeof Card>;

export const TitleAndTexts: Story = {
  args: {
    title: 'Globant',
    texts: ['Jr Web developer.', 'Aug 2018 — Dec 2020', 'Vue.js, React, Highcharts'],
  },
};

export const ItemList: Story = {
  args: {
    title: 'Projects',
    itemList: [
      {
        title: 'Project: eVestment',
        text: 'Worked on analytics web development using Vue.js, Vuex, Vue Router, and Highcharts.',
      },
      {
        title: 'Project: Smile Direct Club',
        text: 'Developed web applications for Smile Direct Club using Vue.js, ReactJs, and JavaScript.',
      },
    ],
  },
};

export const SkillsCappedAtSeven: Story = {
  args: {
    title: 'Cliengo',
    texts: ['Mid Level Full-stack developer.'],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Redux', 'Cypress', 'Jest', 'Tailwind', 'Sass'],
  },
};

export const Styleless: Story = {
  args: {
    title: 'Inline card',
    texts: ['Used inside the timeline; no border, hover-highlight on parent link.'],
    isStyleless: true,
  },
};

export const WithChildren: Story = {
  args: {
    title: 'Hire Date',
  },
  render: (args) => (
    <Card {...args}>
      <div>
        <p>Start: January 2020</p>
        <p>End: Present</p>
      </div>
    </Card>
  ),
};
