# Remix v2 → React Router v7 migration runbook

> Executable playbook for the migration documented in TECH-DEBT.md as Bundle 4 / T9. Currently **parked** — see TECH-DEBT.md for the deferral rationale. When unparked, work through this file linearly.
>
> **Snapshot:** Written 2026-06-30 against `react-router@7.18.1`. Re-verify version pins against current latest before starting; the codemod template's pins were stale by ~10 minor versions when first run.
>
> **Safety net:** `remix-version-backup` branch lives on origin at the last known-good Remix v2 SHA. If anything in the migration causes prod issues, the rollback is "flip the DNS back to the Pages project and reset main to that SHA" — see the [Rollback procedure](#rollback-procedure) at the bottom.

---

## 0. Prerequisites

Before opening any PR:

- [ ] Latest `main` pulled locally; clean working tree.
- [ ] Backup branch `remix-version-backup` still exists on origin (verify with `git ls-remote --heads origin remix-version-backup`).
- [ ] You have a calm 2-3 hour block. Don't start this during the workday or before an interview.
- [ ] Resend domain verification status checked — the contact form's `from: onboarding@resend.dev` sandbox is fine to keep; if you've moved to a custom domain, double-check it survives the deploy change.
- [ ] CF dashboard access ready in another tab for the DNS flip later.

**Decision before starting:** the original plan was 3 PRs (codemod, Workers cutover, type cleanup). The Bundle 4 investigation showed PRs 1 + 2 effectively merge because the codemod can't produce a working CF Pages bridge (`@react-router/cloudflare-pages` doesn't exist on npm). **Default to one combined PR** (codemod + Workers cutover) followed by a small type-cleanup PR.

---

## 1. Scope summary

**Files touched: ~25 source + ~10 config = ~35 total.** Confirmed by `grep -rln "@remix-run/" app/ test/ tests/ .storybook/ functions/ load-context.ts vite.config.ts package.json` on 2026-06-30.

| Category              | Files                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App entries**       | `app/entry.client.tsx`, `app/entry.server.tsx`, `app/root.tsx`                                                                                     |
| **Routes** (7)        | `app/routes/_index.tsx`, `app/routes/contact._index/index.tsx`, `app/routes/{education,projects,skills}.{$slug,$uuid,_index}/index.tsx`            |
| **Components** (3)    | `app/components/{LocaleToggle,NavBar,Timeline}/index.tsx`                                                                                          |
| **Test setup** (2)    | `test/test-utils.tsx`, `.storybook/preview.tsx`                                                                                                    |
| **Tooling**           | `vite.config.ts`, `package.json`, `tsconfig.json`, `app/single-fetch.d.ts` (delete), `load-context.ts`                                             |
| **New files**         | `react-router.config.ts`, `app/routes.ts`, `workers/app.ts`                                                                                        |
| **Cloudflare config** | `wrangler.toml` → `wrangler.jsonc`, `public/_routes.json` + `public/_headers` (delete, port into wrangler.jsonc), `functions/[[path]].ts` (delete) |
| **CI**                | `.github/workflows/ci.yml` (one step rewrite), `.github/workflows/regen-baselines.yml` (no change expected)                                        |
| **Docs**              | `AGENTS.md`, `README.md`, `TECH-DEBT.md`                                                                                                           |

---

## 2. Phase A — Codemod + framework swap (combined PR)

### A1. Branch + codemod

```sh
git checkout main && git pull
git checkout -b chore/rr7-migration

# Codemod handles imports + a few config files. It WILL produce a
# broken package.json (see A2). Don't trust the resulting tree
# without manual review.
npx codemod@latest remix/2/react-router/upgrade
```

Review the diff (`git diff --stat`) — you should see ~20 modified files.

### A2. Fix `package.json` (the codemod gets this wrong)

The codemod produces a `package.json` with several issues. **Do not run `npm install` until these are fixed:**

```diff
- "build": "NODE_ENV=production remix vite:build",
+ "build": "NODE_ENV=production react-router build",

  "dev": "react-router dev",        # codemod fixes this correctly

- "deploy": "npm run build && wrangler pages deploy",
+ "deploy": "npm run build && wrangler deploy",

- "start": "wrangler pages dev ./build/client",
+ "start": "wrangler dev",

- "preview": "npm run build && wrangler pages dev",
+ "preview": "npm run build && wrangler dev",

  "dependencies": {
-   "@remix-run/cloudflare": "^2.17.5",
-   "@remix-run/cloudflare-pages": "^2.17.5",
-   "@remix-run/react": "^2.17.5",
+   "@react-router/cloudflare": "^7.18.1",
+   "react-router": "^7.18.1",
    ...
-   "@react-router/cloudflare-pages": "^7.0.0",   # DELETE — package doesn't exist on npm
  }

- "overrides": {
-   "@remix-run/dev": {
-     "wrangler": "$wrangler"
-   }
- },

  "devDependencies": {
-   "@remix-run/dev": "^2.17.5",
+   "@react-router/dev": "^7.18.1",
-   "react-router-dom": "6.30.4",      # DELETE — finally retires the T15-era workaround
  }
```

Bump version pins to current `^7.x` latest (`npm view react-router version` to confirm — was 7.18.1 at time of writing).

### A3. Strip future flags from `vite.config.ts`

The codemod leaves the `future:` block in place. Single Fetch is the default in v7; the flags are no-ops or deprecated. Replace `vite.config.ts` plugin block:

```diff
  plugins: [
-   remixCloudflareDevProxy(),
-   reactRouter({
-     future: {
-       v3_fetcherPersist: true,
-       v3_relativeSplatPath: true,
-       v3_throwAbortReason: true,
-       v3_singleFetch: true,
-       v3_lazyRouteDiscovery: true,
-     },
-   }),
+   reactRouter(),
    tsconfigPaths(),
  ],
```

Also remove the `cloudflareDevProxyVitePlugin as remixCloudflareDevProxy` import — RR v7 doesn't ship that plugin under the same name. Local dev for Cloudflare bindings now uses `wrangler dev` (which loads `.dev.vars`) instead of the Vite proxy.

### A4. Create `react-router.config.ts`

```ts
import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
} satisfies Config;
```

### A5. Create `app/routes.ts`

Tells RR v7 to use flat-route discovery on `app/routes/`:

```ts
import { flatRoutes } from '@react-router/fs-routes';
import { type RouteConfig } from '@react-router/dev/routes';

export default flatRoutes() satisfies RouteConfig;
```

Existing route directory names (`skills.$uuid/`, `contact._index/`, `_index.tsx`, etc.) work unchanged.

### A6. Delete `app/single-fetch.d.ts`

Single Fetch is the default; the augmentation file is obsolete. Just remove it.

### A7. Verify route file imports

The codemod rewrites `from '@remix-run/cloudflare'` → `from 'react-router'` and `from '@remix-run/react'` → `from 'react-router'`. Spot-check a few route files. Specifically watch for:

- `LoaderFunctionArgs`, `ActionFunctionArgs`, `MetaFunction` → all now from `'react-router'`
- `data` helper → from `'react-router'` (was `@remix-run/cloudflare`)
- `Link`, `useLoaderData`, `useNavigation`, etc. → all from `'react-router'`

If any file still imports from `@remix-run/*`, the codemod missed it — fix manually.

### A8. Update `app/entry.client.tsx` and `app/entry.server.tsx`

Codemod renames components but verify:

- `RemixBrowser` → `HydratedRouter` (from `'react-router/dom'`)
- `RemixServer` → `ServerRouter` (from `'react-router'`)
- `EntryContext` type → from `'react-router'`

### A9. Update `app/root.tsx`

Codemod should handle the import. Manually verify:

- `useRouteLoaderData<LayoutData>('root')` API survives — the typing is the same
- `Links`, `Meta`, `Outlet`, `Scripts`, `ScrollRestoration` all import from `'react-router'`
- `isRouteErrorResponse`, `useRouteError` — same package

### A10. Update test setup

- `test/test-utils.tsx` — replace `react-router-dom` with `react-router` (the `createMemoryRouter`, `RouterProvider` exports moved into the unified package)
- `.storybook/preview.tsx` — same swap

### A11. Update `load-context.ts`

The adapter import changes:

```diff
- import { type PlatformProxy } from 'wrangler';
+ import { type PlatformProxy } from 'wrangler';   // unchanged
+
- declare module '@remix-run/cloudflare' {
+ declare module 'react-router' {
    interface AppLoadContext {
      cloudflare: Cloudflare;
    }
  }
```

The `Env` declaration block stays as-is.

---

## 3. Phase B — Cloudflare Pages → Workers cutover

This is the riskier half. **Read the [CF Pages → Workers migration docs](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) first** — they're more authoritative than this runbook.

### B1. Delete the Pages Function

```sh
git rm functions/[[path]].ts
rmdir functions
```

### B2. Create `workers/app.ts`

```ts
import { createRequestHandler } from '@react-router/cloudflare';
// @ts-expect-error - generated by `react-router build`
import * as build from '../build/server';

export default {
  fetch: createRequestHandler(build),
} satisfies ExportedHandler<Env>;
```

Note: the build output path may shift to `build/server/index.js` depending on the RR v7 build config — verify with `npm run build` and a `find build -name '*.js'`.

### B3. Convert `wrangler.toml` → `wrangler.jsonc`

Workers + Static Assets uses JSON config (with comments). Delete `wrangler.toml`, create `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "gonzalo-alvarez-campos-cv",
  "compatibility_date": "2024-07-18",
  "main": "./workers/app.ts",
  "assets": {
    "directory": "./build/client",
    "binding": "ASSETS",
    "run_worker_first": true,
    "headers": "./public/_headers",
    "redirects": "./public/_redirects",
  },
  "observability": {
    "enabled": true,
  },
  "vars": {
    "CONTACT_FROM": "onboarding@resend.dev",
    "CONTACT_TO": "gonzaloralvarezcampos@gmail.com",
  },
  "kv_namespaces": [
    {
      "binding": "RATELIMIT_KV",
      "id": "59ab728758e24f2a91706b8b502ad72a",
      "preview_id": "edf739a3760848b7a696cec78f21eca0",
    },
  ],
}
```

`run_worker_first: true` is the critical bit — without it, requests for `/` would short-circuit to a static `index.html` (which doesn't exist for an SSR app).

### B4. Port `public/_routes.json` semantics

Pages used `_routes.json` to declare which paths invoke the Function. Workers + Static Assets uses `run_worker_first: true` + Wrangler's request-routing rules. The exclusions in `_routes.json` (`/favicon.ico`, `/assets/*`, `/fonts/*`, `/robots.txt`, `/sitemap.xml`, `/.well-known/*`) are now handled automatically — Wrangler serves any file matching a path in `assets.directory` as static, and falls through to the Worker for everything else.

**Verify:** after deploy, `curl -I https://<workers-dev-url>/data/skills.json` should 404 (the file isn't in `build/client/`, so neither static nor Worker handles it — which is the desired behaviour).

`public/_routes.json` can be deleted.

### B5. Port `public/_headers`

The `assets.headers` key in `wrangler.jsonc` points at the existing `public/_headers` file — no port needed, just leave the file in place. **Verify with `curl -I` after deploy:**

- `https://<url>/assets/img/me.v3.webp` → `Cache-Control: public, max-age=31536000, immutable`
- `https://<url>/fonts/roboto/...` → `Cache-Control: public, max-age=31536000, immutable`

### B6. Verify the `/skills` route 1-hour cache

The Remix loader on `/skills` sets `Cache-Control: public, max-age=3600` + `Vary: Accept-Language, Cookie`. This is response-level (set by the loader), not asset-level, so it works the same on Workers. **No config change needed**, but verify with:

```sh
curl -I https://<workers-dev-url>/skills
# Expect: Cache-Control: public, max-age=3600
# Expect: Vary: Accept-Language, Cookie
```

### B7. Update CI

`.github/workflows/ci.yml` step at line ~133 currently runs `wrangler pages dev`. Replace with `wrangler dev`:

```diff
- npx wrangler pages dev ./build/client --port 8788 > wrangler.log 2>&1 &
+ npx wrangler dev --port 8788 > wrangler.log 2>&1 &
```

The Lighthouse step that depends on the preview server stays the same.

`.github/workflows/regen-baselines.yml` doesn't use wrangler, so no change.

### B8. Re-set secrets on the Worker

This is the easy-to-forget step. The `RESEND_API_KEY` secret was set on the **Pages** project; it doesn't auto-transfer:

```sh
npx wrangler secret put RESEND_API_KEY
```

Paste the same key. The new command (without `pages` and without `--project-name`) targets the Worker.

### B9. Update docs

- `AGENTS.md` §10 (Cloudflare Pages section) — rewrite to describe the Workers + Static Assets setup
- `README.md` — update the "Cloudflare Pages deployment" bullet to "Cloudflare Workers + Static Assets"
- Anywhere else that says "Pages Function" or `functions/[[path]].ts`

---

## 4. Phase C — Type-system cleanup (separate PR, low-risk)

Optional but recommended. Migrate `useLoaderData<typeof loader>()` to the generated-types pattern so the type system doesn't lie about Single Fetch's preserved `Date` / `Map` / `undefined`:

```diff
- import type { LoaderFunctionArgs } from 'react-router';
+ import type { Route } from './+types/<route-name>';

- export async function loader({ params, request }: LoaderFunctionArgs) {
+ export async function loader({ params, request }: Route.LoaderArgs) {

- export default function MyRoute() {
-   const data = useLoaderData<typeof loader>();
+ export default function MyRoute({ loaderData }: Route.ComponentProps) {
+   const data = loaderData;
```

Steps:

- Add `.react-router/` to `.gitignore` (generated types directory)
- Add `.react-router/types/**/*` to `tsconfig.json`'s `include` array
- Run `npx react-router typegen` once to generate the types
- Migrate routes one at a time; tsc catches any mis-renames

---

## 5. Deploy + smoke test (before flipping DNS)

After Phase B's PR merges to `main`, CF will auto-build the new Worker. **Do not flip the custom domain yet.**

1. Find the Worker's `*.workers.dev` URL in the CF dashboard (Workers → `gonzalo-alvarez-campos-cv` → Triggers).
2. Smoke-test against that URL (15 minutes):
   - [ ] Home loads, hero greeting + CTAs visible
   - [ ] `/skills` loads, timeline + heatmap + tech grid all render
   - [ ] `/skills/1` (Globant detail) loads
   - [ ] `/education` index loads
   - [ ] `/education/degree` loads
   - [ ] `/projects` index loads, case-study cards present
   - [ ] `/projects/avant` loads
   - [ ] `/contact` loads, form submits successfully (check Gmail receives the email)
   - [ ] Locale toggle: `EN | ES` button works, cookie persists across navigation
   - [ ] Theme toggle: sun/moon switch persists across navigation
   - [ ] `?lang=es` URL param overrides cookie
   - [ ] Skip-link works on keyboard tab
   - [ ] `curl -I` confirms cache headers (see B5, B6)
   - [ ] DevTools Network tab: `/assets/*` shows `immutable` cache
3. Run Lighthouse on the workers.dev URL — expect Performance ≥0.90.
4. Compare visual against the current prod URL side-by-side (open both in tabs at desktop + mobile widths).

### Flipping DNS (the point of no return)

Only after the smoke-test passes:

1. CF dashboard → Workers → your worker → Triggers → Custom Domains → Add `gonzalo-alvarez-campos-cv.com`.
2. CF will prompt to remove the domain from the Pages project; confirm.
3. DNS propagates within seconds (same CF account, same edge).
4. Verify `https://gonzalo-alvarez-campos-cv.com/` now routes to the Worker. Repeat the smoke-test list at #5.2 against the custom domain.
5. **Leave the Pages project running for 1-2 weeks** as a rollback target. Don't delete it.

---

## 6. Rollback procedure

If anything goes wrong post-DNS-flip:

1. **Within 5 minutes:** CF dashboard → Workers → Custom Domains → remove `gonzalo-alvarez-campos-cv.com`. DNS reverts to the Pages project automatically (it was the previous owner). Maybe 30 seconds of disruption.
2. **Code rollback:** `git reset --hard <known-good-SHA>` and force-push to `main`. CF Pages auto-builds the old code from the new HEAD. Replace `<known-good-SHA>` with the tip of `remix-version-backup`.
3. **Re-set secrets back on Pages** if you'd deleted them (you shouldn't have):

   ```sh
   npx wrangler pages secret put RESEND_API_KEY --project-name=gonzalo-alvarez-campos-cv
   ```

4. Investigate what failed in a fresh branch off `remix-version-backup`. Don't try to fix forward under time pressure.

---

## 7. Known landmines (re-read before starting)

- **`@react-router/cloudflare-pages` does not exist.** The codemod's package.json template adds it; delete the line manually. Forgetting this is the #1 way to get stuck on `npm install`.
- **`overrides.@remix-run/dev` block** in package.json must be deleted too — the wrangler-peer-dep workaround it carries is no longer needed since RR v7's adapter is fine with wrangler v4.
- **`useLoaderData<typeof loader>()` silently degrades.** Tsc won't catch it. Only the generated `Route.ComponentProps` pattern (Phase C) gives accurate types under Single Fetch's turbo-stream serialiser.
- **Visual baselines will likely shift.** Hydration script tags and the Layout export pattern can produce a few-px diff. Plan one CI regen pass via `gh workflow run regen-baselines.yml`.
- **CF Pages auto-deploy via git is the deploy path today.** After migrating, **verify Workers has a similar git-integration set up** in the CF dashboard, OR be ready to deploy manually via `wrangler deploy` on every push. If CF Workers doesn't auto-deploy from git on your account tier, you'll need a GitHub Actions step calling `wrangler deploy`.
- **`.dev.vars` keeps working** for local dev — both Pages and Workers wrangler dev loads it. No change needed for the contact form's local-dev secret.

---

## 8. Estimated effort

- **Phase A (codemod + framework swap):** 60-90 min. Mostly mechanical once you've worked through Section 2's checklist.
- **Phase B (Workers cutover):** 45-60 min for the code, then 15-30 min for the smoke-test before DNS flip.
- **Phase C (type cleanup):** 30-45 min, mechanical.
- **Total focused time:** 2.5-3.5 hours, plus a window for monitoring the new deploy.

**Recommended cadence:** Phase A + B in one Saturday session; Phase C the following week as a small cleanup PR.
