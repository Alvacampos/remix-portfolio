import { createContext, type ReactNode, useContext } from 'react';

// React (not react-router) context that carries the per-request CSP
// nonce through the SSR render tree. Used by `app/root.tsx`'s Layout
// to attribute every inline `<script>` it emits (theme init, locale
// replay, two JSON-LD blocks, plus RR's own `<Scripts>` /
// `<ScrollRestoration>` / `<ServerRouter>` hydration blocks).
//
// Why not just read the nonce from the root loader (as we did in the
// security PR)? Because RR serializes loader data into a client-side
// hydration script (`window.__reactRouterContext = {...}`). The nonce
// would end up plain-text in the DOM — defeating the CSS-attr-
// selector / DOM-inspection attack that browsers specifically hide
// nonces from (they surface as `.nonce` on `HTMLScriptElement` but
// return `""` from `getAttribute('nonce')` post-load). Reading it
// through a React context that's never serialized keeps the value on
// the server side only; the client just receives already-attributed
// `<script nonce="…">` tags, and after paint the browser strips the
// visible attribute.
//
// Populated by `app/entry.server.tsx` at the top of the SSR tree.
// Defaults to '' so:
//   1. Unit tests using the memory-router harness don't need to wrap.
//   2. The Layout renders safely inside the error boundary (before
//      the loader runs) — nonce-less inline scripts get blocked, but
//      the boundary is server-rendered HTML with no client JS needs.
const NonceContext = createContext<string>('');

export function NonceProvider({ nonce, children }: { nonce: string; children: ReactNode }) {
  return <NonceContext value={nonce}>{children}</NonceContext>;
}

export function useNonce(): string {
  return useContext(NonceContext);
}
