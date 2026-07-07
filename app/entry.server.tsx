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

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  // Retained in the signature for the RR handler contract but unused here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: RouterContextProvider
) {
  let status = responseStatusCode;
  const body = await renderToReadableStream(
    <ServerRouter context={reactRouterContext} url={request.url} />,
    {
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
