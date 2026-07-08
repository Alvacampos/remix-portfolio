import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigation } from 'react-router';

import { getClassMaker } from '~/utils/utils';

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
//
// The skeleton registry (all 8 route skeletons + primitives, ~1.5 KB gz)
// only imports when a nav exceeds the delay threshold — the vast
// majority of prefetched/warm navs never touch it.
export default function PendingBoundary({ children }: Props) {
  const { formatMessage } = useIntl();
  const navigation = useNavigation();

  const isPendingNav = navigation.state === 'loading' && navigation.formMethod === undefined;
  const targetPathname = navigation.location?.pathname;

  const [skeleton, setSkeleton] = useState<React.ReactElement | null>(null);
  useEffect(() => {
    if (!isPendingNav || !targetPathname) return undefined;
    let cancelled = false;
    const id = setTimeout(async () => {
      const { renderSkeleton } = await import('./registry');
      if (!cancelled) setSkeleton(renderSkeleton(targetPathname));
    }, SKELETON_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setSkeleton(null);
    };
  }, [isPendingNav, targetPathname]);

  if (skeleton) {
    return (
      <div
        className={getClasses()}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={formatMessage({ id: 'LOADING_ROUTE' })}
      >
        {skeleton}
      </div>
    );
  }

  return <>{children}</>;
}
