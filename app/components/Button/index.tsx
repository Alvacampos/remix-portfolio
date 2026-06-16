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
  children?: ReactNode;
  // Forwarded to @remix-run/react's <Link prefetch> when `url` is set.
  // 'intent' pre-warms the route on hover/focus — sensible default for
  // primary nav.
  prefetch?: 'intent' | 'render' | 'none' | 'viewport';
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
  prefetch = undefined,
}: ButtonProps) {
  return (
    <ConditionalLink
      to={url}
      condition={!!url}
      label={label}
      className={getClasses('link-wrapper')}
      prefetch={prefetch}
    >
      {/* eslint-disable-next-line react/button-has-type */}
      <button className={getClasses(className)} onClick={handleClick} type={btnType}>
        {LeftIcon && <LeftIcon className={getClasses('icon', 'left')} />}
        {children}
        {label && label}
        {RightIcon && <RightIcon className={getClasses('icon', 'right')} />}
      </button>
    </ConditionalLink>
  );
}
