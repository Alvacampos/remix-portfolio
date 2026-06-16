import type { Meta, StoryObj } from '@storybook/react-vite';

import NavBar from './index';

const meta: Meta<typeof NavBar> = {
  title: 'Components/NavBar',
  component: NavBar,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof NavBar>;

export const Default: Story = {};
