import type { Meta, StoryObj } from '@storybook/react-vite';

import LoadingSpinner from './index';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
};

export default meta;

type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {};
