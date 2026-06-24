import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import LocaleToggle from './index';

describe('LocaleToggle', () => {
  it('renders one button per supported locale and marks the current one pressed', () => {
    renderWithProviders(<LocaleToggle current="en" />);
    const en = screen.getByRole('button', { name: /switch to en/i });
    const es = screen.getByRole('button', { name: /switch to es/i });
    expect(en).toHaveAttribute('aria-pressed', 'true');
    expect(es).toHaveAttribute('aria-pressed', 'false');
  });

  it('flips the pressed state when current is the other locale', () => {
    renderWithProviders(<LocaleToggle current="es" />);
    expect(screen.getByRole('button', { name: /switch to es/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /switch to en/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });
});
