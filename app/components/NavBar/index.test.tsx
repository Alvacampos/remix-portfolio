import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import NavBar from './index';

describe('NavBar', () => {
  it('renders the main navigation entries', () => {
    renderWithProviders(<NavBar />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cv/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /education/i })).toBeInTheDocument();
  });

  it('renders the GitHub and LinkedIn external links', () => {
    renderWithProviders(<NavBar />);
    const github = screen.getByRole('link', { name: /github/i });
    const linkedin = screen.getByRole('link', { name: /linkedin/i });
    expect(github).toHaveAttribute('href', 'https://github.com/Alvacampos');
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/in/gonzaloalvarezcampos/');
    expect(github).toHaveAttribute('target', '_blank');
    expect(linkedin).toHaveAttribute('target', '_blank');
  });
});
