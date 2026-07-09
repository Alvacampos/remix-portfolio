# Security posture

The site is a public CV — no auth, no user data, no session state. The
surface is essentially: the SSR HTML, the `.data` Single-Fetch endpoints
that back client-side nav, the `/contact` action, and the static assets.
This doc records what's in place and why.

## CSP nonce

**Where.** `workers/app.ts` mints a fresh 128-bit url-safe base64 nonce
per request (`mintNonce()`), attaches it to the load context as
`context.cspNonce`, and echoes it into the
`Content-Security-Policy: script-src 'self' 'nonce-<val>'` header via
`withSecurityHeaders()`.

**Distribution to inline scripts.** `entry.server.tsx` reads it via
`getCspNonce(loadContext)`, wraps `<ServerRouter>` in
`<NonceProvider nonce={nonce}>`, and passes `nonce` to `ServerRouter`
directly. RR emits its hydration blocks with the nonce; our own inline
scripts in `app/root.tsx` (theme init, locale replay, JSON-LD) read via
`useNonce()`.

**Why React context, not loader data.** RR serializes loader data into
`window.__reactRouterContext` on hydration. A nonce returned from a
loader would land in the DOM as plain text, defeating the browser's
`getAttribute('nonce')` → `""` post-load hiding. React context that
only exists during SSR keeps the value server-side; the client just
receives already-attributed `<script nonce="…">` tags.

**`style-src 'unsafe-inline'`.** Retained because ~40 components use
inline `style={{ }}` attributes (skeleton widths, heatmap grid vars,
etc.). Hashing every inline style is impractical and the attack cost
of style-based data exfiltration on a public CV is low. Everything
else uses strict allow-lists.

**Other headers** (via `STATIC_SECURITY_HEADERS`):

- HSTS with `preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, mic, geolocation,
  interest-cohort, payment, USB, and the three motion sensors.

## `.data` rate limit

**Threat.** Single-Fetch `.data` endpoints return the destination
loader's JSON. A scraper looping every route lifts the entire CV
payload (including draft `_es` translations) faster and cleaner than
scraping rendered HTML.

**Cap.** 60/hour per hashed IP, stored in `RATELIMIT_KV`. Invisible to
real visitors; breaks `curl` in a for-loop after ~7 URLs.

**Fast-path exception.** Requests carrying all of:

- `Sec-Fetch-Site: same-origin`
- `Sec-Fetch-Dest: empty`
- `Sec-Fetch-Mode: cors`
- Same-origin `Referer`

skip the counter entirely (`isTrustedInternalNav()`). Real client-side
nav from the app matches all four; a scraper has to spoof all four to
bypass the cap — versus checking `Sec-Fetch-Site` alone which is a
one-header spoof if they read the source.

**KV key shape.** `ratelimit:data:<sha256(ip)>`. The digest keeps the
namespace from being a readable audit trail of visitors. Sentinel
`local-dev` fallback keeps the rule inert under `wrangler dev`.

## `/contact` action

**CSRF.** Origin allow-list (`https://gonzalo-alvarez-campos-cv.com`,
`http://localhost:8788`). Cross-site form posts carry a different
origin (or `null` for stripped-privacy submissions) and get rejected
with a 403.

**Honeypot.** Hidden `website` field on the form; any submission with
a non-empty value is silently accepted (200) without actually sending —
bots think they succeeded, retry rate stays flat. Field is optional in
the schema so an omitted field and an empty field are indistinguishable
from the response side (both parse as OK).

**Rate limit.** 3/hour per hashed IP via `RATELIMIT_KV`. Same hashing
strategy as `.data`; different key prefix (`ratelimit:contact:`).

**Zod validation.** Body parsed by a `z.object({...})` schema at the
top of the action; invalid submissions get a 400 with a per-field
error map.

## `RATELIMIT_KV` keys

Both rate limits share the `RATELIMIT_KV` namespace. New rate-limited
surfaces MUST add a purpose prefix so keys can't collide:

| Purpose       | Key shape                        | TTL   | Cap     |
| ------------- | -------------------------------- | ----- | ------- |
| `.data` reads | `ratelimit:data:<sha256(ip)>`    | 3600s | 60/hour |
| `/contact`    | `ratelimit:contact:<sha256(ip)>` | 3600s | 3/hour  |

Hashing uses the shared helper in [app/utils/hash-ip.ts](../app/utils/hash-ip.ts).

## SSR HTML is `Cache-Control: private`

Route loaders emit `Cache-Control: public, max-age=3600, s-maxage=86400`
so the JSON `.data` payload edge-caches. But the SSR HTML for the same
routes embeds the per-request CSP nonce on every inline `<script>` —
if a shared cache served one visitor's HTML to another, they'd share
a nonce for `max-age`, defeating the DOM-inspection hiding.

`workers/app.ts` handles this by rewriting `Cache-Control: public →
private` on HTML responses (`isHtml=true` passed to
`withSecurityHeaders`). Browsers still cache per-visitor; the edge
doesn't hold nonced HTML. The `.data` path is unaffected and stays
edge-cacheable — its payload is nonce-free.

## Static assets

`workers/app.ts` delegates a small allow-list (`/assets/`, `/fonts/`,
`/.well-known/`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`) to
`env.ASSETS.fetch()`. Everything else — including `/data/*` — falls
through to the RR handler, which has no route for it and returns 404.
This is intentional: `public/data/*.json` holds the entire CV payload
and we don't want it lifted via a public URL.

## `X-Robots-Tag: noindex` on `.data`

Applied per response inside the `.data` branch of the fetch handler.
Search engines shouldn't index the JSON hydration endpoints — the HTML
versions of the same routes are the canonical indexable surfaces.

## Inline-script inventory

Every inline `<script>` in the SSR output. New inline scripts must be
added here and given a nonce via `useNonce()`.

- **RR hydration blocks** — `<Scripts nonce>`, `<ScrollRestoration
nonce>`, `<ServerRouter nonce>`. Emitted by RR itself; pass nonce
  through the prop.
- **Theme init** (`app/root.tsx`) — reads `localStorage.theme` and
  sets `documentElement.dataset.theme` before hydration to avoid a
  light/dark flash.
- **Locale replay** (`app/root.tsx`) — reads `localStorage.locale`
  from pre-cookie sessions and writes it into a `locale` cookie so
  the next SSR request can `pickLocale()` from it.
- **JSON-LD** (`app/root.tsx`) — one `<script type="application/ld+json">`
  block carrying a `@graph` with Person + WebSite entries for
  search-engine structured-data markup.
