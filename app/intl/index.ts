import enUS from './en-US.json';
import esES from './es-ES.json';

export type Locale = 'en' | 'es';

const MESSAGES: Record<Locale, Record<string, string>> = {
  en: enUS,
  es: esES,
};

const SUPPORTED_LOCALES: Locale[] = ['en', 'es'];
const DEFAULT_LOCALE: Locale = 'en';

/**
 * Pick the best supported locale for a request, in priority order:
 *   1. `?lang=` URL search param — explicit user override, also crawlable
 *      by search engines so each locale has a distinct indexable URL.
 *   2. `Accept-Language` request header — browser default for new visitors.
 *
 * The toggle component layers a localStorage-backed default on top of (1):
 * on click it sets `?lang=` AND localStorage; on subsequent renders the
 * client redirects to `?lang=` if localStorage holds a different locale.
 * That client-side redirect lives in the toggle, not here, so this stays
 * SSR-pure.
 *
 * Spec note: we only honour the language part (`es-AR` → `es`), which is
 * fine for a 2-locale site. If we add regional variants later (`es-MX`
 * vs `es-ES`) this should also weight by `q=` quality factors.
 */
export function pickLocale(request: Request): Locale {
  const url = new URL(request.url);
  const param = url.searchParams.get('lang')?.toLowerCase();
  if (param && SUPPORTED_LOCALES.includes(param as Locale)) {
    return param as Locale;
  }

  const header = request.headers.get('accept-language');
  if (!header) return DEFAULT_LOCALE;

  const tags = header
    .split(',')
    .map((part) => part.split(';')[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const tag of tags) {
    const lang = tag.split('-')[0] as Locale;
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
  }

  return DEFAULT_LOCALE;
}

export function messagesFor(locale: Locale): Record<string, string> {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
}

export { DEFAULT_LOCALE, SUPPORTED_LOCALES };
