import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import NavBar from './index';

describe('NavBar', () => {
  it('renders the main navigation entries', () => {
    renderWithProviders(<NavBar />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    // Stage 26: "CV" was renamed to "Work" — the page title is
    // "Skills & Work Experience" so "Work" matches what visitors see.
    expect(screen.getByRole('link', { name: /work/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /education/i })).toBeInTheDocument();
  });

  it('renders a Resume PDF download link', () => {
    renderWithProviders(<NavBar />);
    const resume = screen.getByRole('link', { name: /resume/i });
    expect(resume).toHaveAttribute('href', '/assets/files/gonzalo_alvarez_campos_cv.pdf');
    expect(resume).toHaveAttribute('download', 'Gonzalo_Alvarez_CV.pdf');
  });

  it('renders the theme toggle', () => {
    renderWithProviders(<NavBar />);
    // Initial render: SSR-stable Sun icon (dark default), aria-label
    // says "Switch to light mode" because the toggle assumes dark.
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
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
