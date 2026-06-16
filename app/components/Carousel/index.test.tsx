import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '~/../test/test-utils';

import Carousel from './index';

describe('Carousel', () => {
  it('renders one item per icon entry', () => {
    const { container } = renderWithProviders(<Carousel />);
    const items = container.querySelectorAll('.carousel-component__item');
    expect(items.length).toBeGreaterThan(20);
  });
});
