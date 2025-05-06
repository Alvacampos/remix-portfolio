import { getClassMaker } from '~/utils/utils';
import pkg, { VerticalTimeline } from 'react-vertical-timeline-component';
import { Link } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';
import { v4 as uuid } from 'uuid';
import { SuccessFilled } from '~/components/icons';
import Card, { links as cardLinks } from '~/components/Card';
import LoadingSpinner, { links as loadingSpinnerLinks } from '~/components/LoadingSpinner';
import styles from './style.css?url';

export const links = () => [
  ...loadingSpinnerLinks(),
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
}

type FilteredDataTypes = {
  filteredData: DataTypes[];
};

export default function Timeline({ filteredData }: FilteredDataTypes) {
  return (
    <ClientOnly fallback={<LoadingSpinner />}>
      {() => (
        <div className={getClasses()}>
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
      )}
    </ClientOnly>
  );
}
