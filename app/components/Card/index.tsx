import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'card-component';
const getClasses = getClassMaker(BLOCK);

const MAX_SKILL_CHIPS = 7;

type CardProps = {
  title?: string;
  texts?: string[];
  itemList?: {
    title: string;
    text: string;
  }[];
  isStyleless?: boolean;
  skills?: string[];
  children?: ReactNode;
};

export default function Card({
  title = undefined,
  texts = undefined,
  itemList = undefined,
  isStyleless = false,
  skills = undefined,
  children = undefined,
}: CardProps) {
  const { formatMessage } = useIntl();

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
              <p key={text}>{text}</p>
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
        {skills && (
          <>
            <hr className={getClasses('divider')} />
            <div className={getClasses('skills-container')}>
              <p>
                Skills:
                {skills.slice(0, MAX_SKILL_CHIPS).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
                <span key="__more">- {formatMessage({ id: 'CLICK_FOR_MORE' })}</span>
              </p>
            </div>
          </>
        )}
        {children && <div className={getClasses('children')}>{children}</div>}
      </div>
    </div>
  );
}
