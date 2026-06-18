import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';

import Card from '~/components/Card';
import { formatDate, getClassMaker } from '~/utils/utils';

import educationData from '../../../public/data/education.json';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.data?.title ?? 'Education';
  return [
    { title: `${title} — Gonzalo Alvarez Campos` },
    {
      name: 'description',
      content: data?.data?.summary ?? 'Education detail.',
    },
  ];
};

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

// slug → (data key in education.json, optional logo file).
// Add a new entry here when a new clickable degree is added.
const SLUG_MAP: Record<string, { key: 'degree' | 'associateDegree'; image?: string }> = {
  degree: { key: 'degree' },
  'associate-degree': { key: 'associateDegree', image: 'unsta2.webp' },
};

const LOGO_DIMS: Record<string, { width: number; height: number }> = {
  'unsta2.webp': { width: 968, height: 400 },
};
const FALLBACK_DIMS = { width: 1000, height: 500 };

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params?.slug;
  const entry = slug ? SLUG_MAP[slug] : undefined;

  if (!entry) throw new Error('Oh no! Something went wrong!');

  const data = educationData[entry.key] as DegreeData;
  const imagePath = entry.image ? `/assets/img/${entry.image}` : undefined;
  const imageDims = entry.image ? (LOGO_DIMS[entry.image] ?? FALLBACK_DIMS) : FALLBACK_DIMS;

  return {
    data,
    imagePath,
    imageDims,
  };
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <h1 className={getClasses('error')}>There was a problem while loading this education entry</h1>
  );
}

export default function EducationDetail() {
  const { data, imagePath, imageDims } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const { title, startDate, endDate, institution, summary, description, skills } = data;

  const renderDates = () => (
    <div>
      <p>
        <FormattedMessage id="START_DATE" />: {formatDate(startDate, '')}
      </p>
      <p>
        <FormattedMessage id="END_DATE" />: {formatDate(endDate, '')}
      </p>
    </div>
  );

  return (
    <div className={getClasses()}>
      <h1 className={getClasses('title')}>{title}</h1>
      <div className={getClasses('main-container')}>
        {imagePath && (
          <div className={getClasses('img-container')}>
            <img
              loading="lazy"
              src={imagePath}
              alt={institution}
              width={imageDims.width}
              height={imageDims.height}
              className={getClasses('institution-logo')}
            />
          </div>
        )}
        <div className={getClasses('info-container')}>
          <Card title={formatMessage({ id: 'STUDY_DATES' })}>{renderDates()}</Card>
          <Card title={formatMessage({ id: 'INSTITUTION' })} texts={[institution]} />
          <Card title={formatMessage({ id: 'SUMMARY' })} texts={[summary]} />
          <Card title={formatMessage({ id: 'DESCRIPTION' })} texts={[description]} />
        </div>
      </div>
      {skills && skills.length > 0 && (
        <div className={getClasses('skills')}>
          <Card title={formatMessage({ id: 'SKILLS' })} texts={skills} />
        </div>
      )}
    </div>
  );
}
