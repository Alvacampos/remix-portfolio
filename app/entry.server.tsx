/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { isbot } from 'isbot';
// `react-dom/server` only ships `renderToPipeableStream` (Node
// streams) in the Node ESM entry — `renderToReadableStream` (Web
// Streams) lives at `react-dom/server.edge`. React 19's browser
// SSR entry started calling `MessageChannel` for scheduling, which
// Cloudflare Workers doesn't expose at the current compat date — the
// `.edge` subpath avoids MessageChannel and works in both Workers
// (V8, no scheduler shim) and Node 18+ (Vite's SSR dev runtime).
// Under Remix v2 the Cloudflare adapter installed a shim that made
// the export available from the plain `react-dom/server` path; RR v8
// does not, so we're explicit about the subpath.
import { renderToReadableStream } from 'react-dom/server.edge';
import type { EntryContext, RouterContextProvider } from 'react-router';
import { ServerRouter } from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
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
