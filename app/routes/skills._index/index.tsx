import 'react-vertical-timeline-component/style.min.css';

import {  useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { v4 as uuid } from 'uuid';

import Card, { links as cardLinks } from '~/components/Card';
import Button, { links as buttonLinks } from '~/components/Button';
import Input, { links as inputLinks } from '~/components/Input';
import Carousel, { links as carouselLinks } from '~/components/Carousel';
import Timeline, { DataTypes, links as timelineLinks } from '~/components/Timeline';
import { WORK_ITEMS, SKILLS_IMG, SKILL_CHART_DATA, EXTRA_ACTIVITIES } from '~/utils/data';
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
  { rel: 'stylesheet', href: styles },
];

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);



export async function loader() {
  const data: DataTypes[] = WORK_ITEMS.map((item) => ({
    id: item.id,
    title: item.title,
    date: formatDate(item.startDate, item.endDate),
    texts: [item.rol],
    skills: item.skills,
  }));

  const skills = SKILLS_IMG.map((item) => item.title);

  const chartData = SKILL_CHART_DATA.map((data) => [
    data.name,
    differenceInMonths(new Date(), new Date(data.startDate)) / 12,
  ]);

  return json({
    data,
    yearsOfExp: formatDuration(
      intervalToDuration({ start: new Date(WORK_ITEMS[0].startDate), end: new Date() }),
      { format: ['years', 'months'] }
    ),
    skills,
    chartData,
  });
}

export default function Skills() {
  const { formatMessage } = useIntl();
  const { data, yearsOfExp, skills, chartData } = useLoaderData<typeof loader>();
  const [filteredData, setFilteredData] = useState<DataTypes[]>(data);
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
        <Timeline filteredData={filteredData} />
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
          {EXTRA_ACTIVITIES.map((activity) => {
            const key = uuid();
            return <Card title={activity.title} itemList={activity.data} key={key} />;
          })}
        </div>
      </div>
    </div>
  );
}
