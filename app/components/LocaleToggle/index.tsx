import { useNavigate, useSearchParams } from '@remix-run/react';
import { useIntl } from 'react-intl';

import { type Locale, SUPPORTED_LOCALES } from '~/intl';
import { getClassMaker } from '~/utils/utils';

const BLOCK = 'locale-toggle';
const getClasses = getClassMaker(BLOCK);

const STORAGE_KEY = 'locale';

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
  }

  return (
    <div
      className={getClasses()}
      role="group"
      aria-label={formatMessage({ id: 'LOCALE_TOGGLE_LABEL' })}
    >
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === current;
        return (
          <button
            key={locale}
            type="button"
            className={`${getClasses('button')} ${isActive ? getClasses('button', 'active') : ''}`}
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
