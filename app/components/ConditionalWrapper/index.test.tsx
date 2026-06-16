import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import ConditionalWrapper, { ConditionalLink } from './index';

describe('ConditionalWrapper', () => {
  it('wraps children when condition is true', () => {
    renderWithProviders(
      <ConditionalWrapper
        condition
        wrapper={(children) => <section data-testid="wrap">{children}</section>}
      >
        <span>inner</span>
      </ConditionalWrapper>
    );
    expect(screen.getByTestId('wrap')).toBeInTheDocument();
    expect(screen.getByText('inner')).toBeInTheDocument();
  });

  it('renders children directly when condition is false', () => {
    renderWithProviders(
      <ConditionalWrapper
        condition={false}
        wrapper={(children) => <section data-testid="wrap">{children}</section>}
      >
        <span>inner</span>
      </ConditionalWrapper>
    );
    expect(screen.queryByTestId('wrap')).not.toBeInTheDocument();
    expect(screen.getByText('inner')).toBeInTheDocument();
  });
});

describe('ConditionalLink', () => {
  it('wraps in a link when condition is true', () => {
    renderWithProviders(
      <ConditionalLink condition to="/skills" label="go to skills">
        <span>child</span>
      </ConditionalLink>
    );
    const link = screen.getByRole('link', { name: 'go to skills' });
    expect(link).toHaveAttribute('href', '/skills');
  });

  it('renders children unwrapped when condition is false', () => {
    renderWithProviders(
      <ConditionalLink condition={false} label="x">
        <span>child</span>
      </ConditionalLink>
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
