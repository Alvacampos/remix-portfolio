import { getClassMaker } from '~/utils/utils';
import pkg, { VerticalTimeline } from 'react-vertical-timeline-component';
import { Link } from '@remix-run/react';
import { SuccessFilled } from '~/components/icons';
import { links as cardLinks } from '~/components/Card';
import styles from './style.css?url';
import { memo } from 'react';
import { Suspense, lazy } from 'react';

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

const TimelineElement = memo(({ item }: { item: DataTypes }) => (
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
));

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
