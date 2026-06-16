import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import Button from './index';

function LeftIcon({ className }: { className: string }) {
  return <svg data-testid="left-icon" className={className} />;
}

describe('Button', () => {
  it('renders the label', () => {
    renderWithProviders(<Button label="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('fires handleClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Button label="Click me" handleClick={handleClick} />);
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('wraps in an anchor when url is provided', () => {
    renderWithProviders(<Button label="Go" url="/skills" />);
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link).toHaveAttribute('href', '/skills');
  });

  it('does not wrap in an anchor when url is missing', () => {
    renderWithProviders(<Button label="Go" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders left icon when provided', () => {
    renderWithProviders(<Button label="With icon" leftIcon={LeftIcon} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });
});
