import type { MetaFunction } from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react';
import { IntlProvider } from 'react-intl';

import NavBar, { links as NavBarLinks } from '~/components/NavBar';
import messages from '~/intl/en-US.json';
import styles from '~/styles/style.css?url';
import tailwind from '~/styles/tailwind.css?url';
import { getClassMaker } from '~/utils/utils';

export function links() {
  return [
    ...NavBarLinks(),
    { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
    { rel: 'stylesheet', href: tailwind },
    { rel: 'stylesheet', href: styles },
  ];
}

const BLOCK = 'root';
const getClasses = getClassMaker(BLOCK);

export const meta: MetaFunction = () => [{ title: 'Gonzalo Alvarez Campos Cv' }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1" />
        <Meta />
        <Links />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
      </head>
      <body className={getClasses()}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <IntlProvider messages={messages} locale="en" defaultLocale="en">
      <NavBar />
      <main>
        <Outlet />
      </main>
    </IntlProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-boundary">
        <p>Page under development.</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
