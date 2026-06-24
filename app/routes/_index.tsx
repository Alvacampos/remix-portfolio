import { type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { FormattedMessage } from 'react-intl';

import DownloadButton from '~/components/DownloadBtn';
import { pickLocale } from '~/intl';
import { getClassMaker, getCvUrl, mergeRouteMeta } from '~/utils/utils';

import styles from './style.css?url';

// The CV PDF is the primary CTA on this page; prefetch it so the
// Download click is ~instant. `as: 'fetch'` + `crossOrigin: 'anonymous'`
// is the documented shape for non-document, non-script asset prefetch
// — the file is on the same origin (Cloudflare Pages) so anonymous
// fetch matches the eventual <a href> request.
//
// `links()` runs without the request in scope, so we can't pick the
// locale here. The English PDF is always available (it's the fallback
// when a translation is missing) so prefetching it is the safe bet —
// a Spanish visitor still gets the file warmed in cache; only the
// hash differs.
export const links = () => [
  { rel: 'stylesheet', href: styles },
  {
    rel: 'prefetch',
    href: '/assets/files/gonzalo_alvarez_campos_cv.pdf',
    as: 'fetch',
    crossOrigin: 'anonymous' as const,
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return { cvUrl: getCvUrl(pickLocale(request)) };
}

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Gonzalo Alvarez Campos — Senior Software Engineer',
    description:
      'Senior Software Engineer with 7+ years across React, TypeScript, Remix, Next.js, Python and Django. Download my CV.',
  });

const BLOCK = 'home-route';
const getClasses = getClassMaker(BLOCK);

export default function Index() {
  const { cvUrl } = useLoaderData<typeof loader>();
  return (
    <div className={getClasses()}>
      <h1>
        <FormattedMessage id="WELCOME_MY_NAME_IS" />
      </h1>
      <p>
        <FormattedMessage id="I_AM_A_SOFTWARE_ENGINEER" />
      </p>
      <p className={getClasses('repo-url')}>
        <FormattedMessage id="CHECK_THIS_PROJECT_REPO" />
        <span className={getClasses('repo-link')}>
          <a
            href="https://github.com/Alvacampos/remix-portfolio"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage id="REPO_GITHUB" />
          </a>
        </span>
      </p>
      <DownloadButton fileUrl={cvUrl} fileName="Gonzalo_Alvarez_CV.pdf">
        <FormattedMessage id="DOWNLOAD_CV" />
      </DownloadButton>
    </div>
  );
}
