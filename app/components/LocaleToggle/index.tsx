import { useNavigate, useSearchParams } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { type Locale, SUPPORTED_LOCALES } from '~/intl';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'locale-toggle';
const getClasses = getClassMaker(BLOCK);

const STORAGE_KEY = 'locale';
// Pop animation duration. Has to match `--pop-duration` in style.css —
// the React-side timeout drops the modifier just after the CSS keyframe
// finishes so the next click can re-trigger it.
const POP_MS = 240;

type Props = {
  current: Locale;
};

/**
 * EN | ES pill that swaps the active site locale.
 *
 * Click flow:
 *   1. Persist the chosen locale to localStorage so it survives page
 *      reloads even when the user lands on a URL without `?lang=`.
 *   2. Push a navigation to the same path with `?lang=<next>`. The
 *      Remix root loader honours the search-param first via
 *      pickLocale, so the next render uses the new locale and
 *      `<html lang>` flips immediately. URL is shareable + crawlable.
 *   3. Mark the new active button with a transient `--popping`
 *      modifier so CSS plays a brief 1.0 → 1.08 → 1.0 scale on it —
 *      gives the click a tactile feedback beat without being noisy.
 *
 * No localStorage read here — the loader stays SSR-pure and only
 * looks at the URL and the request header. The user's saved choice
 * is replayed by the small `<script>` in app/root.tsx that, on first
 * paint, redirects to `?lang=<saved>` if localStorage holds a locale
 * different from the rendered one.
 */
export default function LocaleToggle({ current }: Props) {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [popping, setPopping] = useState<Locale | null>(null);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear pending pop timer if the component unmounts mid-animation.
  useEffect(
    () => () => {
      if (popTimer.current) clearTimeout(popTimer.current);
    },
    []
  );

  function selectLocale(next: Locale) {
    if (next === current) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / disabled storage — URL param still applies */
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('lang', next);
    navigate({ search: nextParams.toString() }, { replace: true });
    setPopping(next);
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPopping(null), POP_MS);
  }

  // CSS knob slides via inline `--knob-index` so the position only
  // depends on the active button's index in SUPPORTED_LOCALES — adding
  // a third locale later requires no JS change beyond the array.
  const activeIndex = SUPPORTED_LOCALES.indexOf(current);

  return (
    <div
      className={getClasses()}
      role="group"
      aria-label={formatMessage({ id: 'LOCALE_TOGGLE_LABEL' })}
      style={{ '--knob-index': activeIndex } as React.CSSProperties}
    >
      <span className={getClasses('knob')} aria-hidden="true" />
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === current;
        const isPopping = popping === locale;
        return (
          <button
            key={locale}
            type="button"
            className={[
              getClasses('button'),
              isActive ? getClasses('button', 'active') : '',
              isPopping ? getClasses('button', 'popping') : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectLocale(locale)}
            aria-pressed={isActive}
            aria-label={formatMessage(
              { id: 'LOCALE_TOGGLE_SWITCH_TO' },
              { locale: locale.toUpperCase() }
            )}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
