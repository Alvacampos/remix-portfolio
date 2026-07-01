/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { isbot } from 'isbot';
// `react-dom/server` only ships `renderToPipeableStream` (Node
// streams) in the Node ESM entry — `renderToReadableStream` (Web
// Streams) lives at `react-dom/server.browser`. Both Cloudflare
// Workers (V8 has native Web Streams) and Node 18+ can execute the
// browser subpath, so this single import path works for the Workers
// prod runtime AND Vite's Node SSR dev runtime. Under Remix v2 the
// Cloudflare adapter installed a shim that made the export available
// from the plain `react-dom/server` path; RR v7 does not.
import { renderToReadableStream } from 'react-dom/server.browser';
import type { AppLoadContext, EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  // This is ignored so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadContext: AppLoadContext
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
