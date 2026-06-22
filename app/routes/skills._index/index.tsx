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

// Manual CSS preload pattern for code-split components: TenureHeatmap,
// Carousel, and Timeline are JS-lazy-loaded below, but their CSS is
// pulled in as `?url` strings (no module evaluation, no chunk
// coupling) and piped into Remix's <Links> via the route's `links()`.
// We deliberately don't `import { links as xLinks } from '...'` — doing
// so would make Vite treat the module as statically imported, defeating
// the `lazy()` chunk split.

export const links = () => [
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

// Validate + parse the JSON once at module load. On a Cloudflare Pages
// Function the module is reused across requests, so this runs once per
// worker boot. A malformed skills.json crashes the worker with a
// pretty-printed error pointing at the offending field.
const SKILLS = loadSkills(skillsJson);

// Heatmap data + autocomplete suggestions are pure functions of the
// static SKILLS payload. Compute once at module scope; the loader just
// hands the references to Remix.
const HEATMAP_DATA = getSkillHeatmapData(SKILLS);
const SUGGESTIONS = getSkillSuggestions(SKILLS);

// Newest-job-first card list for the timeline. WORK_ITEMS is authored
// chronologically (oldest first); reverse for display, derive the
// per-card chip list from SKILLS via getSkillsForJob.
const TIMELINE_CARDS = [...SKILLS.WORK_ITEMS].reverse().map((item) => ({
  // Timeline + the /skills/:uuid URL want strings; convert once here.
  id: String(item.id),
  title: item.title,
  date: formatDate(item.startDate, item.endDate ?? undefined),
  texts: [item.rol],
  // intl id — Card resolves it via formatMessage so the label
  // tracks the active locale ("Role:" en / "Rol:" es).
  textsLabel: 'ROLE',
  skills: getSkillsForJob(SKILLS, item.id),
}));

// Career start = first WORK_ITEM as authored (chronological order).
const YEARS_OF_EXP = formatDate(SKILLS.WORK_ITEMS[0].startDate, undefined, 'fullYearMonth');

export async function loader() {
  return remixData(
    {
      data: TIMELINE_CARDS,
      yearsOfExp: YEARS_OF_EXP,
      skills: SUGGESTIONS,
      heatmapData: HEATMAP_DATA,
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
          {/* Heatmap left, TechGrid right on desktop — the heatmap is
           * the more visually distinctive surface and earns the
           * primary read-position. Both stack on mobile. */}
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
