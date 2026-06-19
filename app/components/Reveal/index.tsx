import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { getClassMaker } from '~/utils/utils';

const BLOCK = 'reveal-component';
const getClasses = getClassMaker(BLOCK);

type RevealProps = {
  children: ReactNode;
  /** Delay (ms) before the fade starts after intersection. Default: 0. */
  delay?: number;
  /** Force the visible state immediately, no observer. Useful in tests. */
  immediate?: boolean;
};

/**
 * IntersectionObserver-driven fade-up. The wrapped child renders hidden
 * (opacity 0, translateY 8px) until the element enters the viewport,
 * then transitions to visible over 200ms. Runs once per mount.
 *
 * Reduce-motion: the global @media (prefers-reduced-motion: reduce)
 * rule in app/styles/style.css collapses the transition to ~0ms, so
 * the component still ends up in its visible state but without
 * animating. No JS branch needed.
 */
export default function Reveal({ children, delay = 0, immediate = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      // SSR / no-IO support fallback: render visible.
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay > 0) {
              const t = window.setTimeout(() => setVisible(true), delay);
              return () => window.clearTimeout(t);
            }
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
        return undefined;
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, immediate]);

  return (
    <div ref={ref} className={getClasses('', { visible })}>
      {children}
    </div>
  );
}
