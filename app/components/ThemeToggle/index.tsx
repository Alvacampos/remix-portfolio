import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { Moon, Sun } from '~/components/icons';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'theme-toggle';
const getClasses = getClassMaker(BLOCK);

type Theme = 'light' | 'dark';

/**
 * Read the current theme from <html data-theme>. Set on first paint by
 * the inline init script in app/root.tsx, so this is always present
 * after hydration.
 */
function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/**
 * Two-state theme toggle. Persists the user's choice in localStorage
 * under `theme`, applies it via `<html data-theme>`, and updates the
 * button icon. Initial render emits a placeholder so the SSR HTML is
 * stable; the real state lands on hydration. The placeholder is
 * visually identical to the dark state — flickers are limited to a
 * single icon swap if the user is in light mode.
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
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode / storage disabled — toggle still works for the session */
    }
  }

  // SSR + first hydration render: render the moon (dark default) and
  // disable visual interactivity until mounted to avoid a hydration
  // mismatch warning if the user's persisted theme differs from the SSR
  // default.
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
