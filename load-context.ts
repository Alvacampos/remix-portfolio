// Augment the wrangler-generated Env with secret-only bindings.
// `worker-configuration.d.ts` is auto-generated from wrangler.jsonc,
// which doesn't declare secrets (they're set via `wrangler secret
// put`). Declaring them here keeps the route action typed without
// committing the secret values themselves.
declare global {
  interface Env {
    RESEND_API_KEY: string;
  }
}

// Shape of `context.cloudflare` inside a route loader/action. The
// Worker entrypoint (workers/app.ts) builds this and passes it to
// `createRequestHandler`, so both sides need to agree. Matches the
// Pages-era shape (route code reads `context.cloudflare.env.*`
// unchanged) while dropping the wrangler `PlatformProxy` type — on
// Workers we have `env` and `ctx` directly, no proxy layer.
type Cloudflare = {
  env: Env;
  ctx: ExecutionContext;
};

declare module 'react-router' {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}

export {};
