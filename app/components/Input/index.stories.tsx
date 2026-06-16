import type { Meta, StoryObj } from '@storybook/react-vite';

import Input from './index';

const SUGGESTIONS = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Remix',
  'Next.js',
  'Node.js',
  'GraphQL',
  'Cypress',
  'Playwright',
];

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  args: {
    possibleValues: SUGGESTIONS,
    placeholder: 'Filter by a specific technology',
  },
  argTypes: {
    handleInput: { action: 'input' },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Empty: Story = {};

export const FewSuggestions: Story = {
  args: {
    possibleValues: ['React', 'Redux', 'Remix'],
  },
};
