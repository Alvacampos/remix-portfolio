import { createContext, type RouterContextProvider } from 'react-router';

// Shape of the Cloudflare bindings we expose to route loaders/actions.
// The Worker entrypoint (workers/app.ts) creates a RouterContextProvider
// with this pair pre-set; route code reads it via `getCloudflare(context)`.
// RR v8 replaced the plain-object AppLoadContext with a typed
// RouterContextProvider — this module is the migration seam.
export type Cloudflare = {
  env: Env;
  ctx: ExecutionContext;
};

export const cloudflareContext = createContext<Cloudflare>();

// `getCloudflare(context)` in a loader/action returns the same
// `{ env, ctx }` shape route code used to read via `context.cloudflare.*`
// under RR v7. Keeps the migration diff small — instead of scattering
// `context.get(cloudflareContext)` calls, consumers keep destructuring
// `env`/`ctx` from a single call.
export function getCloudflare(context: Readonly<RouterContextProvider>): Cloudflare {
  return context.get(cloudflareContext);
}
