import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { Moon, Sun } from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'theme-toggle';
const getClasses = getClassMaker(BLOCK);

type Theme = 'light' | 'dark';

/**
 * Read the current theme from <html data-theme>. The inline init
 * script in app/root.tsx sets this before paint, so it's reliable
 * after hydration.
 */
function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/**
 * Sliding sun/moon theme toggle. SSR renders in the dark position;
 * after hydration the real persisted theme takes over. Persists in
 * localStorage.theme; honours OS-level prefers-color-scheme via the
 * inline init script when no override exists.
 *
 * Visual: a pill with a sun icon on the left, moon on the right, and
 * a green knob that slides under the active icon. Knob position is
 * driven entirely by the `--moon` modifier — no per-state inline
 * styles, so the CSS transition just works.
 */
export default function ThemeToggle() {
  const { formatMessage } = useIntl();
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // setState-in-effect is intentional: SSR can't see localStorage or
  // the inline theme-init script's <html data-theme>, so first render
  // returns the 'dark' default and the effect hydrates to the actual
  // saved theme on mount. The `mounted` flag also gates the CSS
  // modifier — without it, the knob would render at the SSR position
  // and animate to the hydrated one on first paint (visible flash).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode / disabled storage — toggle still works for the session */
    }
  }

  const isDark = !mounted || theme === 'dark';
  const label = formatMessage({
    id: isDark ? 'THEME_TOGGLE_TO_LIGHT' : 'THEME_TOGGLE_TO_DARK',
  });

  return (
    <button
      type="button"
      className={`${getClasses()} ${isDark ? getClasses('', 'moon') : getClasses('', 'sun')}`}
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {/* Two icons painted at fixed positions; the sliding knob
       * underneath highlights the active one. Order is sun→moon
       * left→right so the knob's transform is `translateX(0)` for
       * sun, `translateX(100%)` for moon — natural reading order. */}
      <span className={`${getClasses('icon')} ${getClasses('icon', 'sun')}`} aria-hidden="true">
        <Sun />
      </span>
      <span className={`${getClasses('icon')} ${getClasses('icon', 'moon')}`} aria-hidden="true">
        <Moon />
      </span>
      <span className={getClasses('knob')} aria-hidden="true" />
    </button>
  );
}
