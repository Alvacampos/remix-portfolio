import { RouterContextProvider } from 'react-router';
import { describe, expect, it } from 'vitest';

import { getCloudflare, getCspNonce } from './load-context';

// Regression guard: PR #266. The RR v8 migration replaced the plain-
// object AppLoadContext with a `RouterContextProvider` + `createContext`
// mechanism keyed by object identity. Because the SSR route bundle and
// the wrangler-built worker bundle each executed their own
// `createContext()` call, `.set` in the worker never matched `.get` in
// the route — the contact form 500'd in prod for four days without
// anyone noticing.
//
// Property-based passing (attach `cloudflare` / `cspNonce` directly to
// the provider instance) sidesteps the identity issue because we
// access by property NAME, not by context object identity. These tests
// pin that mechanism down.

describe('load-context handoff', () => {
  it('reads a Cloudflare payload attached as a property (not via .set)', () => {
    const context = new RouterContextProvider() as RouterContextProvider & {
      cloudflare?: { env: unknown; ctx: unknown };
    };
    const cloudflare = {
      env: { fake: true },
      ctx: { waitUntil: () => undefined },
    } as unknown as ReturnType<typeof getCloudflare>;
    context.cloudflare = cloudflare;

    expect(getCloudflare(context)).toBe(cloudflare);
  });

  it('reads the CSP nonce attached as a property', () => {
    const context = new RouterContextProvider() as RouterContextProvider & {
      cspNonce?: string;
    };
    context.cspNonce = 'abcd1234';

    expect(getCspNonce(context)).toBe('abcd1234');
  });

  it('falls back to a dev stub when Cloudflare is not populated (Vite SSR dev)', () => {
    const context = new RouterContextProvider();
    const stub = getCloudflare(context);
    // Stub exposes the same shape as prod so route code can exercise
    // its happy path in `npm run dev`.
    expect(stub.env).toBeDefined();
    expect(stub.env.RATELIMIT_KV).toBeDefined();
    expect(typeof stub.ctx.waitUntil).toBe('function');
  });

  it('returns an empty CSP nonce when the context lacks one', () => {
    const context = new RouterContextProvider();
    // Empty string disables CSP nonce matching, which is the safe
    // default in dev (Vite SSR runs it) and in unit tests.
    expect(getCspNonce(context)).toBe('');
  });
});
