import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData, useRouteError } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';

import Card from '~/components/Card';
import { loadSkills } from '~/data/skills-schema';
import { type Locale, pickLocale } from '~/intl';
import {
  formatDate,
  getClassMaker,
  getSkillsForJob,
  localized,
  mergeRouteMeta,
} from '~/utils/utils';

import skillsJson from '../../../public/data/skills.json';
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
    title: `${args.data?.data?.title ?? 'Work item'} — Gonzalo Alvarez Campos`,
    description: args.data?.data?.rol ?? 'Work experience detail.',
  });

const BLOCK = 'skills-id-route';
const getClasses = getClassMaker(BLOCK);

// Hand-picked banner dimensions per logo (height is narrowed from the
// source webp to render the image as a banner rather than its full
// aspect). Re-pick if a logo is swapped.
const LOGO_DIMS: Record<string, { width: number; height: number }> = {
  'unsta2.webp': { width: 968, height: 400 },
  'coderhouse.webp': { width: 976, height: 272 },
  'globant.webp': { width: 3000, height: 200 },
  'cliengo.webp': { width: 999, height: 200 },
  'endava.webp': { width: 541, height: 184 },
  'qubika.webp': { width: 800, height: 400 },
};
const FALLBACK_DIMS = { width: 1000, height: 500 };

// Title → filename overrides for jobs whose `${title.toLowerCase()}.webp`
// derivation doesn't yield a real file (institution name as stem
// instead of role title).
const IMAGE_OVERRIDES: Record<string, string> = {
  'professor (part-time)': 'unsta2.webp',
  teacher: 'coderhouse.webp',
};

const SKILLS = loadSkills(skillsJson);

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params?.uuid;
  if (!id) throw new Error('Missing work item id.');

  const numericId = Number(id);
  if (!Number.isInteger(numericId)) throw new Error(`Invalid work item id: ${id}`);

  const item = SKILLS.WORK_ITEMS.find((w) => w.id === numericId);
  if (!item) throw new Error(`Work item ${id} not found.`);

  const lowerTitle = item.title.toLowerCase();
  const fileName = IMAGE_OVERRIDES[lowerTitle] ?? `${lowerTitle}.webp`;
  const imagePath = `/assets/img/${fileName}`;
  const imageDims = LOGO_DIMS[fileName] ?? FALLBACK_DIMS;

  // Resolve localized copy in the loader so meta + render share one
  // source of truth and the loader output is fully serializable.
  const locale: Locale = pickLocale(request);
  // `projects` is either a structured array (each entry has its own
  // `_es` siblings) or a plain string sentence (Spanish lives in the
  // workItem-level `projects_es`). Resolve both cases here.
  let projects: typeof item.projects;
  if (Array.isArray(item.projects)) {
    projects = item.projects.map((p) => ({
      title: localized(p, 'title', locale),
      text: localized(p, 'text', locale),
    }));
  } else if (typeof item.projects === 'string') {
    projects = localized(item, 'projects', locale);
  } else {
    projects = item.projects;
  }

  // Pre-compute the date strings in the loader so the render is plain
  // text. `formatDate` doesn't know about react-intl, and threading the
  // locale through both the loader and the component would split the
  // source of truth — keep it loader-side.
  const startLabel = formatDate(item.startDate, '', undefined, locale);
  const endLabel = item.endDate ? formatDate(item.endDate, '', undefined, locale) : null;
  const duration = formatDate(item.startDate, item.endDate ?? undefined, 'fullYearMonth', locale);

  return {
    data: {
      id: item.id,
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate,
      rol: localized(item, 'rol', locale),
      description: localized(item, 'description', locale),
      projects,
      skills: [...getSkillsForJob(SKILLS, item.id)].sort((a, b) => a.localeCompare(b)),
      startLabel,
      endLabel,
      duration,
    },
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
  const { title, projects, skills, startLabel, endLabel, duration } = data;

  const renderDates = () => (
    <div className={getClasses('dates')}>
      <p className={getClasses('date-range')}>
        <span>{startLabel}</span>
        <span aria-hidden="true" className={getClasses('date-arrow')}>
          →
        </span>
        <span>{endLabel ?? <FormattedMessage id="PRESENT" />}</span>
      </p>
      {duration && <p className={getClasses('date-duration')}>{duration}</p>}
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
      <Link to="/skills" className={getClasses('back-link')}>
        <span aria-hidden="true">←</span> <FormattedMessage id="BACK_TO_SKILLS" />
      </Link>
      <h1 className={getClasses('title')}>{title}</h1>
      <div className={getClasses('main-container')}>
        <div className={getClasses('img-container')}>
          <img
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
      <div className={getClasses('bottom-grid')}>
        <div className={getClasses('projects')}>
          {Array.isArray(projects) ? (
            <Card title={formatMessage({ id: 'PROJECTS' })} itemList={projects} />
          ) : (
            <Card title={formatMessage({ id: 'PROJECTS' })} texts={projects ? [projects] : []} />
          )}
        </div>
        {skills.length > 0 && (
          <div className={getClasses('skills')}>
            <Card title={formatMessage({ id: 'SKILLS' })} skills={skills} showSkillsCta={false} />
          </div>
        )}
      </div>
    </div>
  );
}
