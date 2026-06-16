import type { Meta, StoryObj } from '@storybook/react-vite';

import Carousel from './index';

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
};

export default meta;

type Story = StoryObj<typeof Carousel>;

export const Default: Story = {};
