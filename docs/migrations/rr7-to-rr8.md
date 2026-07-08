# React Router v7 → v8 migration notes

The v7 → v8 bump was mostly a rename sweep (`MetaArgs.data` → `.loaderData`)
plus one substantive shape change: the load-context handoff. This doc
records the shape change, the failure mode it produced, and the pattern
that replaced it — plus two related bits (nonce plumbing, SSR entry
subpath) that landed in the same sweep.

## Load-context: property attach, not `RouterContext.set`

**Before (RR v7).** `getLoadContext` in `workers/app.ts` returned a
plain object; RR passed it verbatim to `loader({ context })`.

**Intermediate (early v8 attempt).** RR v8 replaced the plain-object
handoff with `RouterContextProvider` + typed `RouterContext<T>` keys:

```ts
export const cloudflareContext = createContext<Cloudflare>();
// worker:
const provider = new RouterContextProvider();
provider.set(cloudflareContext, { env, ctx });
// route:
const { env } = context.get(cloudflareContext);
```

**Why it broke.** The SSR route bundle (`build/server/index.js`) and
the wrangler-built worker bundle each call `createContext()` on their
own — Vite's dep-optimizer doesn't hoist the module identity across
bundles. Two `createContext()` calls → two distinct context instances.
`RouterContextProvider` keys them by object identity, so `.set` in the
worker never matched `.get` in the route. The `/contact` action 500'd
in production for four days before anyone noticed.

**Fix.** Attach the payload as a plain property on the provider and
read it back by property name:

```ts
// worker (workers/app.ts)
const context = createAppLoadContext({ env, ctx }, nonce);

// helper (app/utils/load-context.ts)
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

export function getCloudflare(context: Readonly<RouterContextProvider>) {
  return (context as AppLoadContext).cloudflare ?? DEV_STUB_CLOUDFLARE;
}
```

Property names are strings — identical across bundles by construction —
so the handoff works regardless of which bundle instantiated the
provider. The type cast lives inside `createAppLoadContext`; call sites
just receive a typed `RouterContextProvider`.

## CSP nonce: React context, not loader data

We mint a fresh CSP nonce per request in `workers/app.ts` and need to
attribute every inline `<script>` the SSR render emits (RR's hydration
blocks + our own theme-init / locale-replay / JSON-LD scripts).

**Wrong.** Return `nonce` from the root loader.

Loader return values get serialized into `window.__reactRouterContext`
on the client — the nonce lands in the DOM as plain text. That defeats
the browser's `getAttribute('nonce')` → `""` post-load hiding: an
attacker with DOM-inspection access (XSS-adjacent, extension, screen
reader) can lift the value and inject a matching `<script nonce="...">`.

**Right.** Pass nonce through a React context that's only alive during
SSR:

- Worker mints nonce, attaches to `RouterContextProvider` as
  `context.cspNonce`.
- `entry.server.tsx` reads `getCspNonce(loadContext)` and wraps
  `<ServerRouter>` in `<NonceProvider nonce={nonce}>`.
- Layout / any component that emits inline scripts reads via
  `useNonce()`.
- Nothing round-trips through loader data, so nothing lands in the
  hydration payload.

Post-hydration the browser strips the visible `nonce` attribute
automatically (`.nonce` remains readable via the DOM property, but
that's script-execution scope, not inspection scope).

## SSR entry: `react-dom/server.edge`

`entry.server.tsx` imports from `react-dom/server.edge`, not the plain
`react-dom/server` or `.browser`. React 19's `.browser` SSR path uses
`MessageChannel` for scheduling; Cloudflare Workers doesn't expose it
at our `compatibility_date`, so `wrangler dev` throws
`MessageChannel is not defined`. The `.edge` subpath ships the Web
Streams API without the scheduler shim and works in both Workers (V8)
and Node 18+ (Vite SSR dev). Types come from
[app/react-dom-server-edge.d.ts](../../app/react-dom-server-edge.d.ts).

## Response-headers propagation

RR v8's Single Fetch aggregates loader responses across matched routes.
`data(payload, { headers })` alone no longer surfaces the response
headers — the aggregating parent has to opt in per route:

```ts
export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders;
}
```

Currently on `/skills` (1h cache + `Vary: Accept-Language, Cookie`).
Any new route that needs edge-cache behaviour needs this export.
