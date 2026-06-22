import type { Meta, StoryObj } from '@storybook/react-vite';

import DownloadBtn from './index';

const meta: Meta<typeof DownloadBtn> = {
  title: 'Components/DownloadBtn',
  component: DownloadBtn,
};

export default meta;

type Story = StoryObj<typeof DownloadBtn>;

export const Default: Story = {
  args: {
    fileUrl: '/assets/files/gonzalo_alvarez_campos_cv.pdf',
    fileName: 'Gonzalo_Alvarez_CV.pdf',
    children: 'Download my CV (PDF)',
  },
};
