import { FormattedMessage } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'carousel-component';
const getClasses = getClassMaker(BLOCK);

const CATEGORIES: { id: string; tech: string[] }[] = [
  {
    id: 'TECH_GROUP_LANGUAGES',
    tech: ['TypeScript', 'JavaScript', 'Python', 'HTML', 'CSS', 'Sass'],
  },
  {
    id: 'TECH_GROUP_FRAMEWORKS',
    tech: ['React', 'Next.js', 'Remix', 'Vue', 'Node.js', 'Django', 'Express', 'GraphQL', 'Redux'],
  },
  {
    id: 'TECH_GROUP_TOOLING',
    tech: ['Storybook', 'Playwright', 'Cypress', 'Tailwind', 'Git', 'Axios'],
  },
  {
    id: 'TECH_GROUP_INFRA',
    tech: ['Cloudflare', 'Heroku', 'MongoDB', 'Highcharts', 'Agile'],
  },
];

export default function Carousel() {
  return (
    <div className={getClasses()}>
      {CATEGORIES.map((group) => (
        <div key={group.id} className={getClasses('group')}>
          <h3 className={getClasses('group-title')}>
            <FormattedMessage id={group.id} />
          </h3>
          <ul className={getClasses('item-list')}>
            {group.tech.map((name) => (
              <li key={name} className={getClasses('item')}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
