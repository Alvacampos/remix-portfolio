import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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

  describe('on click', () => {
    beforeEach(() => {
      // Reset cookie + storage between cases so assertions don't see leftovers.
      document.cookie = 'locale=;Path=/;Max-Age=0';
      localStorage.removeItem('locale');
    });
    afterEach(() => {
      document.cookie = 'locale=;Path=/;Max-Age=0';
      localStorage.removeItem('locale');
    });

    it('writes the locale cookie so the choice persists cross-page', () => {
      renderWithProviders(<LocaleToggle current="en" />);
      fireEvent.click(screen.getByRole('button', { name: /switch to es/i }));
      expect(document.cookie).toMatch(/(?:^|; )locale=es(?:;|$)/);
    });

    it('also mirrors the choice into localStorage as a fallback channel', () => {
      renderWithProviders(<LocaleToggle current="en" />);
      fireEvent.click(screen.getByRole('button', { name: /switch to es/i }));
      expect(localStorage.getItem('locale')).toBe('es');
    });

    it('is a no-op when clicking the already-active locale', () => {
      renderWithProviders(<LocaleToggle current="es" />);
      fireEvent.click(screen.getByRole('button', { name: /switch to es/i }));
      expect(document.cookie).not.toMatch(/locale=/);
      expect(localStorage.getItem('locale')).toBeNull();
    });
  });
});
