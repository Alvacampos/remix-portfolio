import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders, screen } from '~/../test/test-utils';

import Input from './index';

describe('Input (autocomplete)', () => {
  const SUGGESTIONS = ['React', 'Redux', 'Remix', 'Node.js'];

  it('renders with placeholder', () => {
    renderWithProviders(
      <Input possibleValues={SUGGESTIONS} placeholder="Filter…" handleInput={() => {}} />
    );
    expect(screen.getByPlaceholderText('Filter…')).toBeInTheDocument();
  });

  it('filters suggestions as the user types', async () => {
    const handleInput = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <Input possibleValues={SUGGESTIONS} placeholder="x" handleInput={handleInput} />
    );

    await user.type(screen.getByPlaceholderText('x'), 'Re');

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Redux')).toBeInTheDocument();
    expect(screen.getByText('Remix')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
    expect(handleInput).toHaveBeenCalledWith('Re');
  });

  it('shows "no matches found" when nothing matches', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Input possibleValues={SUGGESTIONS} placeholder="x" handleInput={() => {}} />
    );

    await user.type(screen.getByPlaceholderText('x'), 'zzz');
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });

  it('selects a suggestion on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Input possibleValues={SUGGESTIONS} placeholder="x" handleInput={() => {}} />
    );

    const input = screen.getByPlaceholderText('x') as HTMLInputElement;
    await user.type(input, 'Re');
    await user.click(screen.getByText('React'));

    expect(input.value).toBe('React');
  });
});
