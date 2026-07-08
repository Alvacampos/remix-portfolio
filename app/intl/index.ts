import enUS from './en-US.json';
import esES from './es-ES.json';

export type Locale = 'en' | 'es';

const MESSAGES: Record<Locale, Record<string, string>> = {
  en: enUS,
  es: esES,
};

const SUPPORTED_LOCALES: Locale[] = ['en', 'es'];
const DEFAULT_LOCALE: Locale = 'en';

const LOCALE_COOKIE = 'locale';

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      // Malformed %-escapes throw URIError; treat as an absent cookie
      // rather than 500-ing the whole SSR pass.
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Pick the best supported locale for a request, in priority order:
 *   1. `?lang=` URL search param — explicit user override, also crawlable
 *      by search engines so each locale has a distinct indexable URL.
 *   2. `locale` cookie — set by LocaleToggle on click. The cookie ships
 *      on every request (full-page nav AND Single-Fetch `.data` calls),
 *      so internal `<Link>` navigations preserve the chosen locale
 *      without needing `?lang=` propagated through every URL.
 *   3. `Accept-Language` request header — browser default for new visitors.
 *
 * The toggle also writes localStorage so a tiny <head> script can replay
 * the saved choice into a cookie on the very first request from a
 * pre-cookie session (visitors who picked Spanish before this fix
 * shipped). Once the cookie lands, step (2) handles every subsequent nav.
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

  const cookie = readCookie(request, LOCALE_COOKIE)?.toLowerCase();
  if (cookie && SUPPORTED_LOCALES.includes(cookie as Locale)) {
    return cookie as Locale;
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

export { SUPPORTED_LOCALES };
