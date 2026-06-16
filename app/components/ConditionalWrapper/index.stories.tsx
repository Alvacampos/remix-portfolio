import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConditionalLink } from './index';

const meta: Meta<typeof ConditionalLink> = {
  title: 'Components/ConditionalLink',
  component: ConditionalLink,
};

export default meta;

type Story = StoryObj<typeof ConditionalLink>;

export const ConditionTrue: Story = {
  args: {
    condition: true,
    to: '/skills',
    label: 'Open skills',
    children: <span>I am wrapped in a Link</span>,
  },
};

export const ConditionFalse: Story = {
  args: {
    condition: false,
    to: '/skills',
    label: 'Open skills',
    children: <span>I render unwrapped (no Link)</span>,
  },
};
