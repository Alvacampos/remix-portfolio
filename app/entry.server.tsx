import { isbot } from 'isbot';
// Use `react-dom/server.edge` (not the plain `/server` or `.browser`).
// React 19's `.browser` SSR entry calls `MessageChannel` for scheduling,
// which Cloudflare Workers doesn't expose at our compat_date; `.edge`
// ships the same Web Streams surface without the scheduler shim, and
// works in both Workers (V8) and Node 18+ (Vite SSR dev). See
// [app/react-dom-server-edge.d.ts](app/react-dom-server-edge.d.ts) for the type shim.
import { renderToReadableStream } from 'react-dom/server.edge';
import type { EntryContext, RouterContextProvider } from 'react-router';
import { ServerRouter } from 'react-router';

import { getCspNonce } from './utils/load-context';
import { NonceProvider } from './utils/nonce-context';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext: RouterContextProvider
) {
  // CSP nonce for RR's streaming hydration scripts (bootstrapScriptContent
  // + `<Scripts>` reserve blocks) and for our own inline scripts in
  // app/root.tsx. `ServerRouter` gets it via prop for the RR-emitted
  // blocks; app code reads it via `useNonce()` off the React context
  // populated by <NonceProvider>. Reading via React context (rather
  // than returning the nonce from a loader) keeps it out of the
  // client-side hydration payload — nonces must not be exfiltrable via
  // DOM inspection.
  const nonce = getCspNonce(loadContext);
  let status = responseStatusCode;
  const body = await renderToReadableStream(
    <NonceProvider nonce={nonce}>
      <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error: unknown) {
        // Log streaming rendering errors from inside the shell
        console.error(error);
        status = 500;
      },
    }
  );

  if (isbot(request.headers.get('user-agent') || '')) {
    await body.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(body, {
    headers: responseHeaders,
    status,
  });
}
