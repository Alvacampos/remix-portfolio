import { isbot } from 'isbot';
// `.edge` (not `/server` or `.browser`) — see docs/migrations/rr7-to-rr8.md.
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
  // CSP nonce via React context (not loader data) — see docs/security.md.
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
