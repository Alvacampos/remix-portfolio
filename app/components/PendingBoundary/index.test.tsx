import { act, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, Outlet, RouterProvider, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import messages from '~/intl/en-US.json';

import PendingBoundary from './index';

// Renders the PendingBoundary against a memory router with a controllable
// slow loader on `/skills`. The initial route (`/`) renders a button that
// programmatically navigates — sidesteps NavBar `prefetch="intent"` which
// would resolve the destination synchronously and skip the loading state.

function renderWithRouter(skillsLoaderDelay: number) {
  function Root() {
    const navigate = useNavigate();
    return (
      <>
        <button type="button" onClick={() => navigate('/skills')}>
          Go to skills
        </button>
        <PendingBoundary>
          <Outlet />
        </PendingBoundary>
      </>
    );
  }

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <IntlProvider messages={messages} locale="en" defaultLocale="en">
            <Root />
          </IntlProvider>
        ),
        children: [
          {
            index: true,
            element: <p>Home content</p>,
          },
          {
            path: 'skills',
            loader: () =>
              new Promise((r) => {
                setTimeout(() => r(null), skillsLoaderDelay);
              }),
            element: <h1>Skills &amp; Work Experience</h1>,
          },
        ],
      },
    ],
    { initialEntries: ['/'] }
  );

  return render(<RouterProvider router={router} />);
}

describe('PendingBoundary', () => {
  it('shows a route-scoped skeleton when a client-side navigation exceeds the delay', async () => {
    renderWithRouter(600);

    // Home renders first.
    await screen.findByText('Home content');

    // Trigger client-side nav; the loader on /skills takes 600ms, and
    // the boundary's SKELETON_DELAY_MS is 150ms — so the skeleton
    // should render for the ~450ms between them.
    await act(async () => {
      screen.getByRole('button', { name: /go to skills/i }).click();
    });

    // The role=status label uses the LOADING_ROUTE intl key
    // ("Loading page…").
    const skeleton = await screen.findByRole('status', { name: /loading page/i });
    expect(skeleton).toHaveAttribute('aria-busy', 'true');

    // Once the loader resolves the skeleton is gone and the real route
    // is on screen.
    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: /Skills & Work Experience/i })
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
    expect(screen.queryByRole('status', { name: /loading page/i })).not.toBeInTheDocument();
  });

  it('renders children unchanged when no navigation is in flight', () => {
    renderWithRouter(0);
    // No click → PendingBoundary passes children straight through.
    expect(screen.getByText('Home content')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: /loading page/i })).not.toBeInTheDocument();
  });
});
