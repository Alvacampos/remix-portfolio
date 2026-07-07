import { createContext, type RouterContextProvider } from 'react-router';

// Cloudflare bindings surfaced to route loaders/actions.
// `workers/app.ts` creates a RouterContextProvider with this pair
// pre-set; route code reads it via `getCloudflare(context)`.
export type Cloudflare = {
  env: Env;
  ctx: ExecutionContext;
};

export const cloudflareContext = createContext<Cloudflare>();

// Read `{ env, ctx }` off the RouterContextProvider that
// `workers/app.ts` populates.
export function getCloudflare(context: Readonly<RouterContextProvider>): Cloudflare {
  return context.get(cloudflareContext);
}
