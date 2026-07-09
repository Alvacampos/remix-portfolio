import { lazy, Suspense, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { data, type LoaderFunctionArgs, type MetaFunction, useLoaderData } from 'react-router';

import Card from '~/components/Card';
import Input from '~/components/Input';
import TechTreeSkeleton from '~/components/skeletons/parts/TechTreeSkeleton';
import TenureHeatmapSkeleton from '~/components/skeletons/parts/TenureHeatmapSkeleton';
import TimelineSkeleton from '~/components/skeletons/parts/TimelineSkeleton';
import { SKILLS } from '~/data/loaded';
import { type Locale, pickLocale } from '~/intl';
import { mergeRouteMeta } from '~/utils/meta';
import { passLoaderHeaders } from '~/utils/route-headers';
import {
  formatDate,
  getAllSkillGroups,
  getClassMaker,
  getSkillGroupsForJob,
  getSkillHeatmapData,
  getSkillSuggestions,
  localized,
} from '~/utils/utils';

import styles from './style.css?url';

// Lazy-component CSS (TechTree, TenureHeatmap, Timeline, vendor
// vertical-timeline) is now `@import`-inlined into ./style.css via
// postcss-import — see that file for the rationale. The lazy chunks
// themselves still split off the eager bundle through `lazy()` below.
// Monaspace is *not* preloaded here: on /skills it only paints the
// "Total years of experience" chip and empty-state text — neither is
// on the LCP path, and preloading fights Roboto for the first
// connection window. It still ships lazily via @font-face.
export const links = () => [{ rel: 'stylesheet', href: styles }];

const LazyTimeline = lazy(() => import('~/components/Timeline'));
const LazyTechTree = lazy(() => import('~/components/TechTree'));
const LazyTenureHeatmap = lazy(() => import('~/components/TenureHeatmap'));

export const meta: MetaFunction = (args) =>
  mergeRouteMeta(args, {
    title: 'Skills & Work Experience — Gonzalo Alvarez Campos',
    description:
      'Work history, technologies, and years of experience per skill. Filter by technology to see where each was used.',
    ogImage: 'skills',
  });

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);

// SKILLS validates once at boot (see ~/data/loaded). Anything Date-
// derived stays in the loader — on Cloudflare Workers, `new Date()` at
// module init returns 0 (Spectre mitigation) so module-scope time math
// would lock to 1970 in production.
const SUGGESTIONS = getSkillSuggestions(SKILLS);
const WORK_ITEMS_REVERSED = [...SKILLS.WORK_ITEMS].reverse();

// Per-locale derivations are pure functions over the deploy-time-frozen
// `SKILLS` payload, so memoize them at module scope. The Map is keyed by
// Locale (currently `'en' | 'es'`) and populated lazily on first request
// per worker. Each entry sticks until the next deploy replaces the
// worker. Safe: the JSON is baked into the server bundle, so nothing
// under `SKILLS` mutates at runtime.
type LocalizedSkillsBundle = {
  timelineCards: Array<{
    id: string;
    title: string;
    date: string;
    texts: string[];
    textsLabel: string;
    skills: string[];
  }>;
  techTreeGroups: ReturnType<typeof getAllSkillGroups>;
  extraActivities: Array<{
    title: string;
    data: Array<{ title: string; text: string }>;
  }>;
};

const LOCALIZED_CACHE = new Map<Locale, LocalizedSkillsBundle>();

function getLocalizedBundle(locale: Locale): LocalizedSkillsBundle {
  const cached = LOCALIZED_CACHE.get(locale);
  if (cached) return cached;
  const bundle: LocalizedSkillsBundle = {
    timelineCards: WORK_ITEMS_REVERSED.map((item) => ({
      id: String(item.id),
      title: item.title,
      date: formatDate(item.startDate, item.endDate, undefined, locale),
      texts: [localized(item, 'rol', locale)],
      textsLabel: 'ROLE',
      skills: getSkillGroupsForJob(SKILLS, item.id, locale).flatMap((g) => g.items),
    })),
    techTreeGroups: getAllSkillGroups(SKILLS, locale),
    extraActivities: SKILLS.EXTRA_ACTIVITIES.map((activity) => ({
      title: activity.title,
      data: activity.data.map((d) => ({
        title: localized(d, 'title', locale),
        text: localized(d, 'text', locale),
      })),
    })),
  };
  LOCALIZED_CACHE.set(locale, bundle);
  return bundle;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = pickLocale(request);
  const { timelineCards, techTreeGroups, extraActivities } = getLocalizedBundle(locale);
  return data(
    {
      data: timelineCards,
      yearsOfExp: formatDate(SKILLS.WORK_ITEMS[0].startDate, undefined, 'fullYearMonth', locale),
      skills: SUGGESTIONS,
      heatmapData: getSkillHeatmapData(SKILLS),
      techTreeGroups,
      extraActivities,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        // Loader output varies by locale (work-item rol/description,
        // extra-activity copy). Tell the edge to segment its cache key
        // by both `Accept-Language` (browser default for new visitors)
        // AND `Cookie` — `pickLocale` reads the `locale` cookie set by
        // LocaleToggle, so two visitors with the same Accept-Language
        // but different cookie values must get different responses.
        // The `?lang=` URL param is already a different cache key on
        // its own.
        Vary: 'Accept-Language, Cookie',
      },
    }
  );
}

export { passLoaderHeaders as headers };

export default function Skills() {
  const { formatMessage } = useIntl();
  const { data, yearsOfExp, skills, heatmapData, techTreeGroups, extraActivities } =
    useLoaderData<typeof loader>();
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
      <h1 className="route-page-title">
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
          // Only fires when the user's filter query matches no work
          // items. The loader guarantees `data` is populated, so this
          // isn't a loading state — surface the intl "no matches"
          // message instead of a spinner.
          <p className={getClasses('empty-state')} role="status">
            <FormattedMessage id="NO_MATCHES_FOUND" />
          </p>
        ) : (
          <Suspense fallback={<TimelineSkeleton />}>
            <LazyTimeline filteredData={filteredData} />
          </Suspense>
        )}
        <div className={getClasses('years-of-exp')}>
          <Card title={formatMessage({ id: 'TOTAL_YEARS_OF_EXPERIENCE' })} texts={[yearsOfExp]} />
        </div>
      </div>
      <div className={getClasses('skills-and-tools')}>
        <h2>
          <FormattedMessage id="SKILLS_SECTION_TITLE" />
        </h2>
        <div className={getClasses('skills-and-tools-grid')}>
          <Suspense fallback={<TenureHeatmapSkeleton />}>
            <LazyTenureHeatmap data={heatmapData} />
          </Suspense>
          <Suspense fallback={<TechTreeSkeleton />}>
            <LazyTechTree groups={techTreeGroups} />
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
