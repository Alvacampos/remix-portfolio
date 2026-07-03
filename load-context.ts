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

export {};
