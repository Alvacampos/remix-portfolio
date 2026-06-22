import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import DownloadBtn from './index';

describe('DownloadBtn', () => {
  it('renders an anchor with href, download, and target=_blank', () => {
    renderWithProviders(
      <DownloadBtn fileUrl="/files/cv.pdf" fileName="cv.pdf">
        Download
      </DownloadBtn>
    );
    const anchor = screen.getByRole('link', { name: 'Download' });
    expect(anchor).toHaveAttribute('href', '/files/cv.pdf');
    expect(anchor).toHaveAttribute('download', 'cv.pdf');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
