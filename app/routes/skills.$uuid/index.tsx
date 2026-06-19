import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { useIntl } from 'react-intl';

import Card from '~/components/Card';
import { formatDate, getClassMaker } from '~/utils/utils';

// Server-side import — see app/routes/skills._index/index.tsx for the
// rationale (Vite bakes the JSON into the server bundle, no HTTP hop).
import skillsJson from '../../../public/data/skills.json';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.data?.title ?? 'Work item';
  return [
    { title: `${title} — Gonzalo Alvarez Campos` },
    {
      name: 'description',
      content: data?.data?.rol ?? 'Work experience detail.',
    },
  ];
};

const BLOCK = 'skills-id-route';
const getClasses = getClassMaker(BLOCK);

type SkillEntryJson = {
  name: string;
  start?: string;
  end?: string | null;
};

type skillsDataTypes =
  | {
      WORK_ITEMS: {
        id: string | number;
        title: string;
        startDate: string;
        endDate: string;
        rol: string;
        skills: SkillEntryJson[];
        projects?:
          | {
              title: string;
              text: string;
            }[]
          | string;
        description: string;
      }[];
    }
  | undefined;

// Intrinsic dimensions for each company logo, fed to <img width> / <img height>
// to reserve layout space (fixes CLS). Captured from the source webp files;
// keep in sync if logos are replaced with different-sized variants.
const LOGO_DIMS: Record<string, { width: number; height: number }> = {
  'unsta2.webp': { width: 968, height: 400 },
  'coderhouse.webp': { width: 976, height: 272 },
  'globant.webp': { width: 3000, height: 200 },
  'cliengo.webp': { width: 999, height: 200 },
  'endava.webp': { width: 541, height: 184 },
  'qubika.webp': { width: 800, height: 400 },
};
const FALLBACK_DIMS = { width: 1000, height: 500 };

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params && params?.uuid;
  const skillsData = skillsJson as skillsDataTypes;
  let data;
  let imagePath: string | undefined;

  if (id) {
    data = skillsData?.WORK_ITEMS.find((item) => item.id === +id);
    if (data?.title.includes('Professor') && id === '3') {
      imagePath = data && '/assets/img/unsta2.webp';
    } else if (data?.title.includes('Teacher') && id === '6') {
      imagePath = data && '/assets/img/coderhouse.webp';
    } else {
      imagePath = data && `/assets/img/${data.title.toLowerCase()}.webp`;
    }
  }

  if (data === undefined) throw new Error('Oh no! Something went wrong!');

  const fileName = imagePath?.split('/').pop() ?? '';
  const imageDims = LOGO_DIMS[fileName] ?? FALLBACK_DIMS;

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
    <h1 className={getClasses('error')}>There was a problem while loading this work experience</h1>
  );
}

export default function UuidIndex() {
  const { data, imagePath, imageDims } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const { title, projects, startDate, skills } = data;

  // Single-line range, matching the format used everywhere else:
  // "Aug 2018 – Dec 2020" or "Apr 2022 – Present".
  const renderDates = () => <p>{formatDate(startDate, data?.endDate ?? undefined)}</p>;

  const renderJobDescription = () => (
    <div>
      <p>{data.rol}</p>
      <p>{data.description}</p>
    </div>
  );

  return (
    <div className={getClasses()}>
      <h1 className={getClasses('title')}>{title}</h1>
      <div className={getClasses('main-container')}>
        <div className={getClasses('img-container')}>
          <img
            loading="lazy"
            src={imagePath}
            alt={title}
            width={imageDims.width}
            height={imageDims.height}
            className={getClasses('company-logo')}
          />
        </div>
        <div className={getClasses('info-container')}>
          <Card title={formatMessage({ id: 'HIRE_DATES' })}>{renderDates()}</Card>
          <Card title={formatMessage({ id: 'ROLL_JOB_DESCRIPTION' })}>
            {renderJobDescription()}
          </Card>
        </div>
      </div>
      <div className={getClasses('projects')}>
        {Array.isArray(projects) ? (
          <Card title={formatMessage({ id: 'PROJECTS' })} itemList={projects} />
        ) : (
          <Card title={formatMessage({ id: 'PROJECTS' })} texts={projects ? [projects] : []} />
        )}
      </div>
      {skills && (
        <div className={getClasses('skills')}>
          <Card
            title={formatMessage({ id: 'SKILLS' })}
            skills={skills.map((s) => s.name)}
            showSkillsCta={false}
          />
        </div>
      )}
    </div>
  );
}
