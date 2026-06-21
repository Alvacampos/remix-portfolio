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

import NavBar from '~/components/NavBar';
import { type Locale, messagesFor, pickLocale } from '~/intl';
import styles from '~/styles/style.css?url';
import { getClassMaker } from '~/utils/utils';

const SITE_URL = 'https://gonzalo-alvarez-campos-cv.com';
const FONT_URL = '/fonts/roboto/Roboto-VariableFont_wdth,wght.woff2';
// Absolute URL — Open Graph crawlers (LinkedIn, Slack, X, iMessage) require
// non-relative image URLs. The PNG itself is rendered offline from
// scripts/og-image.svg via scripts/render-og-image.mjs.
const OG_IMAGE_URL = `${SITE_URL}/assets/img/og.png`;

export function links() {
  return [
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
    { property: 'og:image', content: OG_IMAGE_URL },
    { property: 'og:image:secure_url', content: OG_IMAGE_URL },
    { property: 'og:image:type', content: 'image/png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    {
      property: 'og:image:alt',
      content: 'Gonzalo Alvarez Campos — Software Engineer portfolio',
    },

    // Twitter — large-image card so the og:image renders at full width
    // instead of the small thumbnail used by `summary`.
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: OG_IMAGE_URL },
    {
      name: 'twitter:image:alt',
      content: 'Gonzalo Alvarez Campos — Software Engineer portfolio',
    },
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

// Inline theme initializer. Runs synchronously in <head> before paint,
// so the body never flashes the wrong theme on first render. Reads
// localStorage.theme (set by the NavBar toggle), falls back to the
// OS-level prefers-color-scheme, defaults to dark when undecidable.
// Sets `<html data-theme="…">` so app/styles/style.css's
// [data-theme='light'] selector swaps the palette tokens.
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme: light)').matches)document.documentElement.dataset.theme='light';}catch(e){}`;

// WebSite schema gives Google enough to surface a sitelinks search box
// in SERPs and helps disambiguate the property when crawled. Kept
// minimal — no `potentialAction` SearchAction since this isn't a
// searchable site.
const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Gonzalo Alvarez Campos',
  url: SITE_URL,
  inLanguage: ['en', 'es'],
  author: { '@type': 'Person', name: 'Gonzalo Alvarez Campos' },
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
    // suppressHydrationWarning: the inline theme-init script (below) sets
    // `<html data-theme>` from localStorage / prefers-color-scheme on the
    // client BEFORE React hydrates. SSR can't know the user's preference,
    // so the attribute legitimately differs between server + client. This
    // attribute IS the only thing that drifts; React still warns on
    // children, so unintended drift elsewhere is still caught.
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1" />
        {/* Theme init runs before paint; keep it before any <link> tags
            that pull stylesheets. eslint-disable-next-line react/no-danger */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Meta />
        <Links />
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSONLD) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
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
