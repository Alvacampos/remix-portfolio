import { FormattedMessage, useIntl } from 'react-intl';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, isRouteErrorResponse, Link, useLoaderData, useRouteError } from 'react-router';

import Card from '~/components/Card';
import { PROJECTS } from '~/data/loaded';
import { type Locale, pickLocale } from '~/intl';
import { mergeRouteMeta } from '~/utils/meta';
import { formatDate, getClassMaker, localized } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [
  {
    rel: 'preload',
    href: '/fonts/monaspace/MonaspaceNeon-Regular.v2.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  { rel: 'stylesheet', href: styles },
];

export const meta: MetaFunction<typeof loader> = (args) =>
  mergeRouteMeta(args, {
    title: `${args.loaderData?.data?.title ?? 'Case study'} — Gonzalo Alvarez Campos`,
    description: args.loaderData?.data?.summary ?? 'Project case study.',
    // Detail page inherits the parent section's OG.
    ogImage: 'projects',
  });

const BLOCK = 'projects-id-route';
const getClasses = getClassMaker(BLOCK);

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slug = params?.slug;
  if (!slug) throw new Response('Missing project slug', { status: 400 });

  const raw = PROJECTS.PROJECTS.find((p) => p.slug === slug);
  if (!raw) throw new Response(`Project not found: ${slug}`, { status: 404 });

  const locale: Locale = pickLocale(request);
  const payload = {
    title: localized(raw, 'title', locale),
    summary: localized(raw, 'summary', locale),
    role: localized(raw, 'role', locale),
    company: raw.company,
    startLabel: formatDate(raw.startDate, '', undefined, locale),
    endLabel: raw.endDate ? formatDate(raw.endDate, '', undefined, locale) : null,
    tech: [...raw.tech].sort((a, b) => a.localeCompare(b)),
    problem: localized(raw, 'problem', locale),
    constraints: localized(raw, 'constraints', locale),
    approach: localized(raw, 'approach', locale),
    outcome: localized(raw, 'outcome', locale),
  };
  return data(
    { data: payload },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        Vary: 'Accept-Language, Cookie',
      },
    }
  );
}

export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders;
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  const status = isRouteErrorResponse(error) ? error.status : 'Error';
  return (
    <div className={getClasses('error')}>
      <p className={getClasses('error-code')}>{status}</p>
      <h1 className={getClasses('error-title')}>
        <FormattedMessage id="ERROR_PROJECT_TITLE" />
      </h1>
      <p className={getClasses('error-body')}>
        <FormattedMessage id="ERROR_PROJECT_BODY" />
      </p>
      <Link to="/projects" className={getClasses('error-action')}>
        <span aria-hidden="true">←</span> <FormattedMessage id="BACK_TO_PROJECTS" />
      </Link>
    </div>
  );
}

export default function ProjectDetail() {
  const { data } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const {
    title,
    role,
    company,
    startLabel,
    endLabel,
    tech,
    problem,
    constraints,
    approach,
    outcome,
  } = data;

  return (
    <div className={getClasses()}>
      <Link to="/projects" className={getClasses('back-link')}>
        <span aria-hidden="true">←</span> <FormattedMessage id="BACK_TO_PROJECTS" />
      </Link>
      <h1 className={getClasses('title')}>{title}</h1>
      <p className={getClasses('meta')}>
        <span>{role}</span>
        <span aria-hidden className={getClasses('meta-sep')}>
          ·
        </span>
        <span>{company}</span>
        <span aria-hidden className={getClasses('meta-sep')}>
          ·
        </span>
        <span>
          {startLabel} <span className={getClasses('date-arrow')}>→</span>{' '}
          {endLabel ?? <FormattedMessage id="PRESENT" />}
        </span>
      </p>

      <div className={getClasses('sections')}>
        <Card title={formatMessage({ id: 'PROJECT_PROBLEM' })} texts={[problem]} />
        <Card title={formatMessage({ id: 'PROJECT_CONSTRAINTS' })} texts={[constraints]} />
        <Card title={formatMessage({ id: 'PROJECT_APPROACH' })} texts={[approach]} />
        <Card title={formatMessage({ id: 'PROJECT_OUTCOME' })} texts={[outcome]} />
      </div>

      <div className={getClasses('tech')}>
        <Card title={formatMessage({ id: 'PROJECT_TECH' })}>
          <ul className={getClasses('tech-list')}>
            {tech.map((name) => (
              <li key={name} className={getClasses('tech-chip')}>
                {name}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
