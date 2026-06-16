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
 * Pick the best supported locale from a request's `Accept-Language` header.
 * Falls back to English if the header is missing or names no supported tag.
 *
 * Spec note: we only honour the language part (`es-AR` → `es`), which is fine
 * for a 2-locale site. If we add regional variants later (`es-MX` vs `es-ES`)
 * this should also weight by `q=` quality factors.
 */
export function pickLocale(request: Request): Locale {
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
