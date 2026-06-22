import { data as remixData, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import verticalTimelineStyles from 'react-vertical-timeline-component/style.min.css?url';

import Card from '~/components/Card';
import carouselStyles from '~/components/Carousel/style.css?url';
import Input from '~/components/Input';
import LoadingSpinner from '~/components/LoadingSpinner';
import tenureHeatmapStyles from '~/components/TenureHeatmap/style.css?url';
import timelineStyles from '~/components/Timeline/style.css?url';
import { loadSkills } from '~/data/skills-schema';
import {
  formatDate,
  getClassMaker,
  getSkillHeatmapData,
  getSkillsForJob,
  getSkillSuggestions,
  mergeRouteMeta,
} from '~/utils/utils';

import skillsJson from '../../../public/data/skills.json';
import styles from './style.css?url';

// CSS for lazy components is imported as `?url` strings — a static
// `import { links } from '...'` would defeat the lazy chunk split.
export const links = () => [
  {
    rel: 'preload',
    href: '/fonts/monaspace/MonaspaceNeon-Regular.woff2',
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
  { rel: 'stylesheet', href: carouselStyles },
  { rel: 'stylesheet', href: tenureHeatmapStyles },
  { rel: 'stylesheet', href: timelineStyles },
  { rel: 'stylesheet', href: verticalTimelineStyles },
  { rel: 'stylesheet', href: styles },
];

const LazyTimeline = lazy(() => import('~/components/Timeline'));
const LazyCarousel = lazy(() => import('~/components/Carousel'));
const LazyTenureHeatmap = lazy(() => import('~/components/TenureHeatmap'));

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Skills & Work Experience — Gonzalo Alvarez Campos',
    description:
      'Work history, technologies, and years of experience per skill. Filter by technology to see where each was used.',
  });

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);

// Validated + derived once per worker boot for everything that's
// time-independent. Anything that calls `new Date()` (heatmap year span,
// "ongoing" job clamp, total-years figure) stays in the loader: on
// Cloudflare Workers, `Date.now()` at module init returns 0 (Spectre
// mitigation freezes Date until the first I/O event), so module-scope
// derivations would lock the year-since to 1970 in production.
const SKILLS = loadSkills(skillsJson);
const SUGGESTIONS = getSkillSuggestions(SKILLS);
const TIMELINE_CARDS_BASE = [...SKILLS.WORK_ITEMS].reverse().map((item) => ({
  id: String(item.id),
  title: item.title,
  startDate: item.startDate,
  endDate: item.endDate ?? undefined,
  rol: item.rol,
  skills: getSkillsForJob(SKILLS, item.id),
}));

export async function loader() {
  const timelineCards = TIMELINE_CARDS_BASE.map(({ startDate, endDate, rol, ...rest }) => ({
    ...rest,
    date: formatDate(startDate, endDate),
    texts: [rol],
    textsLabel: 'ROLE',
  }));
  return remixData(
    {
      data: timelineCards,
      yearsOfExp: formatDate(SKILLS.WORK_ITEMS[0].startDate, undefined, 'fullYearMonth'),
      skills: SUGGESTIONS,
      heatmapData: getSkillHeatmapData(SKILLS),
      extraActivities: SKILLS.EXTRA_ACTIVITIES,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}

export default function Skills() {
  const { formatMessage } = useIntl();
  const { data, yearsOfExp, skills, heatmapData, extraActivities } = useLoaderData<typeof loader>();
  const [filteredData, setFilteredData] = useState(data);

  const filterInput = useCallback(
    (word: string) => {
      if (!word || word === '') {
        setFilteredData(data);
        return;
      }
      const needle = word.toLowerCase();
      setFilteredData(
        data.filter((item) => item.skills.some((skill) => skill.toLowerCase().includes(needle)))
      );
    },
    [data]
  );

  return (
    <div className={getClasses()}>
      <h1 className={getClasses('page-title')}>
        <FormattedMessage id="PAGE_TITLE_SKILLS" />
      </h1>
      <div className={getClasses('time-line')}>
        <div className={getClasses('time-line-controls')}>
          <Input
            possibleValues={skills}
            handleInput={filterInput}
            placeholder={formatMessage({ id: 'FILTER_BY_SPECIFIC_TECHNOLOGY' })}
          />
        </div>
        {filteredData.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <Suspense fallback={<LoadingSpinner />}>
            <LazyTimeline filteredData={filteredData} />
          </Suspense>
        )}
        <div className={getClasses('years-of-exp')}>
          <Card title={formatMessage({ id: 'TOTAL_YEARS_OF_EXPERIENCE' })} texts={[yearsOfExp]} />
        </div>
      </div>
      <div className={getClasses('skills-and-tools')}>
        <h2>
          <FormattedMessage id="TECHNOLOGIES" />
        </h2>
        <div className={getClasses('skills-and-tools-grid')}>
          <Suspense fallback={<LoadingSpinner />}>
            <LazyTenureHeatmap data={heatmapData} />
          </Suspense>
          <Suspense fallback={<LoadingSpinner />}>
            <LazyCarousel />
          </Suspense>
        </div>
      </div>
      <div className={getClasses('extra-activities')}>
        <h2>
          <FormattedMessage id="EXTRA_ACTIVITIES" />
        </h2>
        <div className={getClasses('extra-activities-wrapper')}>
          {extraActivities.map((activity) => (
            <Card title={activity.title} itemList={activity.data} key={activity.title} />
          ))}
        </div>
      </div>
    </div>
  );
}
