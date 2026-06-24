import { describe, expect, it } from 'vitest';

import { pickLocale } from './index';

function makeRequest(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
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
});
