import type { Config } from '@react-router/dev/config';

// Full SSR (matches how the site rendered under Remix v2 with Single
// Fetch on). The Cloudflare Worker at workers/app.ts calls
// createRequestHandler with this app's server build.
export default {
  ssr: true,
} satisfies Config;
