import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '~/../test/test-utils';

import Carousel from './index';

describe('Carousel', () => {
  it('renders one chip per technology and one heading per category', () => {
    const { container } = renderWithProviders(<Carousel />);
    const items = container.querySelectorAll('.carousel-component__item');
    const groups = container.querySelectorAll('.carousel-component__group-title');
    expect(items.length).toBeGreaterThan(20);
    expect(groups.length).toBe(4);
  });
});
