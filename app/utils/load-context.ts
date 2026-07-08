import { RouterContextProvider } from 'react-router';

// Cloudflare bindings surfaced to route loaders/actions.
// `workers/app.ts` attaches these to the RouterContextProvider as plain
// properties (`cloudflare`, `cspNonce`); route code reads them via
// `getCloudflare(context)` / `getCspNonce(context)`. See
// docs/migrations/rr7-to-rr8.md for the rationale.
type Cloudflare = {
  env: Env;
  ctx: ExecutionContext;
};

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
  if (cloudflare) return cloudflare;
  // Vite's SSR dev runtime skips `workers/app.ts`, so `cloudflare` is
  // undefined and we hand out a stub so `/contact` runs end-to-end
  // locally. In prod the Worker always populates the context — a
  // regression that skips it would silently `RESEND_API_KEY: 'dev-stub-key'`
  // its way to a 401 loop. Throw loudly instead.
  if (import.meta.env.PROD) {
    throw new Error(
      'load-context: cloudflare bindings missing on the request context. ' +
        'This should never happen in prod; check workers/app.ts for a broken wrapping.'
    );
  }
  return DEV_STUB_CLOUDFLARE;
}

// Per-request CSP nonce. Falls back to '' when the context wasn't
// populated (Vite SSR dev, prerender), which is the safe dev default.
export function getCspNonce(context: Readonly<RouterContextProvider>): string {
  return (context as AppLoadContext).cspNonce ?? '';
}

export function createAppLoadContext(
  cloudflare: Cloudflare,
  cspNonce: string
): RouterContextProvider {
  const provider = new RouterContextProvider() as RouterContextProvider & {
    cloudflare: Cloudflare;
    cspNonce: string;
  };
  provider.cloudflare = cloudflare;
  provider.cspNonce = cspNonce;
  return provider;
}
