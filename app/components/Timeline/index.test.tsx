import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import Timeline from './index';

const ITEMS = [
  {
    id: '1',
    title: 'Globant',
    date: '08/2018 - 12/2020',
    texts: ['Jr Web developer.'],
    skills: ['React', 'Vue'],
  },
  {
    id: '2',
    title: 'Cliengo',
    date: '12/2020 - 08/2021',
    texts: ['Mid Level Full-stack developer.'],
    skills: ['React', 'NodeJs'],
  },
];

describe('Timeline', () => {
  it('renders one card per filteredData entry, each linking to /skills/:id', () => {
    renderWithProviders(<Timeline filteredData={ITEMS} />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/skills/1');
    expect(hrefs).toContain('/skills/2');
  });
});
