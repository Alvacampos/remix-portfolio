import { Link } from '@remix-run/react';
import { lazy, memo, Suspense } from 'react';
import pkg, { VerticalTimeline } from 'react-vertical-timeline-component';

import { links as cardLinks } from '~/components/Card';
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

const { VerticalTimelineElement } = pkg;
const LazyCard = lazy(() => import('~/components/Card'));

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
        <Suspense fallback={<div style={{ height: 100 }} />}>
          <LazyCard {...item} isStyleless />
        </Suspense>
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
