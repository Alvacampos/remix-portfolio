import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData, useRouteError } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';

import Card from '~/components/Card';
import { loadSkills } from '~/data/skills-schema';
import { formatDate, getClassMaker, getSkillsForJob, mergeRouteMeta } from '~/utils/utils';

import skillsJson from '../../../public/data/skills.json';
import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction<typeof loader> = (args) =>
  mergeRouteMeta(args, {
    title: `${args.data?.data?.title ?? 'Work item'} — Gonzalo Alvarez Campos`,
    description: args.data?.data?.rol ?? 'Work experience detail.',
  });

const BLOCK = 'skills-id-route';
const getClasses = getClassMaker(BLOCK);

// Display dimensions for each company logo, fed to <img width> /
// <img height> to reserve layout space (fixes CLS).
//
// These values are NOT the intrinsic webp dimensions — most logos are
// intentionally narrowed in height so the <img> renders as a banner
// rather than its full square / portrait aspect (browsers infer the
// aspect-ratio from these attributes). The width matches the source
// file; the height is hand-picked per logo for the banner crop.
//
// Real intrinsics for reference (decoded from public/assets/img/*.webp):
//   unsta2:     968×519   → narrowed to 968×400
//   coderhouse: 976×272   → unchanged
//   globant:    3000×2000 → narrowed to 3000×200
//   cliengo:    999×300   → narrowed to 999×200
//   endava:     541×184   → unchanged
//   qubika:     800×600   → narrowed to 800×400
//
// If a logo is swapped, re-pick its banner height; the source file's
// own dimensions are not the authority.
const LOGO_DIMS: Record<string, { width: number; height: number }> = {
  'unsta2.webp': { width: 968, height: 400 },
  'coderhouse.webp': { width: 976, height: 272 },
  'globant.webp': { width: 3000, height: 200 },
  'cliengo.webp': { width: 999, height: 200 },
  'endava.webp': { width: 541, height: 184 },
  'qubika.webp': { width: 800, height: 400 },
};
const FALLBACK_DIMS = { width: 1000, height: 500 };

// Title → image filename overrides for jobs whose `.toLowerCase().webp`
// derivation doesn't yield a real file. Add a row here when a job has
// no matching file in public/assets/img/ — for example "Professor
// (part-time)" → unsta2.webp because the institution's name is the
// stem, not the role title.
const IMAGE_OVERRIDES: Record<string, string> = {
  'professor (part-time)': 'unsta2.webp',
  teacher: 'coderhouse.webp',
};

// Validate + parse once per worker boot. See skills._index for the
// rationale; this route reads from the same cached payload.
const SKILLS = loadSkills(skillsJson);

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params?.uuid;
  if (!id) throw new Error('Missing work item id.');

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) throw new Error(`Invalid work item id: ${id}`);

  const data = SKILLS.WORK_ITEMS.find((item) => item.id === numericId);
  if (!data) throw new Error(`Work item ${id} not found.`);

  const lowerTitle = data.title.toLowerCase();
  const fileName = IMAGE_OVERRIDES[lowerTitle] ?? `${lowerTitle}.webp`;
  const imagePath = `/assets/img/${fileName}`;
  const imageDims = LOGO_DIMS[fileName] ?? FALLBACK_DIMS;

  return {
    data: { ...data, skills: getSkillsForJob(SKILLS, data.id) },
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

  const renderDates = () => (
    <div>
      <p>
        <FormattedMessage id="START_DATE" />: {formatDate(startDate, '')}
      </p>
      {data.endDate ? (
        <p>
          <FormattedMessage id="END_DATE" />: {formatDate(data.endDate, '')}
        </p>
      ) : (
        <p>
          <FormattedMessage id="END_DATE" />: Present
        </p>
      )}
    </div>
  );

  const renderJobDescription = () => (
    <div>
      <p>{data.rol}</p>
      {data.description && <p>{data.description}</p>}
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
      {skills.length > 0 && (
        <div className={getClasses('skills')}>
          <Card title={formatMessage({ id: 'SKILLS' })} texts={skills} />
        </div>
      )}
    </div>
  );
}
