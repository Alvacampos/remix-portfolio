import type { Meta, StoryObj } from '@storybook/react-vite';

import type { SkillGroup } from '~/utils/utils';

import TechTree from './index';

const meta: Meta<typeof TechTree> = {
  title: 'Components/TechTree',
  component: TechTree,
};

export default meta;

type Story = StoryObj<typeof TechTree>;

const SAMPLE_GROUPS: SkillGroup[] = [
  { id: 'TECH_GROUP_LANGUAGES', items: ['CSS', 'HTML', 'JavaScript', 'TypeScript'] },
  { id: 'TECH_GROUP_FRAMEWORKS', items: ['Next.js', 'React', 'Remix', 'Vue'] },
  { id: 'TECH_GROUP_TOOLING', items: ['Cypress', 'Git', 'Playwright', 'Storybook'] },
  { id: 'TECH_GROUP_INFRA', items: ['Cloudflare', 'Heroku', 'MongoDB'] },
  { id: 'TECH_GROUP_SOFT', items: ['Leadership', 'Mentoring', 'Teaching'] },
];

export const Default: Story = {
  args: { groups: SAMPLE_GROUPS },
};
