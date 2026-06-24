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
      className={`${getClasses()} ${isDark ? getClasses('', 'dark') : getClasses('', 'light')}`}
      onClick={toggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {/* Both icons are stacked at the same spot; CSS rotates the
       * outgoing icon out and the incoming one in via the parent's
       * `--dark` / `--light` modifiers. Pre-mount the button has no
       * modifier and both icons sit invisible — avoids painting the
       * wrong icon SSR and then snapping after hydration. */}
      <span className={`${getClasses('icon')} ${getClasses('icon', 'sun')}`} aria-hidden="true">
        {mounted ? <Sun /> : null}
      </span>
      <span className={`${getClasses('icon')} ${getClasses('icon', 'moon')}`} aria-hidden="true">
        {mounted ? <Moon /> : null}
      </span>
    </button>
  );
}
