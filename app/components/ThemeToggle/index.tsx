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
 * Two-state theme toggle. SSR renders the moon icon (dark default);
 * after hydration the real persisted theme takes over. Persists user
 * override in localStorage.theme so it survives reloads. Honours
 * OS-level prefers-color-scheme via the init script when no override
 * exists.
 */
export default function ThemeToggle() {
  const { formatMessage } = useIntl();
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    if (next === 'dark') {
      // Keep <html> attribute-free in dark so the default :root
      // cascade applies — keeps DevTools tidy.
      delete document.documentElement.dataset.theme;
      document.documentElement.dataset.theme = next;
    }
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode / disabled storage — toggle still works for the session */
    }
  }

  const isLight = mounted && theme === 'light';
  const label = formatMessage({
    id: isLight ? 'THEME_TOGGLE_TO_DARK' : 'THEME_TOGGLE_TO_LIGHT',
  });

  return (
    <button
      type="button"
      className={getClasses()}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className={getClasses('icon')}>{isLight ? <Moon /> : <Sun />}</span>
    </button>
  );
}
