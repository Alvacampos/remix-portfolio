import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '~/../test/test-utils';

import CustomBarChart from './index';

describe('CustomBarChart', () => {
  it('mounts without crashing for non-empty data', () => {
    const data: (string | number)[][] = [
      ['React', 5],
      ['Node.js', 3],
      ['Python', 1],
    ];
    const { container } = renderWithProviders(<CustomBarChart data={data} />);
    expect(container.querySelector('.bar-chart-component')).toBeInTheDocument();
  });
});
