import { FormattedMessage, useIntl } from 'react-intl';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, isRouteErrorResponse, Link, useLoaderData, useRouteError } from 'react-router';

import Card from '~/components/Card';
import { SKILLS } from '~/data/loaded';
import { type Locale, pickLocale } from '~/intl';
import { mergeRouteMeta } from '~/utils/meta';
import { passLoaderHeaders } from '~/utils/route-headers';
import { formatDate, getClassMaker, getSkillGroupsForJob, localized } from '~/utils/utils';

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
    title: `${args.loaderData?.data?.title ?? 'Work item'} — Gonzalo Alvarez Campos`,
    description: args.loaderData?.data?.rol ?? 'Work experience detail.',
    // Detail page inherits the parent section's OG — no per-item template.
    ogImage: 'skills',
  });

const BLOCK = 'skills-id-route';
const getClasses = getClassMaker(BLOCK);

// Intrinsic pixel dimensions per logo — the browser reserves the
// right aspect ratio in the layout so there's no CLS and Lighthouse's
// image-aspect-ratio audit passes. Read with `sips -g pixelWidth -g
// pixelHeight public/assets/img/<file>.webp` when adding a new logo.
const LOGO_DIMS: Record<string, { width: number; height: number }> = {
  'unsta2.webp': { width: 968, height: 519 },
  'coderhouse.webp': { width: 976, height: 272 },
  'globant.webp': { width: 3000, height: 2000 },
  'cliengo.webp': { width: 999, height: 300 },
  'endava.webp': { width: 541, height: 184 },
  'qubika.webp': { width: 800, height: 600 },
};
const FALLBACK_DIMS = { width: 1000, height: 500 };

// Title → filename overrides for jobs whose `${title.toLowerCase()}.webp`
// derivation doesn't yield a real file (institution name as stem
// instead of role title).
const IMAGE_OVERRIDES: Record<string, string> = {
  'professor (part-time)': 'unsta2.webp',
  teacher: 'coderhouse.webp',
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = params?.uuid;
  if (!id) throw new Response('Missing work item id', { status: 400 });

  const numericId = Number(id);
  if (!Number.isInteger(numericId))
    throw new Response(`Invalid work item id: ${id}`, { status: 400 });

  const item = SKILLS.WORK_ITEMS.find((w) => w.id === numericId);
  if (!item) throw new Response(`Work item ${id} not found`, { status: 404 });

  const lowerTitle = item.title.toLowerCase();
  const fileName = IMAGE_OVERRIDES[lowerTitle] ?? `${lowerTitle}.webp`;
  const imagePath = `/assets/img/${fileName}`;
  const imageDims = LOGO_DIMS[fileName] ?? FALLBACK_DIMS;

  const locale: Locale = pickLocale(request);
  // `projects` can be either a structured array (each entry has its
  // own `_es` siblings) or a plain string sentence (Spanish lives in
  // the workItem-level `projects_es`). Resolve both cases here.
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

  const startLabel = formatDate(item.startDate, '', undefined, locale);
  const endLabel = item.endDate ? formatDate(item.endDate, '', undefined, locale) : null;
  const duration = formatDate(item.startDate, item.endDate ?? undefined, 'fullYearMonth', locale);

  return data(
    {
      data: {
        id: item.id,
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        rol: localized(item, 'rol', locale),
        description: localized(item, 'description', locale),
        projects,
        skillGroups: getSkillGroupsForJob(SKILLS, item.id, locale),
        startLabel,
        endLabel,
        duration,
      },
      imagePath,
      imageDims,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        // Same reasoning as /skills — payload varies by locale, and
        // `pickLocale` reads both `?lang=` and the `locale` cookie.
        Vary: 'Accept-Language, Cookie',
      },
    }
  );
}

export { passLoaderHeaders as headers };

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  const status = isRouteErrorResponse(error) ? error.status : 'Error';
  return (
    <div className={getClasses('error')}>
      <p className={getClasses('error-code')}>{status}</p>
      <h1 className={getClasses('error-title')}>
        <FormattedMessage id="ERROR_WORK_ITEM_TITLE" />
      </h1>
      <p className={getClasses('error-body')}>
        <FormattedMessage id="ERROR_WORK_ITEM_BODY" />
      </p>
      <Link to="/skills" className={getClasses('error-action')}>
        <span aria-hidden="true">←</span> <FormattedMessage id="BACK_TO_SKILLS" />
      </Link>
    </div>
  );
}

export default function UuidIndex() {
  const { data, imagePath, imageDims } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const { title, projects, skillGroups, startLabel, endLabel, duration } = data;

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
            fetchPriority="high"
            decoding="async"
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
        {skillGroups.length > 0 && (
          <div className={getClasses('skills')}>
            <Card title={formatMessage({ id: 'SKILLS' })}>
              <div className={getClasses('skill-groups')}>
                {skillGroups.map((group) => (
                  <div key={group.id} className={getClasses('skill-group')}>
                    <h3 className={getClasses('skill-group-title')}>
                      <FormattedMessage id={group.id} />
                    </h3>
                    <ul className={getClasses('skill-group-list')}>
                      {group.items.map((name) => (
                        <li key={name} className={getClasses('skill-group-chip')}>
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
