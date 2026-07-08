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

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  loadContext: RouterContextProvider
) {
  // CSP nonce for RR's streaming hydration scripts (bootstrapScriptContent
  // + `<Scripts>` reserve blocks). ServerRouter forwards this to every
  // inline script it emits so `script-src 'nonce-<val>'` matches.
  const nonce = getCspNonce(loadContext);
  let status = responseStatusCode;
  const body = await renderToReadableStream(
    <ServerRouter context={reactRouterContext} url={request.url} nonce={nonce} />,
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
