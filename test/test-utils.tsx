import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router';

import messages from '~/intl/en-US.json';
import { NonceProvider } from '~/utils/nonce-context';

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: string[];
};

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: (
            <NonceProvider nonce="dev">
              <IntlProvider messages={messages} locale="en" defaultLocale="en">
                {children}
              </IntlProvider>
            </NonceProvider>
          ),
        },
      ],
      { initialEntries }
    );
    return <RouterProvider router={router} />;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
