import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '~/../test/test-utils';

import LoadingSpinner from './index';

describe('LoadingSpinner', () => {
  it('renders the spinner container', () => {
    const { container } = renderWithProviders(<LoadingSpinner />);
    expect(container.querySelector('.spinner-container')).toBeInTheDocument();
    expect(container.querySelector('.spinner-container__spinner-circle')).toBeInTheDocument();
  });
});
