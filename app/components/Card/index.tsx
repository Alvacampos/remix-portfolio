import { v4 as uuid } from 'uuid';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { getClassMaker } from '~/utils/utils';
import { ClientOnly } from 'remix-utils/client-only';
import LoadingSkeleton, { links as loadingSkeletonLinks } from '../LoadingSkeleton';

import styles from './style.css?url';

export const links = () => [...loadingSkeletonLinks(), { rel: 'stylesheet', href: styles }];

const BLOCK = 'card-component';
const getClasses = getClassMaker(BLOCK);

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

  const renderSkills = () => {
    const skillsLength = skills && skills.length <= 7 ? skills?.length : 7;
    const array = [];
    for (let i = 0; i < skillsLength; i++) {
      const key = uuid();
      array.push(skills && <span key={key}>{skills[i]}</span>);
    }
    const key = uuid();
    array.push(skills && <span key={key}>- {formatMessage({ id: 'CLICK_FOR_MORE' })}</span>);
    return array;
  };

  return (
    <ClientOnly fallback={<LoadingSkeleton />}>
       {() => (
        <div className={getClasses('', { styleless: isStyleless })}>
        {title && (
          <div className={getClasses('title-wrapper')}>
            <h2>{title}</h2>
          </div>
        )}
        <div className={getClasses('text-container')}>
          {texts && (
            <div className={getClasses('main-text-wrapper')}>
              {texts.map((text) => {
                const key = uuid();
                return <p key={key}>{text}</p>;
              })}
            </div>
          )}
          {itemList && (
            <ul className={getClasses('list')}>
              {itemList.map((item) => {
                const key = uuid();
                return (
                  <li key={key} className={getClasses('list-item')}>
                    {item.title && <h3>{item.title}</h3>}
                    {item.text && <p>{item.text}</p>}
                  </li>
                );
              })}
            </ul>
          )}
          {skills && (
            <>
              <hr className={getClasses('divider')} />
              <div className={getClasses('skills-container')}>
                <p>Skills:{renderSkills()}</p>
              </div>
            </>
          )}
          {children && <div className={getClasses('children')}>{children}</div>}
        </div>
      </div>
       )}
    </ClientOnly>
    
  );
}
