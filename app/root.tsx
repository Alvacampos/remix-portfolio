import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from '@remix-run/react';
import { IntlProvider } from 'react-intl';

import NavBar, { links as NavBarLinks } from '~/components/NavBar';
import { type Locale, messagesFor, pickLocale } from '~/intl';
import styles from '~/styles/style.css?url';
import tailwind from '~/styles/tailwind.css?url';
import { getClassMaker } from '~/utils/utils';

const SITE_URL = 'https://gonzalo-alvarez-campos-cv.com';
const FONT_URL = '/fonts/roboto/Roboto-VariableFont_wdth,wght.woff2';

export function links() {
  return [
    ...NavBarLinks(),
    { rel: 'icon', href: '/assets/img/favicon.svg', type: 'image/svg+xml' },
    // Preload the variable WOFF2 — it's the only font we ship and renders
    // most of the visible text on first paint.
    {
      rel: 'preload',
      href: FONT_URL,
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    { rel: 'stylesheet', href: tailwind },
    { rel: 'stylesheet', href: styles },
    // canonical is rendered per-route in Layout from the loader's `canonical`
    // value — pinning it here would point every route at the homepage.
  ];
}

const BLOCK = 'root';
const getClasses = getClassMaker(BLOCK);

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = pickLocale(request);
  // Build the canonical URL from the request path, anchored to SITE_URL so
  // it always points at the production origin even on previews/local dev.
  // Drop trailing slash (except root) and strip query/hash so duplicate
  // URLs collapse to one canonical entry per route.
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const canonical = `${SITE_URL}${path}`;
  return {
    locale,
    messages: messagesFor(locale),
    canonical,
  };
}

export const meta: MetaFunction = () => {
  const title = 'Gonzalo Alvarez Campos — Senior Software Engineer';
  const description =
    'Full-stack engineer with 7+ years building React, TypeScript, Remix, and Next.js apps in fintech and education.';
  return [
    { title },
    { name: 'description', content: description },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    // Match the actual app background so mobile browser chrome doesn't
    // flash white on the dark theme.
    { name: 'theme-color', content: '#010408' },

    // Open Graph
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: SITE_URL },
    { property: 'og:site_name', content: 'Gonzalo Alvarez Campos' },
    { property: 'og:locale', content: 'en_US' },

    // Twitter
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];
};

const PERSON_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Gonzalo Alvarez Campos',
  jobTitle: 'Senior Software Engineer',
  url: SITE_URL,
  worksFor: { '@type': 'Organization', name: 'Qubika' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Tucumán',
    addressCountry: 'AR',
  },
  sameAs: ['https://github.com/Alvacampos', 'https://www.linkedin.com/in/gonzaloalvarezcampos/'],
};

type LayoutData = {
  locale: Locale;
  canonical: string;
};

export function Layout({ children }: { children: React.ReactNode }) {
  // Layout runs both during normal rendering and the error boundary, so the
  // loader data may be unavailable. Default to English / site root when that
  // happens.
  let locale: Locale = 'en';
  let canonical = SITE_URL;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const data = useLoaderData<LayoutData>();
    if (data?.locale) locale = data.locale;
    if (data?.canonical) canonical = data.canonical;
  } catch {
    /* error path or pre-loader render — keep defaults */
  }

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1" />
        <Meta />
        <Links />
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSONLD) }}
        />
      </head>
      <body className={getClasses()}>
        <a href="#main-content" className={getClasses('skip-link')}>
          Skip to content
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { locale, messages } = useLoaderData<typeof loader>();
  return (
    <IntlProvider messages={messages} locale={locale} defaultLocale="en">
      <NavBar />
      <main id="main-content">
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
  }
  if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
  return <h1>Unknown Error</h1>;
}
