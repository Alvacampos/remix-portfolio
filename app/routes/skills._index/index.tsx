import 'react-vertical-timeline-component/style.min.css';

import { json, Link, useLoaderData } from '@remix-run/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import pkg, { VerticalTimeline } from 'react-vertical-timeline-component';
import { v4 as uuid } from 'uuid';

import Card, { links as cardLinks } from '~/components/Card';
import { Job } from '~/components/icons';
import { WORK_ITEMS } from '~/utils/data';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

const { VerticalTimelineElement } = pkg;

export const links = () => [
  ...cardLinks(),
  { rel: 'stylesheet', href: styles },
];

const BLOCK = 'skills-route';
const getClasses = getClassMaker(BLOCK);

type DataTypes = {
  id: number;
  title: string;
  date: string;
  texts: string[];
  skills: string[];
};

const FormatDate = (startDate: string, endDate?: string) => {
  if (!endDate) {
    return `${format(new Date(startDate), 'MM/yyyy')} - Present`;
  }

  return `${format(new Date(startDate), 'MM/yyyy')} - ${format(new Date(endDate), 'MM/yyyy')}`;
};

export async function loader() {
  const data: DataTypes[] = WORK_ITEMS.map((item) => ({
    id: item.id,
    title: item.title,
    date: FormatDate(item.startDate, item.endDate),
    texts: [item.subtitle],
    skills: item.skills,
  }));
  return json({
    data,
  });
}

export default function Skills() {
  const { data } = useLoaderData<typeof loader>();
  const { formatMessage } = useIntl();
  const [filteredData, setFilteredData] = useState<DataTypes[]>(data);

  const filter = (e: { target: { value: string } }) => {
    if (!e.target.value || e.target.value === '') {
      setFilteredData(data);
      return;
    }

    const filteredArray = data.filter((item) =>
      item.skills.find((skill) =>
        skill.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
    setFilteredData(filteredArray);
  };

  return (
    <div className={getClasses()}>
      <h2>
        <FormattedMessage id="WORK_EXPERIENCE" />
      </h2>
      <div className={getClasses('time-line')}>
        <div>
          <input
            type="text"
            onChange={filter}
            className={getClasses('time-line-filter')}
            placeholder={formatMessage({ id: 'FILTER_BY_SPECIFIC_TECHNOLOGY' })}
          />
        </div>

        <VerticalTimeline>
          {filteredData.map((item) => {
            const key = uuid();
            return (
              <VerticalTimelineElement
                className={getClasses('element')}
                date={item.date}
                icon={<Job />}
                key={key}
              >
                <Link
                  to={`/skills/${item.id}`}
                  tabIndex={-1}
                  className={getClasses('element-link')}
                >
                  <Card {...item} isStyleless />
                </Link>
              </VerticalTimelineElement>
            );
          })}
        </VerticalTimeline>
      </div>
    </div>
  );
}
