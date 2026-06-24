import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { useIntl } from 'react-intl';

import Card from '~/components/Card';
import { loadEducation } from '~/data/education-schema';
import { type Locale, pickLocale } from '~/intl';
import { getClassMaker, localized, mergeRouteMeta } from '~/utils/utils';

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

// Validate at worker boot — same pattern as the index route.
const EDUCATION = loadEducation(educationJson);

const SLUG_MAP: Record<string, 'degree' | 'associateDegree'> = {
  degree: 'degree',
  'associate-degree': 'associateDegree',
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const slug = params?.slug;
  const key = slug ? SLUG_MAP[slug] : undefined;

  if (!key) throw new Error('Oh no! Something went wrong!');

  // Resolve the locale-specific copy in the loader so both the
  // <meta> function (which reads loader output) and the rendered
  // component see the same translated text.
  const locale: Locale = pickLocale(request);
  const raw = EDUCATION[key];
  const data = {
    title: localized(raw, 'title', locale),
    startDate: raw.startDate,
    endDate: raw.endDate,
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
  return (
    <h1 className={getClasses('error')}>There was a problem while loading this education entry</h1>
  );
}

export default function EducationDetail() {
  const { data } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const { title, startDate, endDate, institution, description, skills } = data;
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();

  return (
    <div className={getClasses()}>
      <h1 className={getClasses('title')}>{title}</h1>
      <p className={getClasses('meta')}>
        <span>
          {startYear} – {endYear}
        </span>
        <span aria-hidden className={getClasses('meta-sep')}>
          ·
        </span>
        <span>{institution}</span>
      </p>
      <div className={getClasses('description-container')}>
        <Card title={formatMessage({ id: 'DESCRIPTION' })} texts={[description]} />
      </div>
      {skills && skills.length > 0 && (
        <div className={getClasses('skills')}>
          <Card title={formatMessage({ id: 'SKILLS' })} skills={skills} showSkillsCta={false} />
        </div>
      )}
    </div>
  );
}
