import type { MetaFunction } from '@remix-run/cloudflare';
import { Link, useLoaderData } from '@remix-run/react';
import { FormattedMessage, useIntl } from 'react-intl';

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

export async function loader() {
  return { projects: PROJECTS.PROJECTS };
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
