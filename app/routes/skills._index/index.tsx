import 'react-vertical-timeline-component/style.min.css';

import { Link, useLoaderData } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import { format } from 'date-fns';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import pkg, { VerticalTimeline } from 'react-vertical-timeline-component';
import Button, { links as ButtonLinks } from '~/components/Button';
import { v4 as uuid } from 'uuid';

import Card, { links as cardLinks } from '~/components/Card';
import { SuccessFilled } from '~/components/icons';
import { WORK_ITEMS } from '~/utils/data';
import { getClassMaker, formatDate } from '~/utils/utils';
import { formatDuration, intervalToDuration } from 'date-fns';

import styles from './style.css?url';

const { VerticalTimelineElement } = pkg;

export const links = () => [...cardLinks(), ...ButtonLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);

type DataTypes = {
  id: number;
  title: string;
  date: string;
  texts: string[];
  skills: string[];
};

export async function loader() {
  const data: DataTypes[] = WORK_ITEMS.map((item) => ({
    id: item.id,
    title: item.title,
    date: formatDate(item.startDate, item.endDate),
    texts: [item.rol],
    skills: item.skills,
  }));
  return json({
    data,
    yearsOfExp: formatDuration(
      intervalToDuration({ start: new Date(WORK_ITEMS[0].startDate), end: new Date() }),
      { format: ['years', 'months'] }
    ),
  });
}

export default function Skills() {
  const { data, yearsOfExp } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const [filteredData, setFilteredData] = useState<DataTypes[]>(data);
  const [isFrontEnd, setIsFrontEnd] = useState(false);
  const [isBackEnd, setIsBackEnd] = useState(false);

  console.log(yearsOfExp);

  const filter = (word: string) =>
    data.filter((item) =>
      item.skills.find((skill) => skill.toLowerCase().includes(word.toLowerCase()))
    );

  const filterInput = (e: { target: { value: string } }) => {
    if (!e.target.value || e.target.value === '') {
      setFilteredData(data);
      return;
    }

    const filteredArray = filter(e.target.value);
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
          <input
            type="text"
            onChange={filterInput}
            className={getClasses('time-line-filter')}
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

        <VerticalTimeline>
          {filteredData.map((item) => {
            const key = uuid();
            return (
              <VerticalTimelineElement
                className={getClasses('element')}
                date={item.date}
                icon={<SuccessFilled />}
                key={key}
              >
                <Link
                  to={`/skills/${item.id}`}
                  tabIndex={-1}
                  className={getClasses('element-link')}
                  state={{ item: item.id }}
                >
                  <Card {...item} isStyleless />
                </Link>
              </VerticalTimelineElement>
            );
          })}
        </VerticalTimeline>
        <div className={getClasses('years-of-exp')}>
          <Card title={formatMessage({ id: 'TOTAL_YEARS_OF_EXPERIENCE' })} texts={[yearsOfExp]} />
        </div>
      </div>
    </div>
  );
}
