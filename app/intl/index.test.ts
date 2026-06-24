import { describe, expect, it } from 'vitest';

import { pickLocale } from './index';

// `cookie` is a forbidden header per the Fetch spec, so undici's
// `new Request(...)` strips it from the init. We don't actually need
// a real Request here — pickLocale only reads `request.url` and
// `request.headers.get(name)`. A minimal shim covers both without
// fighting the spec, and lets us exercise the cookie path.
function makeRequest(url: string, headers: Record<string, string> = {}): Request {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    url,
    headers: { get: (name: string) => lower[name.toLowerCase()] ?? null },
  } as unknown as Request;
}

describe('pickLocale', () => {
  it('returns en when neither URL nor header gives a locale', () => {
    expect(pickLocale(makeRequest('https://example.com/'))).toBe('en');
  });

  it('honours `?lang=es` over Accept-Language', () => {
    const req = makeRequest('https://example.com/?lang=es', {
      'accept-language': 'en-US,en;q=0.9',
    });
    expect(pickLocale(req)).toBe('es');
  });

  it('falls back to Accept-Language when `?lang=` is unsupported', () => {
    const req = makeRequest('https://example.com/?lang=fr', {
      'accept-language': 'es-AR,es;q=0.9',
    });
    expect(pickLocale(req)).toBe('es');
  });

  it('strips region from Accept-Language tags (`es-AR` → `es`)', () => {
    const req = makeRequest('https://example.com/', {
      'accept-language': 'es-AR,en;q=0.5',
    });
    expect(pickLocale(req)).toBe('es');
  });

  it('returns the first supported tag in priority order', () => {
    const req = makeRequest('https://example.com/', {
      'accept-language': 'fr-FR,en-US;q=0.8,es;q=0.5',
    });
    expect(pickLocale(req)).toBe('en');
  });

  it('case-insensitive on the search param', () => {
    expect(pickLocale(makeRequest('https://example.com/?lang=ES'))).toBe('es');
  });

  it('reads the `locale` cookie when no `?lang=` is set', () => {
    const req = makeRequest('https://example.com/skills', {
      cookie: 'theme=dark; locale=es; other=foo',
      'accept-language': 'en-US,en;q=0.9',
    });
    expect(pickLocale(req)).toBe('es');
  });

  it('prefers `?lang=` over the cookie', () => {
    const req = makeRequest('https://example.com/?lang=en', {
      cookie: 'locale=es',
    });
    expect(pickLocale(req)).toBe('en');
  });

  it('ignores an unsupported cookie value and falls through to Accept-Language', () => {
    const req = makeRequest('https://example.com/', {
      cookie: 'locale=fr',
      'accept-language': 'es-AR,es;q=0.9',
    });
    expect(pickLocale(req)).toBe('es');
  });
});
