import type { Preview } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import messages from '../app/intl/en-US.json';
import '../app/styles/style.css';

// Stories that render @remix-run/react's <Link> need a data router in
// scope (useHref invariant) — same trick as the unit test render helper.
function StoryWrapper({ children }: { children: ReactNode }) {
  const router = createMemoryRouter([{ path: '*', element: <>{children}</> }], {
    initialEntries: ['/'],
  });
  return (
    <IntlProvider messages={messages} locale="en" defaultLocale="en">
      <RouterProvider router={router} />
    </IntlProvider>
  );
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#010408' },
        { name: 'light', value: '#f0f6fc' },
      ],
    },
    a11y: {
      // 'todo' — surface a11y violations in the addon panel without failing stories.
      test: 'todo',
    },
  },
  decorators: [(Story) => <StoryWrapper>{Story()}</StoryWrapper>],
};

export default preview;
