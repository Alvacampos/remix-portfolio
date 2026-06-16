import 'react-vertical-timeline-component/style.min.css';

import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import BarChart, { links as barChartLinks } from '~/components/BarChart';
import Button, { links as buttonLinks } from '~/components/Button';
import Card, { links as cardLinks } from '~/components/Card';
import Carousel, { links as carouselLinks } from '~/components/Carousel';
import Input, { links as inputLinks } from '~/components/Input';
import LoadingSpinner, { links as loadingSpinnerLinks } from '~/components/LoadingSpinner';
import Timeline, { links as timelineLinks } from '~/components/Timeline';
import { formatDate, getClassMaker, getSkillChartData } from '~/utils/utils';

import styles from './style.css?url';

// All component CSS ships in <head> via Remix's <Links> at SSR time
// so the page renders styled on first paint. We tried lazy()+Suspense
// for BarChart / Carousel / Timeline to defer their JS, but routing
// their CSS through `links()` re-couples the modules to the route
// chunk anyway (Vite warns "dynamic import will not move module into
// another chunk"). Keep them as plain imports until we add a manual
// CSS-preload strategy that decouples the two.
export const links = () => [
  ...cardLinks(),
  ...inputLinks(),
  ...buttonLinks(),
  ...carouselLinks(),
  ...barChartLinks(),
  ...timelineLinks(),
  ...loadingSpinnerLinks(),
  { rel: 'stylesheet', href: styles },
];

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
    id: string;
    title: string;
    startDate: string;
    endDate?: string | null;
    rol: string;
    skills: SkillEntryJson[];
  }[];
  SKILLS_IMG: {
    title: string;
    img: string;
  }[];
  EXTRA_ACTIVITIES: {
    title: string;
    data: {
      title: string;
      text: string;
    }[];
  }[];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL('/data/skills.json', request.url);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch skills.json');
  }

  const skillsData: skillsDataTypes = await response.json();

  const data = skillsData.WORK_ITEMS.map((item) => ({
    id: item.id,
    title: item.title,
    date: formatDate(item.startDate, item.endDate ?? undefined),
    texts: [item.rol],
    // Card chips and the autocomplete filter only need names — flatten here
    // and let getSkillChartData() consume the date-aware shape directly.
    skills: item.skills.map((s) => s.name),
  }));

  const skills = skillsData.SKILLS_IMG.map((item) => item.title);

  const chartData = getSkillChartData(skillsData.WORK_ITEMS);

  return json(
    {
      data,
      yearsOfExp: formatDate(skillsData.WORK_ITEMS[0].startDate, undefined, 'fullYearMonth'),
      skills,
      chartData,
      extraActivities: skillsData.EXTRA_ACTIVITIES,
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
        {filteredData.length === 0 ? <LoadingSpinner /> : <Timeline filteredData={filteredData} />}
        <div className={getClasses('years-of-exp')}>
          <Card title={formatMessage({ id: 'TOTAL_YEARS_OF_EXPERIENCE' })} texts={[yearsOfExp]} />
        </div>
      </div>
      <div className={getClasses('skills-and-tools')}>
        <h2>
          <FormattedMessage id="TECHNOLOGIES" />
        </h2>
        <Carousel />
        <BarChart data={chartData} />
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
