import { v4 as uuid } from 'uuid';

import { getClassMaker } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'card-component';
const getClasses = getClassMaker(BLOCK);

type CardProps = {
  title: string;
  texts: string[];
  itemList?: {
    title: string;
    text: string;
  }[];
  isStyleless?: boolean;
  skills?: string[];
};

export default function Card({
  title,
  texts,
  itemList = undefined,
  isStyleless = false,
  skills = undefined,
}: CardProps) {
  const renderSkills = () =>
    skills &&
    skills.map((skill) => {
      const key = uuid();
      return <span key={key}>{skill}</span>;
    });

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
          <div className={getClasses('skills-container')}>
            <p>Skills:{renderSkills()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
