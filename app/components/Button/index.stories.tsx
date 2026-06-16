import type { Meta, StoryObj } from '@storybook/react-vite';

import { Education, Home } from '~/components/icons';

import Button from './index';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    handleClick: { action: 'clicked' },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const LabelOnly: Story = {
  args: {
    label: 'Click me',
  },
};

export const WithLeftIcon: Story = {
  args: {
    label: 'Home',
    leftIcon: Home,
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Education',
    rightIcon: Education,
  },
};

export const AsLink: Story = {
  args: {
    label: 'Go to /skills',
    url: '/skills',
  },
};
