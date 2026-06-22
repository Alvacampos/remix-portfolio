import { FormattedMessage } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

// Carousel CSS is `@import`-inlined into the consuming route's style.css
// via postcss-import — no links() export.

const BLOCK = 'carousel-component';
const getClasses = getClassMaker(BLOCK);

type Group = {
  id: string;
  // Modifier appended to the chip class so forward-looking groups
  // (Learning, Future) render with dashed borders and a distinct
  // accent label. Defaults to undefined → standard chip styling.
  variant?: 'learning' | 'future';
  tech: string[];
};

const CATEGORIES: Group[] = [
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
  {
    id: 'TECH_GROUP_LEARNING',
    variant: 'learning',
    tech: ['Claude Certified Architect (CCA-F)', 'Python (deepening)'],
  },
  {
    id: 'TECH_GROUP_FUTURE',
    variant: 'future',
    tech: ["Master's in IT Management — UNSTA"],
  },
];

export default function Carousel() {
  return (
    <div className={getClasses()}>
      {CATEGORIES.map((group) => (
        <div
          key={group.id}
          className={
            group.variant
              ? `${getClasses('group')} ${getClasses('group', group.variant)}`
              : getClasses('group')
          }
        >
          <h3 className={getClasses('group-title')}>
            <FormattedMessage id={group.id} />
          </h3>
          <ul className={getClasses('item-list')}>
            {group.tech.map((name) => (
              <li
                key={name}
                className={
                  group.variant
                    ? `${getClasses('item')} ${getClasses('item', group.variant)}`
                    : getClasses('item')
                }
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
