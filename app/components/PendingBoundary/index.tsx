import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigation } from 'react-router';

import { getClassMaker } from '~/utils/utils';

import { renderSkeleton } from './registry';

// Show the skeleton only if the loader hasn't resolved after this many
// ms. Warm/prefetched navigations (NavBar uses `prefetch="intent"`)
// resolve in tens of ms and would otherwise flash a skeleton pointlessly.
// Same tolerance as GitHub's client-side nav shim.
const SKELETON_DELAY_MS = 150;

const BLOCK = 'pending-boundary';
const getClasses = getClassMaker(BLOCK);

type Props = {
  children: React.ReactNode;
};

// Wraps <Outlet />. When a client-side navigation is in flight and
// exceeds SKELETON_DELAY_MS, swaps the outgoing route for a route-scoped
// skeleton picked by the target pathname. Prevents the "outgoing page
// stays visible" flash on cold nav and gives a stable, layout-preserving
// placeholder while the loader resolves.
export default function PendingBoundary({ children }: Props) {
  const { formatMessage } = useIntl();
  const navigation = useNavigation();

  // Only treat this as pending if we're actually navigating to a new
  // location (not just revalidating on a form submission — form actions
  // go through `state === 'submitting'` first, then 'loading' with a
  // `formMethod` set; we don't want to swap in a skeleton mid-form).
  const isPendingNav = navigation.state === 'loading' && navigation.formMethod === undefined;
  const targetPathname = navigation.location?.pathname;

  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!isPendingNav) return undefined;
    const id = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    return () => {
      clearTimeout(id);
      setShowSkeleton(false);
    };
  }, [isPendingNav]);

  if (showSkeleton && targetPathname) {
    return (
      <div
        className={getClasses()}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={formatMessage({ id: 'LOADING_ROUTE' })}
      >
        {renderSkeleton(targetPathname)}
      </div>
    );
  }

  return <>{children}</>;
}
