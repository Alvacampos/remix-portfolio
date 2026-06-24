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
 * Compact theme toggle — single icon button that shows the icon for
 * the OPPOSITE state (sun visible while dark, moon visible while
 * light). Click flips the theme and the icon. Sized to sit beside
 * the LocaleToggle pill in the NavBar's utility row.
 *
 * SSR renders in the dark default; after hydration the persisted
 * theme takes over. Persists in localStorage.theme; honours OS-level
 * prefers-color-scheme via the inline init script in app/root.tsx.
 */
export default function ThemeToggle() {
  const { formatMessage } = useIntl();
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // setState-in-effect is intentional: SSR can't see localStorage or
  // the inline theme-init script's <html data-theme>, so first render
  // returns the 'dark' default and the effect hydrates to the actual
  // saved theme on mount. The `mounted` flag suppresses the icon
  // until we know the real value — without it the button would render
  // the dark-default icon SSR then hop to the hydrated icon on first
  // paint, which reads as a flicker.
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

  const isDark = theme === 'dark';
  const label = formatMessage({
    id: isDark ? 'THEME_TOGGLE_TO_LIGHT' : 'THEME_TOGGLE_TO_DARK',
  });

  return (
    <button
      type="button"
      className={getClasses()}
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {/* Show the icon for the action — sun = "switch to light" while
       * the user is in dark, moon = "switch to dark" while in light.
       * Hide both pre-mount so SSR doesn't paint the wrong icon and
       * then swap after hydration. */}
      <span className={getClasses('icon')} aria-hidden="true">
        {mounted ? isDark ? <Sun /> : <Moon /> : null}
      </span>
    </button>
  );
}
