// Catch-all splat route. Without this, unknown URLs trigger Remix's
// default 404 path which does NOT run the root loader — meaning
// `pickLocale(request)` never fires and the ErrorBoundary falls back
// to English regardless of `?lang=` / cookie / Accept-Language.
//
// The splat matches everything that no other route handles. Its
// loader throws a 404 Response immediately, which surfaces in the
// root ErrorBoundary with locale resolved correctly (the root's
// loader already ran since this splat IS a matched route).
export async function loader() {
  throw new Response('Not Found', { status: 404 });
}

export default function Splat() {
  return null;
}
