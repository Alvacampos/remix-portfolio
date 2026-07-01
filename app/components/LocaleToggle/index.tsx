import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate, useSearchParams } from 'react-router';

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
 *   1. Persist the chosen locale to a `locale` cookie (1-year expiry,
 *      SameSite=Lax) so it survives page reloads AND ships on every
 *      `<Link>` navigation — including Remix Single-Fetch `.data`
 *      calls. That's what makes the choice cross-page: pickLocale
 *      reads the cookie and resolves the same locale on every route.
 *   2. Mirror the value into localStorage as a fallback channel for
 *      the inline replay script (covers users who set the cookie on
 *      a previous visit but cleared cookies, or pre-fix sessions
 *      that only have the localStorage entry).
 *   3. Push a navigation to the same path with `?lang=<next>`. The
 *      URL search param is the highest-priority signal in pickLocale,
 *      so the next render uses the new locale immediately. Keeps the
 *      URL shareable + crawlable too — Google indexes each locale at
 *      a distinct URL.
 *   4. Mark the new active button with a transient `--popping`
 *      modifier so CSS plays a brief 1.0 → 1.08 → 1.0 scale on it —
 *      gives the click a tactile feedback beat without being noisy.
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
    // 1-year expiry; Path=/ so it ships on every route. SameSite=Lax is
    // the default but pinning it keeps the directive obvious to anyone
    // auditing why the cookie shows up cross-origin (it doesn't).
    // `document.cookie =` is the cookie-writing API even though it
    // looks like a property mutation; the react-hooks immutability
    // rule can't tell them apart, so opt out explicitly.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${STORAGE_KEY}=${next};Path=/;Max-Age=31536000;SameSite=Lax`;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode / disabled storage — cookie + URL param still apply */
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
