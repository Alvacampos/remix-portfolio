import type { Config } from '@react-router/dev/config';

// Full SSR — every route renders server-side and hydrates on the client.
// The Cloudflare Worker at workers/app.ts calls createRequestHandler
// with this app's server build.
export default {
  ssr: true,
} satisfies Config;
