import { getClassMaker } from '~/utils/utils';
import pkg, { VerticalTimeline } from 'react-vertical-timeline-component';
import { Link } from '@remix-run/react';
import { SuccessFilled } from '~/components/icons';
import Card, { links as cardLinks } from '~/components/Card';
import styles from './style.css?url';

export const links = () => [
  ...cardLinks(),
  { rel: 'preload', href: styles, as: 'style' },
  { rel: 'stylesheet', href: styles },
];

const BLOCK = 'timeline-component';
const getClasses = getClassMaker(BLOCK);

const { VerticalTimelineElement } = pkg;

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

export default function Timeline({ filteredData }: FilteredDataTypes) {
  return (
    <div className={getClasses()}>
      <VerticalTimeline>
        {filteredData.map((item) => {
          return (
            <VerticalTimelineElement
              className={getClasses('element')}
              date={item.date}
              icon={<SuccessFilled />}
              key={item.id}
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
        })}
      </VerticalTimeline>
    </div>
  );
}
