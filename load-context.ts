import { type PlatformProxy } from 'wrangler';

// Augment the wrangler-generated Env with secret-only bindings.
// `worker-configuration.d.ts` is auto-generated from wrangler.toml,
// which doesn't declare secrets (they're set via `wrangler pages
// secret put`). Declaring them here keeps the route action typed
// without committing the secret values themselves.
declare global {
  interface Env {
    RESEND_API_KEY: string;
  }
}

type Cloudflare = Omit<PlatformProxy<Env>, 'dispose'>;

declare module '@remix-run/cloudflare' {
  interface AppLoadContext {
    cloudflare: Cloudflare;
  }
}
