import 'react-vertical-timeline-component/style.min.css';
import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import Card, { links as cardLinks } from '~/components/Card';
import Button, { links as buttonLinks } from '~/components/Button';
import Input, { links as inputLinks } from '~/components/Input';
import Carousel, { links as carouselLinks } from '~/components/Carousel';
import Timeline, { links as timelineLinks } from '~/components/Timeline';
import LoadingSpinner, { links as loadingSpinnerLinks } from '~/components/LoadingSpinner';
import { getClassMaker, formatDate } from '~/utils/utils';
import { formatDuration, intervalToDuration, differenceInMonths } from 'date-fns';
import BarChart, { links as barChartLinks } from '~/components/BarChart';

import styles from './style.css?url';

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

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);

type skillsDataTypes = {
  WORK_ITEMS: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    rol: string;
    skills: string[];
  }[];
  SKILLS_IMG: {
    title: string;
    img: string;
  }[];
  SKILL_CHART_DATA: {
    name: string;
    startDate: string;
    endDate: string;
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
    date: formatDate(item.startDate, item.endDate),
    texts: [item.rol],
    skills: item.skills,
  }));

  const skills = skillsData.SKILLS_IMG.map((item) => item.title);

  const chartData = skillsData.SKILL_CHART_DATA.map((data) => [
    data.name,
    differenceInMonths(new Date(), new Date(data.startDate)) / 12,
  ]);

  return json(
    {
      data,
      yearsOfExp: formatDuration(
        intervalToDuration({
          start: new Date(skillsData.WORK_ITEMS[0].startDate),
          end: new Date(),
        }),
        { format: ['years', 'months'] }
      ),
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

  const filter = (word: string) =>
    data.filter((item) =>
      item.skills.find((skill) => skill.toLowerCase().includes(word.toLowerCase()))
    );

  const filterInput = (word: string) => {
    if (!word || word === '') {
      setFilteredData(data);
      return;
    }

    const filteredArray = filter(word);
    setFilteredData(filteredArray);
  };

  const handleFrontEnd = () => {
    if (isFrontEnd) {
      setFilteredData(data);
      setIsFrontEnd(false);
    } else {
      setFilteredData(() => filter(formatMessage({ id: 'FRONT_END' })));
      setIsFrontEnd(true);
    }
  };

  const handleBackEnd = () => {
    if (isBackEnd) {
      setFilteredData(data);
      setIsBackEnd(false);
    } else {
      setFilteredData(() => filter(formatMessage({ id: 'BACK_END' })));
      setIsBackEnd(true);
    }
  };

  const renderSpan = () => {
    const spans = [];
    for (let i = 1; i <= 4; i++) {
      const key = uuid();
      spans.push(<span key={key}></span>);
    }
    return spans;
  };

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
              children={renderSpan()}
            />
            <Button
              handleClick={handleBackEnd}
              className={`btn${isBackEnd ? '--active' : ''}`}
              label={formatMessage({ id: 'BACK_END' })}
              children={renderSpan()}
            />
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
        {chartData.length === 0 ? <LoadingSpinner /> :  <BarChart data={chartData} />}
      </div>
      <div className={getClasses('extra-activities')}>
        <h2>
          <FormattedMessage id="EXTRA_ACTIVITIES" />
        </h2>
        <div className={getClasses('extra-activities-wrapper')}>
          {extraActivities.map((activity) => {
            const key = uuid();
            return <Card title={activity.title} itemList={activity.data} key={key} />;
          })}
        </div>
      </div>
    </div>
  );
}
