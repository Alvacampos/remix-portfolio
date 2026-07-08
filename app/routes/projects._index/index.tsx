import { FormattedMessage, useIntl } from 'react-intl';
import type { MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';

import Card from '~/components/Card';
import { loadProjects } from '~/data/projects-schema';
import type { Locale } from '~/intl';
import { mergeRouteMeta } from '~/utils/meta';
import { formatDate, getClassMaker, localized } from '~/utils/utils';
import projectsJson from '~data/projects.json';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Case Studies — Gonzalo Alvarez Campos',
    description:
      'Selected case studies from recent contract work — abstracted where client names are under NDA. Problem / Constraints / Approach / Outcome for each.',
    ogImage: 'projects',
  });

const BLOCK = 'projects-route';
const getClasses = getClassMaker(BLOCK);

const PROJECTS = loadProjects(projectsJson);

// Ordering rule: ongoing projects (no `endDate`) first, then everyone
// else newest-end-date first. Applied once at boot; the JSON's
// authored order is chronological (oldest first) which is the wrong
// direction for surfacing the most recent work.
const ORDERED_PROJECTS = [...PROJECTS.PROJECTS].sort((a, b) => {
  const aOngoing = a.endDate === undefined;
  const bOngoing = b.endDate === undefined;
  if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
  // Both ongoing (unlikely) or both ended — sort by endDate DESC.
  // `endDate` is a `YYYY-MM` string; localeCompare works because both
  // sides are zero-padded.
  return (b.endDate ?? '').localeCompare(a.endDate ?? '');
});

export async function loader() {
  return { projects: ORDERED_PROJECTS };
}

export default function ProjectsIndex() {
  const { projects } = useLoaderData<typeof loader>();
  const { formatMessage, locale } = useIntl();
  const loc = locale as Locale;

  const learnMore = (
    <p className={getClasses('learn-more')} aria-hidden>
      <FormattedMessage id="LEARN_MORE" />
      <span className={getClasses('learn-more-arrow')}>→</span>
    </p>
  );

  return (
    <div className={getClasses()}>
      <h1 className="route-page-title">
        <FormattedMessage id="PAGE_TITLE_PROJECTS" />
      </h1>
      <p className={getClasses('intro')}>
        <FormattedMessage id="PROJECTS_INTRO" />
      </p>
      <div className={getClasses('list')}>
        {projects.map((project) => {
          const endLabel = project.endDate
            ? formatDate(project.endDate, '', undefined, loc)
            : formatMessage({ id: 'PRESENT' });
          const dateRange = `${formatDate(project.startDate, '', undefined, loc)} → ${endLabel}`;
          return (
            <Link
              key={project.slug}
              to={`/projects/${project.slug}`}
              className={getClasses('card-link')}
            >
              <div className={getClasses('card-wrapper')}>
                <Card
                  title={localized(project, 'title', loc)}
                  texts={[
                    `${localized(project, 'role', loc)} · ${project.company}`,
                    dateRange,
                    localized(project, 'summary', loc),
                  ]}
                  skills={project.tech}
                  showSkillsCta={false}
                >
                  {learnMore}
                </Card>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
