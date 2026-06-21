import { Link } from '@remix-run/react';
import { memo } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';

import Card from '~/components/Card';
import { Briefcase, Education } from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

// Card no longer exports links() — its CSS is inlined into each consumer
// route's style.css via postcss-import (Stage 13). The preload + stylesheet
// pair below is still emitted manually because Timeline is lazy-loaded on
// /skills and we want the CSS to land on first paint despite the JS chunk
// arriving in a later round-trip.
export const links = () => [
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
  textsLabel?: string;
  skills: string[];
};

type FilteredDataTypes = {
  filteredData: DataTypes[];
};

// Teaching roles get the academic-pillars icon; full-time engineering
// roles get the briefcase. Heuristic on the work-item title — when a new
// teaching role is added, extend the regex.
const TEACHING_TITLE_RE = /professor|teacher|instructor|lecturer/i;

function TimelineElementInner({ item }: { item: DataTypes }) {
  const Icon = TEACHING_TITLE_RE.test(item.title) ? Education : Briefcase;
  return (
    <VerticalTimelineElement className={getClasses('element')} date={item.date} icon={<Icon />}>
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
