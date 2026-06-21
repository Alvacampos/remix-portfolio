import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

// Stage 13: Card CSS is inlined into each consuming route's style.css via
// postcss-import. No links() export — postcss-import owns the bundling.

const BLOCK = 'card-component';
const getClasses = getClassMaker(BLOCK);

const MAX_SKILL_CHIPS = 7;

type CardProps = {
  title?: string;
  texts?: string[];
  // Optional intl key whose translated value renders as a bold
  // prefix before each `texts` line, e.g. "Role:" → "Role: Senior
  // Frontend developer." Used on the timeline cards on /skills to
  // label the role line declaratively. Pass the intl id (not the
  // translated string) so the label tracks the active locale.
  // Defaults to undefined → texts render plain.
  textsLabel?: string;
  itemList?: {
    title: string;
    text: string;
  }[];
  isStyleless?: boolean;
  skills?: string[];
  // Controls how the `skills` chip list renders. `true` (default) caps at
  // MAX_SKILL_CHIPS, prepends "Skills:" body text, and appends a
  // "- Click for more" CTA — the right shape for the timeline cards on
  // /skills, which are clickable previews. `false` renders all chips with
  // no prefix or CTA — the right shape for /education detail where the
  // chip list IS the content, not a teaser.
  showSkillsCta?: boolean;
  children?: ReactNode;
};

export default function Card({
  title = undefined,
  texts = undefined,
  textsLabel = undefined,
  itemList = undefined,
  isStyleless = false,
  skills = undefined,
  showSkillsCta = true,
  children = undefined,
}: CardProps) {
  const { formatMessage } = useIntl();
  const visibleSkills = skills && (showSkillsCta ? skills.slice(0, MAX_SKILL_CHIPS) : skills);

  return (
    <div className={getClasses('', { styleless: isStyleless })}>
      {title && (
        <div className={getClasses('title-wrapper')}>
          <h2>{title}</h2>
        </div>
      )}
      <div className={getClasses('text-container')}>
        {texts && (
          <div className={getClasses('main-text-wrapper')}>
            {texts.map((text) => (
              <p key={text}>
                {textsLabel && (
                  <span className={getClasses('texts-label')}>
                    {formatMessage({ id: textsLabel })}:{' '}
                  </span>
                )}
                {text}
              </p>
            ))}
          </div>
        )}
        {itemList && (
          <ul className={getClasses('list')}>
            {itemList.map((item) => (
              <li key={item.title} className={getClasses('list-item')}>
                {item.title && <h3>{item.title}</h3>}
                {item.text && <p>{item.text}</p>}
              </li>
            ))}
          </ul>
        )}
        {visibleSkills && (
          <>
            {showSkillsCta && <hr className={getClasses('divider')} />}
            <div className={getClasses('skills-container')}>
              {showSkillsCta && <span className={getClasses('skills-label')}>Skills:</span>}
              <ul className={getClasses('chip-list')}>
                {visibleSkills.map((skill) => (
                  <li key={skill} className={getClasses('chip')}>
                    {skill}
                  </li>
                ))}
                {showSkillsCta && skills && skills.length > MAX_SKILL_CHIPS && (
                  <li key="__more" className={getClasses('chip', 'more')}>
                    +{skills.length - MAX_SKILL_CHIPS} {formatMessage({ id: 'CLICK_FOR_MORE' })}
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
        {children && <div className={getClasses('children')}>{children}</div>}
      </div>
    </div>
  );
}
