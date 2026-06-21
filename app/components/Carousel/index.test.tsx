import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '~/../test/test-utils';

import Carousel from './index';

describe('Carousel', () => {
  it('renders one chip per technology and one heading per category', () => {
    const { container } = renderWithProviders(<Carousel />);
    const items = container.querySelectorAll('.carousel-component__item');
    const groups = container.querySelectorAll('.carousel-component__group-title');
    expect(items.length).toBeGreaterThan(20);
    // Languages, Frameworks, Tooling, Infrastructure, Learning, Future
    expect(groups.length).toBe(6);
  });

  it('marks forward-looking groups (learning, future) with dashed-chip variant', () => {
    const { container } = renderWithProviders(<Carousel />);
    const learningChips = container.querySelectorAll('.carousel-component__item--learning');
    const futureChips = container.querySelectorAll('.carousel-component__item--future');
    expect(learningChips.length).toBeGreaterThan(0);
    expect(futureChips.length).toBeGreaterThan(0);
  });
});
