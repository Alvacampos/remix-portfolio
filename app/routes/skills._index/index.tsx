import { data as remixData, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import verticalTimelineStyles from 'react-vertical-timeline-component/style.min.css?url';

import barChartStyles from '~/components/BarChart/style.css?url';
import Button from '~/components/Button';
import Card from '~/components/Card';
import carouselStyles from '~/components/Carousel/style.css?url';
import Input from '~/components/Input';
import LoadingSpinner from '~/components/LoadingSpinner';
import timelineStyles from '~/components/Timeline/style.css?url';
import { formatDate, getClassMaker, getSkillChartData } from '~/utils/utils';

// Import the JSON server-side: Vite bakes it into the server bundle so
// the loader doesn't have to do an HTTP round-trip to the static asset
// at /data/skills.json on every request. The asset is still served
// publicly via the `/data/*` exclude in public/_routes.json.
import skillsData from '../../../public/data/skills.json';
import styles from './style.css?url';

// Manual CSS preload pattern for code-split components: BarChart,
// Carousel, and Timeline are JS-lazy-loaded below, but their CSS is
// pulled in as `?url` strings (no module evaluation, no chunk
// coupling) and piped into Remix's <Links> via the route's `links()`
// below. This keeps the page styled on first paint while letting
// `lazy(() => import(...))` actually move each component's JS into
// its own chunk.
//
// Why we don't `import { links as xLinks } from '...'` for those
// three components: doing so would make Vite treat the module as
// statically imported, which defeats the `lazy()` chunk split (you'd
// see "dynamic import will not move module into another chunk").
//
// The small components (Card, Input, Button, LoadingSpinner) used to
// also contribute `links()` entries, but their CSS is now inlined
// into ./style.css via postcss-import (Stage 13) so /skills ships
// far fewer render-blocking stylesheets.

export const links = () => [
  { rel: 'stylesheet', href: barChartStyles },
  { rel: 'stylesheet', href: carouselStyles },
  { rel: 'stylesheet', href: timelineStyles },
  { rel: 'stylesheet', href: verticalTimelineStyles },
  { rel: 'stylesheet', href: styles },
];

// Below-the-fold heavy components — JS lazy-loaded so the initial
// /skills bundle skips recharts (~150 KB) and the 25 carousel SVGs.
// Their CSS is preloaded above, so the page is styled before this
// module evaluates.
const LazyTimeline = lazy(() => import('~/components/Timeline'));
const LazyCarousel = lazy(() => import('~/components/Carousel'));
const LazyBarChart = lazy(() => import('~/components/BarChart'));

export const meta: MetaFunction = () => [
  { title: 'Skills & Work Experience — Gonzalo Alvarez Campos' },
  {
    name: 'description',
    content:
      'Work history, technologies, and years of experience per skill. Filter by technology to see where each was used.',
  },
];

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);

type SkillEntryJson = {
  name: string;
  start?: string;
  end?: string | null;
};

type skillsDataTypes = {
  WORK_ITEMS: {
    id: number;
    title: string;
    startDate: string;
    endDate?: string | null;
    rol: string;
    skills: SkillEntryJson[];
  }[];
  SKILLS_IMG: {
    title: string;
    img?: string;
  }[];
  EXTRA_ACTIVITIES: {
    title: string;
    data: {
      title: string;
      text: string;
    }[];
  }[];
};

export async function loader() {
  // The JSON's literal-inferred type is wider than we use here (e.g.
  // optional `end` on skill entries collapses into a union); cast
  // through `unknown` so TS accepts the narrowing without flagging
  // a "neither type sufficiently overlaps" error.
  const typed = skillsData as unknown as skillsDataTypes;

  const data = typed.WORK_ITEMS.map((item) => ({
    // ids in JSON are numeric, but Timeline + the /skills/:uuid URL
    // both want strings; convert once here.
    id: String(item.id),
    title: item.title,
    date: formatDate(item.startDate, item.endDate ?? undefined),
    texts: [item.rol],
    // Card chips and the autocomplete filter only need names — flatten here
    // and let getSkillChartData() consume the date-aware shape directly.
    skills: item.skills.map((s) => s.name),
  }));

  const skills = typed.SKILLS_IMG.map((item) => item.title);

  const chartData = getSkillChartData(typed.WORK_ITEMS);

  return remixData(
    {
      data,
      yearsOfExp: formatDate(typed.WORK_ITEMS[0].startDate, undefined, 'fullYearMonth'),
      skills,
      chartData,
      extraActivities: typed.EXTRA_ACTIVITIES,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    }
  );
}

export default function Skills() {
  const { formatMessage } = useIntl();
  const { data, yearsOfExp, skills, chartData, extraActivities } = useLoaderData<typeof loader>();
  const [filteredData, setFilteredData] = useState(data);
  const [isFrontEnd, setIsFrontEnd] = useState(false);
  const [isBackEnd, setIsBackEnd] = useState(false);

  const filter = useCallback(
    (word: string) =>
      data.filter((item) =>
        item.skills.find((skill) => skill.toLowerCase().includes(word.toLowerCase()))
      ),
    [data]
  );

  const filterInput = useCallback(
    (word: string) => {
      if (!word || word === '') {
        setFilteredData(data);
        return;
      }
      setFilteredData(filter(word));
    },
    [data, filter]
  );

  const handleFrontEnd = useCallback(() => {
    if (isFrontEnd) {
      setFilteredData(data);
      setIsFrontEnd(false);
    } else {
      setFilteredData(filter(formatMessage({ id: 'FRONT_END' })));
      setIsFrontEnd(true);
    }
  }, [isFrontEnd, data, filter, formatMessage]);

  const handleBackEnd = useCallback(() => {
    if (isBackEnd) {
      setFilteredData(data);
      setIsBackEnd(false);
    } else {
      setFilteredData(filter(formatMessage({ id: 'BACK_END' })));
      setIsBackEnd(true);
    }
  }, [isBackEnd, data, filter, formatMessage]);

  // Static decorative spans used inside Front End / Back End buttons —
  // index keys are fine here, the array length never changes.
  const buttonSpans = useMemo(
    () => Array.from({ length: 4 }, (_, i) => <span key={`span-${i}`} />),
    []
  );

  return (
    <div className={getClasses()}>
      <h2>
        <FormattedMessage id="WORK_EXPERIENCE" />
      </h2>
      <div className={getClasses('time-line')}>
        <div className={getClasses('time-line-controls')}>
          <Input
            possibleValues={skills}
            handleInput={filterInput}
            placeholder={formatMessage({ id: 'FILTER_BY_SPECIFIC_TECHNOLOGY' })}
          />
          <div className={getClasses('btn-container')}>
            <Button
              handleClick={handleFrontEnd}
              className={`btn${isFrontEnd ? '--active' : ''}`}
              label={formatMessage({ id: 'FRONT_END' })}
            >
              {buttonSpans}
            </Button>
            <Button
              handleClick={handleBackEnd}
              className={`btn${isBackEnd ? '--active' : ''}`}
              label={formatMessage({ id: 'BACK_END' })}
            >
              {buttonSpans}
            </Button>
          </div>
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
        <Suspense fallback={<LoadingSpinner />}>
          <LazyCarousel />
        </Suspense>
        <Suspense fallback={<LoadingSpinner />}>
          <LazyBarChart data={chartData} />
        </Suspense>
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
