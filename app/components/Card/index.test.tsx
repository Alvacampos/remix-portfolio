import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import Card from './index';

describe('Card', () => {
  it('renders the title', () => {
    renderWithProviders(<Card title="My title" />);
    expect(screen.getByRole('heading', { level: 2, name: 'My title' })).toBeInTheDocument();
  });

  it('renders each text in the texts prop', () => {
    renderWithProviders(<Card texts={['First', 'Second']} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('renders an itemList with title and text', () => {
    renderWithProviders(<Card itemList={[{ title: 'Item one', text: 'Body one' }]} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Item one' })).toBeInTheDocument();
    expect(screen.getByText('Body one')).toBeInTheDocument();
  });

  it('caps skills at 7 entries plus a "click for more" hint', () => {
    const skills = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
    renderWithProviders(<Card skills={skills} />);
    expect(screen.getByText('s7')).toBeInTheDocument();
    expect(screen.queryByText('s8')).not.toBeInTheDocument();
    expect(screen.getByText(/click for more/i)).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    renderWithProviders(
      <Card title="t">
        <span data-testid="child" />
      </Card>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
