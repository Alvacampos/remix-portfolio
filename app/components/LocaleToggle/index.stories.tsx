import type { Meta, StoryObj } from '@storybook/react-vite';

import LocaleToggle from './index';

const meta: Meta<typeof LocaleToggle> = {
  title: 'Components/LocaleToggle',
  component: LocaleToggle,
};

export default meta;

type Story = StoryObj<typeof LocaleToggle>;

export const English: Story = {
  args: { current: 'en' },
};

export const Spanish: Story = {
  args: { current: 'es' },
};
