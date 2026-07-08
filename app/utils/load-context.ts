import type { RouterContextProvider } from 'react-router';

// Cloudflare bindings surfaced to route loaders/actions.
// `workers/app.ts` attaches these to the RouterContextProvider as a
// plain `cloudflare` property before calling `requestHandler`, and
// route code reads it via `getCloudflare(context)`.
//
// Historical note: we used to use `createContext<Cloudflare>()` +
// `context.set(cloudflareContext, ...)`. That silently broke after the
// RR v8 migration because the SSR route bundle and the wrangler-built
// worker bundle each got their own `createContext()` call → two
// different context instances → `.set` in the worker never matched
// `.get` in the route (Map keyed by object identity). The whole
// contact form 500'd in production for four days without anyone
// noticing. Attaching data by property name sidesteps identity
// entirely: `provider.cloudflare` resolves the same way regardless of
// which bundle constructed the provider.
export type Cloudflare = {
  env: Env;
  ctx: ExecutionContext;
};

// Augmented RouterContextProvider shape. The base class is opaque to
// TypeScript beyond its `get`/`set` methods; we widen it here for the
// specific fields we attach in `workers/app.ts`. Consumers should read
// via the helpers below rather than reaching for the property directly.
export type AppLoadContext = Readonly<RouterContextProvider> & {
  cloudflare?: Cloudflare;
  cspNonce?: string;
};

// Dev-mode stub. The in-memory Map mimics KV.get/put/etc. just enough
// for the /contact action's rate-limit read/write to not throw. Env
// vars come from wrangler.jsonc `vars` at prod runtime; in Vite dev
// we fall back to sane placeholders so the action code can run.
const DEV_KV_MAP = new Map<string, string>();
const DEV_STUB_KV = {
  get: async (k: string) => DEV_KV_MAP.get(k) ?? null,
  put: async (k: string, v: string) => {
    DEV_KV_MAP.set(k, v);
  },
  delete: async (k: string) => {
    DEV_KV_MAP.delete(k);
  },
  list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
  getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
} as unknown as KVNamespace;

const DEV_STUB_CLOUDFLARE: Cloudflare = {
  env: {
    RATELIMIT_KV: DEV_STUB_KV,
    ASSETS: undefined,
    CONTACT_FROM: 'onboarding@resend.dev',
    CONTACT_TO: 'gonzaloralvarezcampos@gmail.com',
    RESEND_API_KEY: 'dev-stub-key',
  } as unknown as Env,
  ctx: {
    waitUntil: () => undefined,
    passThroughOnException: () => undefined,
  } as unknown as ExecutionContext,
};

export function getCloudflare(context: Readonly<RouterContextProvider>): Cloudflare {
  const cloudflare = (context as AppLoadContext).cloudflare;
  if (!cloudflare) {
    // Vite's SSR dev runtime (`npm run dev`) doesn't go through
    // `workers/app.ts`, so `cloudflare` is undefined there. Return
    // the stub above so route actions like `/contact` still exercise
    // their happy path in dev. Prod always populates this via the
    // Worker before invoking the handler.
    return DEV_STUB_CLOUDFLARE;
  }
  return cloudflare;
}

// Per-request CSP nonce. `workers/app.ts` mints a fresh random value
// per fetch and attaches it here; app/root.tsx reads it via
// `getCspNonce(...)` and passes it to `<Scripts nonce>`,
// `<ScrollRestoration nonce>`, and its own inline `<script>` tags.
// The same nonce is echoed into the response `Content-Security-Policy`
// header so `script-src 'nonce-<val>'` matches.
//
// Falls back to '' when the context wasn't populated (e.g. Vite SSR
// dev mode, prerender). Empty nonce disables CSP for that request
// which is the safe default in dev.
export function getCspNonce(context: Readonly<RouterContextProvider>): string {
  return (context as AppLoadContext).cspNonce ?? '';
}
