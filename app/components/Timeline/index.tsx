import { Link } from '@remix-run/react';
import { memo } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';

import Card, { links as cardLinks } from '~/components/Card';
import { SuccessFilled } from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [
  ...cardLinks(),
  { rel: 'preload', href: styles, as: 'style' },
  { rel: 'stylesheet', href: styles },
];

const BLOCK = 'timeline-component';
const getClasses = getClassMaker(BLOCK);

export type DataTypes = {
  id: string;
  title: string;
  date: string;
  texts: string[];
  skills: string[];
};

type FilteredDataTypes = {
  filteredData: DataTypes[];
};

function TimelineElementInner({ item }: { item: DataTypes }) {
  return (
    <VerticalTimelineElement
      className={getClasses('element')}
      date={item.date}
      icon={<SuccessFilled />}
    >
      <Link
        to={`/skills/${item.id}`}
        className={getClasses('element-link')}
        state={{ item: item.id }}
      >
        <Card {...item} isStyleless />
      </Link>
    </VerticalTimelineElement>
  );
}

const TimelineElement = memo(TimelineElementInner);

export default function Timeline({ filteredData }: FilteredDataTypes) {
  return (
    <div className={getClasses()}>
      <VerticalTimeline>
        {filteredData.map((item) => (
          <TimelineElement key={item.id} item={item} />
        ))}
      </VerticalTimeline>
    </div>
  );
}
