import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { useIntl } from 'react-intl';

import Card from '~/components/Card';
import { getClassMaker, mergeRouteMeta } from '~/utils/utils';

import educationData from '../../../public/data/education.json';
import styles from './style.css?url';

export const links = () => [
  {
    rel: 'preload',
    href: '/fonts/monaspace/MonaspaceNeon-Regular.woff2',
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

type DegreeData = {
  title: string;
  startDate: string;
  endDate: string;
  institution: string;
  summary: string;
  description: string;
  skills: string[];
};

const SLUG_MAP: Record<string, 'degree' | 'associateDegree'> = {
  degree: 'degree',
  'associate-degree': 'associateDegree',
};

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params?.slug;
  const key = slug ? SLUG_MAP[slug] : undefined;

  if (!key) throw new Error('Oh no! Something went wrong!');

  const data = educationData[key] as DegreeData;

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
