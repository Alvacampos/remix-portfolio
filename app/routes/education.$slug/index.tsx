import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { isRouteErrorResponse, Link, useLoaderData, useRouteError } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';

import Card from '~/components/Card';
import { loadEducation } from '~/data/education-schema';
import { type Locale, pickLocale } from '~/intl';
import { formatDate, getClassMaker, localized, mergeRouteMeta } from '~/utils/utils';

import educationJson from '../../../public/data/education.json';
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
    title: `${args.data?.data?.title ?? 'Education'} — Gonzalo Alvarez Campos`,
    description: args.data?.data?.summary ?? 'Education detail.',
  });

const BLOCK = 'education-id-route';
const getClasses = getClassMaker(BLOCK);

const EDUCATION = loadEducation(educationJson);

const SLUG_MAP: Record<string, 'degree' | 'associateDegree'> = {
  degree: 'degree',
  'associate-degree': 'associateDegree',
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slug = params?.slug;
  const key = slug ? SLUG_MAP[slug] : undefined;
  if (!key) throw new Response(`Education entry not found: ${slug}`, { status: 404 });

  const locale: Locale = pickLocale(request);
  const raw = EDUCATION[key];
  const data = {
    title: localized(raw, 'title', locale),
    startLabel: formatDate(raw.startDate, '', undefined, locale),
    endLabel: formatDate(raw.endDate, '', undefined, locale),
    institution: raw.institution,
    summary: localized(raw, 'summary', locale),
    description: localized(raw, 'description', locale),
    skills: raw.skills,
  };

  return { data };
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  const status = isRouteErrorResponse(error) ? error.status : 'Error';
  return (
    <div className={getClasses('error')}>
      <p className={getClasses('error-code')}>{status}</p>
      <h1 className={getClasses('error-title')}>
        <FormattedMessage id="ERROR_EDUCATION_TITLE" />
      </h1>
      <p className={getClasses('error-body')}>
        <FormattedMessage id="ERROR_EDUCATION_BODY" />
      </p>
      <Link to="/education" className={getClasses('error-action')}>
        <span aria-hidden="true">←</span> <FormattedMessage id="BACK_TO_EDUCATION" />
      </Link>
    </div>
  );
}

export default function EducationDetail() {
  const { data } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const { title, startLabel, endLabel, institution, description, skills } = data;

  return (
    <div className={getClasses()}>
      <Link to="/education" className={getClasses('back-link')}>
        <span aria-hidden="true">←</span> <FormattedMessage id="BACK_TO_EDUCATION" />
      </Link>
      <h1 className={getClasses('title')}>{title}</h1>
      <p className={getClasses('meta')}>
        <span>
          {startLabel} <span className={getClasses('date-arrow')}>→</span> {endLabel}
        </span>
        <span aria-hidden className={getClasses('meta-sep')}>
          ·
        </span>
        <span>{institution}</span>
      </p>
      <div className={getClasses('bottom-grid')}>
        <div className={getClasses('description')}>
          <Card title={formatMessage({ id: 'DESCRIPTION' })} texts={[description]} />
        </div>
        {skills && skills.length > 0 && (
          <div className={getClasses('skills')}>
            <Card title={formatMessage({ id: 'SKILLS' })} skills={skills} showSkillsCta={false} />
          </div>
        )}
      </div>
    </div>
  );
}
