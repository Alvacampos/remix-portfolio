import type { ComponentType, ReactNode } from 'react';

import { ConditionalLink } from '~/components/ConditionalWrapper';
import { getClassMaker, noop } from '~/utils/utils';

import styles from './style.css?url';

export const links = () => [{ rel: 'stylesheet', href: styles }];

const BLOCK = 'button-component';
const getClasses = getClassMaker(BLOCK);

type ButtonProps = {
  url?: string;
  className?: string;
  label?: string;
  rightIcon?: ComponentType<{ className: string }>;
  leftIcon?: ComponentType<{ className: string }>;
  btnType?: 'button' | 'submit';
  handleClick?: () => void;
  children?: ReactNode[];
};

export default function Button({
  url = undefined,
  className = '',
  label = '',
  rightIcon: RightIcon = undefined,
  leftIcon: LeftIcon = undefined,
  btnType = 'button',
  handleClick = noop,
  children = undefined,
}: ButtonProps) {
  return (
    <ConditionalLink to={url} condition={!!url} label={label} className={getClasses('link-wrapper')}>
      <button className={getClasses(className)} onClick={handleClick} type={btnType}>
        {LeftIcon && <LeftIcon className={getClasses('icon', 'left')} />}
        {children && children.map((child) => child)}
        {label && label}
        {RightIcon && <RightIcon className={getClasses('icon', 'right')} />}
      </button>
    </ConditionalLink>
  );
}
