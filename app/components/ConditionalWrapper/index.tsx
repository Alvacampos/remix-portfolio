import type { LinkProps } from '@remix-run/react';
import { Link } from '@remix-run/react';
import type { JSX, ReactNode } from 'react';

type ConditionalWrapperProps = {
  condition: boolean;
  wrapper: (children: ReactNode) => JSX.Element;
  children: ReactNode;
};

/**
 * Conditionally wraps child elements with a given element/component
 * @param {boolean} [condition] - Boolean representing whether the condition that determines wrapping was met or not
 * @param {function} [wrapper] - Callback function specifying wrapper element/component and its behavior/props
 * @returns {JSX.Element} Wrapped children if condition was true, otherwise returns children
 */
export default function ConditionalWrapper({
  condition,
  wrapper,
  children,
}: ConditionalWrapperProps) {
  return condition ? wrapper(children) : children;
}

// overwrite 'to' property on LinkProps interface to allow it to be optional
interface ConditionalLinkProps extends Omit<LinkProps, 'to'> {
  to?: LinkProps['to'];
  condition: boolean;
}

export function ConditionalLink({ to = '#', condition, children, ...rest }: ConditionalLinkProps) {
  const wrapper = (linkChildren: ReactNode) => (
    <Link to={to} tabIndex={-1} {...rest}>
      {linkChildren}
    </Link>
  );

  return (
    <ConditionalWrapper condition={condition} wrapper={wrapper}>
      {children}
    </ConditionalWrapper>
  );
}
