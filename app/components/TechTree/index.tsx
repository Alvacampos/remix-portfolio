import { FormattedMessage } from 'react-intl';

import type { SkillGroup } from '~/utils/utils';
import { getClassMaker } from '~/utils/utils';

// TechTree CSS is `@import`-inlined into the consuming route's style.css
// via postcss-import — no links() export.

const BLOCK = 'tech-tree-component';
const getClasses = getClassMaker(BLOCK);

// Forward-looking groups stay hardcoded — they aren't job experiences
// (no SKILLS entry, no range), they're aspirations / in-flight study.
// Each entry is a literal chip string; not translated (proper nouns).
const FORWARD_GROUPS: Array<{ id: string; variant: 'learning' | 'future'; tech: string[] }> = [
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

type Props = {
  groups: SkillGroup[];
};

export default function TechTree({ groups }: Props) {
  return (
    <div className={getClasses()}>
      {groups.map((group) => (
        <div key={group.id} className={getClasses('group')}>
          <h3 className={getClasses('group-title')}>
            <FormattedMessage id={group.id} />
          </h3>
          <ul className={getClasses('item-list')}>
            {group.items.map((name) => (
              <li key={name} className={getClasses('item')}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {FORWARD_GROUPS.map((group) => (
        <div
          key={group.id}
          className={`${getClasses('group')} ${getClasses('group', group.variant)}`}
        >
          <h3 className={getClasses('group-title')}>
            <FormattedMessage id={group.id} />
          </h3>
          <ul className={getClasses('item-list')}>
            {group.tech.map((name) => (
              <li
                key={name}
                className={`${getClasses('item')} ${getClasses('item', group.variant)}`}
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
