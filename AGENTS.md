# AGENTS.md

Guidelines for AI agents (Claude Code, Cursor, Aider, etc.) working in this repository.
`CLAUDE.md` is a symlink to this file — keep changes here.

---

## 1. What this project is

Personal portfolio / online CV for **Gonzalo Alvarez Campos**, deployed at <https://gonzalo-alvarez-campos-cv.com/>.

- Single-page-feel multi-route web app showcasing work history, skills, education, and a downloadable CV (PDF).
- The frontend is the entire product today. Cloudflare Workers handle SSR via the Worker at [workers/app.ts](workers/app.ts); there's no separate backend service. Future server-side concerns (e.g. the `/contact` route's action) land as route actions inside the same Worker.
- Migrated from Remix v2 → React Router v7 in Bundle 4 (see [TECH-DEBT.md](TECH-DEBT.md) T9). Full migration notes + landmines in [docs/migrations/remix-to-rr7.md](docs/migrations/remix-to-rr7.md).

The site is content-driven: routes load static JSON files from [public/data/](public/data/) at request time and render them.

---

## 2. Stack

| Layer             | Tech                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework         | [React Router](https://reactrouter.com/) v7 (framework mode, Vite plugin)                                    |
| Build / dev       | Vite 5 + `@react-router/dev` Vite plugin, Terser minification (sourcemaps off in prod)                       |
| Runtime / hosting | Cloudflare Workers + Static Assets (Worker at [workers/app.ts](workers/app.ts))                              |
| Wrangler          | v4 (`wrangler dev` / `wrangler deploy`)                                                                      |
| UI                | React 18 + TypeScript                                                                                        |
| Routing           | React Router flat routes via `@react-router/fs-routes` ([app/routes.ts](app/routes.ts))                      |
| Styling           | PostCSS (extend-rule, import, nested, simple-vars) + BEM via `getClassMaker`                                 |
| i18n              | `react-intl` (English + Spanish; `?lang=` → `locale` cookie → `Accept-Language`; see [app/intl/](app/intl/)) |
| Charts            | CSS-grid tenure heatmap ([app/components/TenureHeatmap/](app/components/TenureHeatmap/))                     |
| Timeline          | `react-vertical-timeline-component`                                                                          |
| Dates             | `date-fns`                                                                                                   |
| Icons             | Local SVGs → SVGO → SVGR-generated React components                                                          |
| Linting           | ESLint 9 flat-config + Prettier, Stylelint, ls-lint                                                          |
| Type-check        | `tsc --noEmit` (Vite handles emit)                                                                           |
| Node              | `>=22.0.0` (`.nvmrc` pins `v22.22.2` — Wrangler 4 floor)                                                     |
| npm               | strict peer deps; no overrides block required post-RR v7 migration                                           |

**Tests:** Vitest + React Testing Library for components/utils, Playwright for E2E (chromium + Pixel 7 mobile project). See "Tests" section below.

**Storybook:** Storybook 10 (Vite framework) with stories colocated next to each component as `index.stories.tsx`. See "Storybook" section below.

CI runs lint, typecheck, unit, E2E, and `build-storybook` on every PR ([.github/workflows/ci.yml](.github/workflows/ci.yml)). A separate Lighthouse workflow ([.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml)) runs on push to `main`, scores the deployed prod URL across five routes, and commits the per-route summaries back to `lighthouse/` with `[skip ci]` — see [lighthouse/README.md](lighthouse/README.md) for the full flow. Dependabot ([.github/dependabot.yml](.github/dependabot.yml)) bumps deps weekly in grouped ecosystems, prefixed `chore(deps)`.

---

## 3. Repository layout

```
remix-portfolio/
├── app/                          # React Router v7 app source
│   ├── root.tsx                  # HTML shell, IntlProvider, NavBar, error boundary
│   ├── routes.ts                 # `flatRoutes()` — file-based routing entry
│   ├── entry.client.tsx          # hydrateRoot in StrictMode (HydratedRouter)
│   ├── entry.server.tsx          # renderToReadableStream + isbot (ServerRouter)
│   ├── routes/
│   │   ├── _index/               # /                  → Home
│   │   ├── education._index/     # /education         → Degrees + certifications grid
│   │   ├── education.$slug/      # /education/:slug   → Single degree detail
│   │   ├── skills._index/        # /skills            → Work timeline + tech grid + tenure heatmap
│   │   └── skills.$uuid/         # /skills/:uuid      → Single work-item detail
│   ├── components/
│   │   ├── Card/                 # Generic card (title / texts / itemList / skills / children)
│   │   ├── TechTree/             # Categorized tech-stack chip grid (rendered from skills.json)
│   │   ├── DownloadBtn/          # Download CV PDF
│   │   ├── Input/                # Autocomplete combobox (a11y-compliant)
│   │   ├── LoadingSpinner/
│   │   ├── NavBar/               # Side / bottom nav with social icons
│   │   ├── TenureHeatmap/        # GitHub-style skill × year contribution graph
│   │   ├── ThemeToggle/          # Sliding sun/moon dark/light toggle
│   │   ├── Timeline/             # Wraps react-vertical-timeline-component
│   │   └── icons/                # *** SVGR-generated, gitignored, do NOT edit ***
│   ├── data/skills-schema.ts     # Zod schema + types + loadSkills() boot validator
│   ├── assets/icons/             # Source .svg files (kebab-case)
│   ├── intl/                     # en-US.json + es-ES.json + locale picker (index.ts)
│   ├── styles/
│   │   ├── constants.js          # Design tokens (colors, spacing, fonts, breakpoints)
│   │   └── style.css             # Global body/html/main + @font-face Roboto + Monaspace
│   └── utils/
│       ├── utils.tsx              # getClassMaker, formatDate, getSkillHeatmapData, getSkillGroupsForJob, getAllSkillGroups, getSkillSuggestions, localized, getCvUrl
│       └── meta.ts                # mergeRouteMeta (per-route title + OG/Twitter merger)
├── workers/app.ts                # Cloudflare Worker — serves the RR v7 server build + delegates static assets to `env.ASSETS`
├── public/
│   ├── data/                     # Static JSON consumed by route loaders (education, skills)
│   ├── robots.txt + sitemap.xml  # SEO basics
│   ├── fonts/roboto/             # Roboto VariableFont (WOFF2)
│   ├── assets/img/               # webp logos for each company
│   ├── assets/files/             # CV PDF
│   └── _headers                  # Cache-Control headers for static assets (read by CF Workers + Static Assets)
├── build/                        # Vite output (gitignored): build/client + build/server
├── load-context.ts               # Augments RR v7 AppLoadContext with `cloudflare: { env, ctx }`
├── worker-configuration.d.ts     # Generated `interface Env` (run `npm run cf-typegen`)
├── wrangler.jsonc                # Workers config: main, assets, KV bindings, vars, `run_worker_first`
├── react-router.config.ts        # RR v7 config: `{ ssr: true }`
├── vite.config.ts
├── tsconfig.json + jsconfig.json # `~/*` → `./app/*`
├── postcss.config.js + svgo.config.cjs + svgr.config.cjs
└── .ls-lint.yml + eslint.config.js + .prettierrc.json + .stylelintrc.json
```

---

## 4. Scripts

From [package.json](package.json):

| Command                      | What it does                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`                | `react-router dev` — local dev server on **port 8788**                             |
| `npm run build`              | `NODE_ENV=production react-router build` — emits `build/client` and `build/server` |
| `npm run start`              | `wrangler pages dev ./build/client` — preview the built bundle on Pages            |
| `npm run preview`            | `npm run build && wrangler pages dev`                                              |
| `npm run deploy`             | `npm run build && wrangler pages deploy` — deploys to Cloudflare Pages             |
| `npm run typecheck`          | `tsc` (no emit)                                                                    |
| `npm run typegen`            | `wrangler types` — regenerates `worker-configuration.d.ts` from bindings           |
| `npm run cf-typegen`         | Alias of the above                                                                 |
| `npm run lint`               | `run-s lint:*` — runs all linters in sequence                                      |
| `npm run lint:css`           | `stylelint 'app/**/*.css'`                                                         |
| `npm run lint:es`            | ESLint over `.js,.jsx,.ts,.tsx`                                                    |
| `npm run lint:ls`            | `@ls-lint/ls-lint` — file/folder naming rules                                      |
| `npm run lint:prettier`      | `prettier --check .`                                                               |
| `npm run build:svg`          | `svgo -f ./app/assets/icons` — optimize source SVGs                                |
| `npm run build:icons`        | `svgr` over `./app/assets/icons` → `app/components/icons/*.jsx`                    |
| `npm test`                   | `vitest run` — unit / component tests                                              |
| `npm run test:watch`         | `vitest` watch mode                                                                |
| `npm run test:e2e`           | `playwright test` — chromium + Pixel 7 mobile projects                             |
| `npm run test:visual`        | Visual-regression spec only (chromium). Self-skips on macOS — see §11.             |
| `npm run test:visual:update` | Regenerate visual baselines via the Playwright Docker image.                       |
| `npm run storybook`          | `storybook dev -p 6006` — local Storybook on port 6006                             |
| `npm run build-storybook`    | `storybook build` — static build to `storybook-static/`                            |

> **Always run `npm run typecheck`, `npm run lint`, `npm test`, and (for component changes) `npm run build-storybook` before reporting work as done.**

---

## 5. Routing

React Router v7 flat-routes convention via `@react-router/fs-routes`'s `flatRoutes()`, wired in [app/routes.ts](app/routes.ts). The route directory names (`_index/`, `skills.$uuid/`, `contact._index/`, etc.) carry over unchanged from the Remix v2 era.

**Single Fetch is the default in RR v7.** Loaders return raw objects (no `json()`). Use `data(payload, { headers, status })` from `react-router` only when you need to set response headers or a custom status.

**Response headers from loaders require an explicit `headers` export.** In Remix v2 the second arg to `data()` propagated response headers automatically; in RR v7's Single Fetch aggregation, each route has to opt in:

```ts
export function headers({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders;
}
```

Currently used on `/skills` (1h `Cache-Control` + `Vary: Accept-Language, Cookie`). Any new route that wants edge-cache behaviour needs this export too.

| URL                | File                                                                            | Loader                                                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | [app/routes/\_index.tsx](app/routes/_index.tsx)                                 | none                                                                                                                                                                                                                                          |
| `/education`       | [app/routes/education.\_index/index.tsx](app/routes/education._index/index.tsx) | validates `education.json` via Zod once per worker boot (`loadEducation`); resolves `_es` siblings per request via `localized()`                                                                                                              |
| `/education/:slug` | [app/routes/education.\$slug/index.tsx](app/routes/education.$slug/index.tsx)   | resolves `slug` to a degree key, localizes title/summary/description in the loader (so `<meta>` and render share copy); throws on miss → local `ErrorBoundary`                                                                                |
| `/skills`          | [app/routes/skills.\_index/index.tsx](app/routes/skills._index/index.tsx)       | validates `skills.json` via Zod once per worker boot (`SKILLS`, `SUGGESTIONS` hoisted); the heatmap + total-years figure derive in the loader. Per-request: timeline cards + extras resolve `_es`. 1h cache + `Vary: Accept-Language, Cookie` |
| `/skills/:uuid`    | [app/routes/skills.\$uuid/index.tsx](app/routes/skills.$uuid/index.tsx)         | shares the same validated payload, finds `WORK_ITEMS[id == +uuid]`, derives bucketed skill chips via `getSkillGroupsForJob`, throws on miss → renders local `ErrorBoundary`                                                                   |

There is no `/contact` route today — README mentions one as a future feature but the NavBar doesn't render any entry for it.

Loaders import the JSON directly from `public/data/` so Vite bakes it into the server bundle. The files are no longer served from `/data/*` — `_routes.json` routes that path to the Pages Function (which 404s), so the JSON is only readable through the rendered routes. This is intentional: the data is the CV content; we don't want scrapers lifting the entire payload (including draft Spanish translations) by hitting a public URL.

---

## 6. Styling system

### Design tokens

All design tokens live in [app/styles/constants.js](app/styles/constants.js) and are injected as PostCSS `simple-vars` (e.g. `$text-color`, `$space-20`, `$bp-md`). Unknown variable refs emit warnings — keep tokens centralized there.

### Component CSS

Each component owns its `style.css` next to its `index.tsx`, written in BEM:

```
.block-name { ... }
.block-name__element { ... }
.block-name--modifier { ... }
```

There are **two patterns** for getting that CSS to the browser. Pick the right one for the component you're adding.

#### Pattern A — postcss-import inline (default for small / always-needed components)

Most per-component stylesheets are collapsed into the consuming route's stylesheet (or the global stylesheet, for components used everywhere) via `postcss-import`, wired up in [postcss.config.js](postcss.config.js): the build expands `@import` directives at compile time, so one stylesheet ships instead of many.

The component itself just owns its `style.css`. **No `links()` export, no `?url` import.** The consumer adds an `@import` at the top of its own `style.css`:

```css
/* app/routes/skills._index/style.css */
@import '../../components/Card/style.css';
@import '../../components/Input/style.css';

.skills-route {
  /* ... */
}
```

Components currently inlined this way: `Card`, `DownloadBtn`, `Input`, `LoadingSpinner`, `NavBar`, `TechTree`, `TenureHeatmap`, `ThemeToggle`, `Timeline`. NavBar + ThemeToggle are inlined into [app/styles/style.css](app/styles/style.css) since they ride on every page; the rest are inlined into the routes that consume them. The `/skills` route stylesheet also `@import`s the vendor `react-vertical-timeline-component/style.min.css` for the same reason.

> **Lazy-loaded components inline their CSS too.** `TechTree`, `TenureHeatmap`, and `Timeline` are JS-lazy-loaded on `/skills` via `lazy()` + `Suspense`, but their CSS rides eagerly with the route stylesheet — it's tiny (~19 KB raw / ~3.5 KB gzipped including the vendor sheet) and Lighthouse's Lantern simulator was charging ~360 ms of element-render-delay across the four separate render-blocking sheets. One inlined route stylesheet beats four small ones. The JS chunk-split is preserved — only the CSS coalesces.

The chain bottoms out at [app/root.tsx](app/root.tsx)'s `links()`, which loads `app/styles/style.css` — global styles + the `@import`-inlined NavBar / ThemeToggle CSS.

### `getClassMaker` (BEM helper)

[app/utils/utils.tsx](app/utils/utils.tsx#L3) exports the BEM helper used everywhere:

```ts
const BLOCK = 'card-component';
const getClasses = getClassMaker(BLOCK);

getClasses(); // 'card-component'
getClasses('title'); // 'card-component__title'
getClasses('', 'styleless'); // 'card-component--styleless'
getClasses('', { active: true }); // 'card-component card-component--active'
```

### Stylelint

`stylelint-config-standard` runs as part of `npm run lint` (via `lint:css`) and gates CI. Most of the standard rule set is in effect. Project-specific tweaks in [.stylelintrc.json](.stylelintrc.json):

- **Re-enabled in T10b** (Bundle 1): `declaration-property-value-no-unknown`, `shorthand-property-no-redundant-values`, `color-function-alias-notation`. These were previously disabled because stylelint's value parser couldn't understand postcss-simple-vars `$tokens` (e.g. `padding: 0 $space-12`). Now that the scale tokens live as CSS custom properties (`var(--space-12)`), the parser handles them and the rules can gate.
- **Typo-catchers added in T10b**: `custom-property-no-missing-var-function` (catches `--token: --otherToken` written without `var()`) + `custom-property-pattern` enforcing `kebab-case`. These replace the simple-vars `unknown` callback as the safety net for the now-much-larger custom-property surface area.
- **Still relaxed** (`alpha-value-notation`, `at-rule-no-unknown`, `color-function-notation`, `color-hex-length`, `comment-empty-line-before`, `custom-property-empty-line-before`, `import-notation`, `length-zero-no-unit`, `media-query-no-invalid`, `selector-class-pattern`): pre-existing token-rejection set from before stylelint was gated. Most flag stylistic preferences (long vs short hex, rgb-vs-rgba arg shape) that aren't worth the churn to flip across the existing codebase.

If a future rule emits a false positive on a build-time substitution (anything involving `$bp-*` breakpoint tokens, since those still go through simple-vars), prefer disabling that specific rule in `.stylelintrc.json` over wrapping the value in a `/* stylelint-disable */` comment.

---

## 7. Icons (SVG → React)

1. Drop a kebab-case SVG into [app/assets/icons/](app/assets/icons/) (e.g. `new-icon.svg`).
2. Run `npm run build:svg` — SVGO optimizes the source files in place.
3. Run `npm run build:icons` — SVGR rewrites [app/components/icons/](app/components/icons/) (a PascalCase `.jsx` per SVG, plus a barrel `index.jsx`).
4. Import: `import { NewIcon } from '~/components/icons'`.

**Do not hand-edit `app/components/icons/*.jsx`** — it's regenerated and ignored by the linter (via the `ignores` block in `eslint.config.js`) and `.ls-lint.yml`. SVGR config: `outDir: 'app/components/icons'`, `ext: 'jsx'`, JSX runtime automatic, `svgProps: { height: '100%', 'aria-hidden': 'true' }`. Icons are decorative — every parent (NavBar links, ThemeToggle, Timeline elements) carries its own accessible name, and `aria-hidden` lets axe/Lighthouse skip the "SVG with img role needs an accessible name" rule. **SVGR doesn't delete generated files for SVGs you removed from `app/assets/icons/`** — when removing a source SVG, also delete its `app/components/icons/<Name>.jsx` and re-run `npm run build:icons` so the barrel rebuilds clean.

---

## 8. Internationalization

`IntlProvider` wraps the app in [app/root.tsx](app/root.tsx) with the locale and messages chosen by the **root loader**: it calls `pickLocale(request)` from [app/intl/index.ts](app/intl/index.ts), which resolves a locale in priority order — `?lang=` URL param → `locale` cookie (set by the NavBar `LocaleToggle`) → `Accept-Language` header → `'en'` default. Messages live next to that helper in [en-US.json](app/intl/en-US.json) and [es-ES.json](app/intl/es-ES.json).

Use one of:

- `<FormattedMessage id="KEY" />` for inline copy.
- `useIntl().formatMessage({ id: 'KEY' })` when you need a string (placeholders, aria-labels, conditional class strings).

Adding a key: append it to **both** `en-US.json` and `es-ES.json` — the registry is case-sensitive and will warn at runtime when a key is missing in one locale. Both files share the same `UPPER_SNAKE_CASE` shape; sort keys alphabetically by convention.

Adding a third locale: extend `SUPPORTED_LOCALES` and the `MESSAGES` map in `app/intl/index.ts`, drop a sibling JSON next to the existing two, and add a button to [app/components/LocaleToggle/index.tsx](app/components/LocaleToggle/index.tsx) (the toggle iterates over `SUPPORTED_LOCALES` so no math changes — just ensure the CSS knob's `--knob-index` math still works with the new column count).

---

## 9. Data

Site content is **not in the database** — it's static JSON under `public/data/`:

- [public/data/education.json](public/data/education.json) — degree + associate degree + certifications. Validated at boot via [app/data/education-schema.ts](app/data/education-schema.ts).
- [public/data/skills.json](public/data/skills.json) — `WORK_ITEMS`, `SKILLS`, `EXTRA_ACTIVITIES`. **Skill-first model** — see below. Validated at boot via [app/data/skills-schema.ts](app/data/skills-schema.ts).

To update content, edit those JSON files. Route loaders import them server-side (Vite bakes the JSON into the server bundle); the skills loader still caches for 1h via `Cache-Control` so the edge holds the rendered HTML.

### Localization (`_es` siblings)

Both data files use **inline `_es` siblings** for localizable string fields. A field like `description` carries an optional `description_es` next to it; consumers resolve via [`localized(item, key, locale)`](app/utils/utils.tsx) in `app/utils/utils.tsx`. The helper falls back to the English field when the `_es` sibling is missing or empty, so partial translation is fine and never breaks a render. **Not** localized: company names, institution names, dates, ids, tech-stack chip text (proper nouns).

Locale is resolved by [`pickLocale(request)`](app/intl/index.ts) in priority order: `?lang=` URL param → `locale` cookie (set by `LocaleToggle` on click; 1-year expiry, `SameSite=Lax`) → `Accept-Language` header → `'en'` default. Loaders that emit localized copy resolve it server-side and set `Vary: Accept-Language, Cookie` on the response so the edge cache segments correctly across both signals.

Adding a new field:

1. Add the base field + optional `_es` sibling to the relevant Zod schema.
2. Use `localized(item, 'fieldName', locale)` at the read site.
3. Add the English copy now and the Spanish copy when ready — don't block on a full sync.

### Skill-first schema (skills.json)

`skills.json` validates at worker boot through the Zod schema. The schema is the single source of truth — TS types are inferred via `z.infer`, malformed JSON throws a path-precise error before any consumer reads it.

**Shape:**

- `WORK_ITEMS` — jobs, identified by stable numeric `id`. Authored chronologically (oldest first); the timeline route reverses for display. **No skill data on work items** — that lives in `SKILLS`.
- `SKILLS` — every skill authored once, regardless of how many jobs used it. Each entry: `{ name, category, ranges }`. `category` is one of `language | framework | tooling | infra | meta` — the `meta` bucket (Front End, Back End, Agile, Mentoring, etc.) is filtered out of the chart, heatmap, and autocomplete suggestions but still renders as chips on per-job timeline cards. `ranges` is an array of `{ jobId, from?, to? }`; `from`/`to` are `YYYY-MM` strings, both optional (defaults to the referenced job's full span). A skill can have multiple ranges, including multiple ranges on the same `jobId` (used early, paused, resumed — all merged at read time).
- `EXTRA_ACTIVITIES` — flat list of internship / mentoring write-ups.

**Adding a skill to a job:** find the skill in `SKILLS`, push `{ jobId: N }` onto its `ranges`. If it's a brand-new skill, add a new entry. The schema validates that every `jobId` exists, names don't collide, and all dates are `YYYY-MM`.

**Adding a job:** push a new `WORK_ITEMS` entry with the next `id`, then go through every relevant `SKILLS[].ranges` and add `{ jobId: <new-id> }` to the ones that apply at this job.

**Heatmap, chart, autocomplete:** all derive from `SKILLS` via helpers in [app/utils/utils.tsx](app/utils/utils.tsx) — `getSkillHeatmapData`, `getSkillGroupsForJob`, `getSkillSuggestions`. Computed once per worker boot and reused across requests.

Per-company logos live in `public/assets/img/<company-slug>.webp`. The `skills.$uuid` route resolves the image path by lowercasing `data.title`, with overrides for titles that don't directly map to a logo file (`Professor (part-time)` → `unsta2.webp`, `Teacher` → `coderhouse.webp`) — see `IMAGE_OVERRIDES` in the route.

The English CV PDF is at [public/assets/files/gonzalo_alvarez_campos_cv.pdf](public/assets/files/gonzalo_alvarez_campos_cv.pdf) and surfaced via [DownloadBtn](app/components/DownloadBtn/index.tsx). The home route loader resolves a locale-specific URL via `getCvUrl(locale)` in [app/utils/utils.tsx](app/utils/utils.tsx) — when the Spanish PDF lands at `gonzalo_alvarez_campos_cv_es.pdf`, flip `HAS_ES_CV` to `true` in that helper and update [app/utils/utils.test.tsx](app/utils/utils.test.tsx) to assert the `_es` path. Until then, Spanish-locale visitors get the English PDF as a fallback rather than a 404.

---

## 10. Cloudflare Pages

- [wrangler.jsonc](wrangler.jsonc) — Workers config: `main = "./workers/app.ts"`, `compatibility_date = "2024-07-18"`, `assets.directory = "./build/client"`, `assets.run_worker_first = true`, plus vars (`CONTACT_FROM`, `CONTACT_TO`) and the `RATELIMIT_KV` binding used by the `/contact` action.
- [workers/app.ts](workers/app.ts) — the Worker's `fetch` entrypoint. Delegates `/assets/*`, `/fonts/*`, `/.well-known/*`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml` to `env.ASSETS.fetch(request)`; everything else routes through the RR v7 request handler with `{ cloudflare: { env, ctx } }` as the load context.
- [public/\_headers](public/_headers) — `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`.
- [public/\_routes.json](public/_routes.json) — invokes the Function for everything except `/favicon.ico` and `/assets/*`.
- [load-context.ts](load-context.ts) — augments `AppLoadContext` with `cloudflare: PlatformProxy<Env>`; access bindings (when any are added) via `context.cloudflare.env.*` inside loaders.

If/when env vars or bindings are added: edit `wrangler.jsonc`, then run `npm run cf-typegen` to regenerate [worker-configuration.d.ts](worker-configuration.d.ts). Secrets (`RESEND_API_KEY`) are set via `npx wrangler secret put NAME` — no `pages` subcommand, no `--project-name` flag.

---

## 11. Tests

Two layers, both opt-in via npm scripts and run on CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

### Pre-push hook (simple-git-hooks)

[scripts/pre-push.sh](scripts/pre-push.sh) blocks `git push` if `npm run lint`, `npm run typecheck`, or `npm test` fails. It runs the cheap-but-meaningful trio (~10s on a warm cache) so type/lint/unit regressions get caught before they reach CI. E2E + visual specs are NOT run here — they need the dev server (slow) or Docker (visual). CI is the gate of record for those.

The hook also emits a soft warning if you changed UI-affecting files (`*.css`, `app/routes/`, `app/components/`, `app/intl/`, `public/data/`, `public/fonts/`, `app/styles/`) since `origin/main` without committing any new visual baselines. It doesn't block the push — sometimes a CSS tweak is below the diff threshold, sometimes you're working on a non-UI branch — but it nudges you so you don't push, get a CI failure, then have to regenerate baselines and push again.

Bypass in an emergency with `git push --no-verify`. Prefer fixing the underlying failure to using `--no-verify`.

The hook installs automatically via `npm install` (the `prepare` script runs `simple-git-hooks`, which reads the `simple-git-hooks` block in `package.json` and writes the actual hooks into `.git/hooks/`). If you switched from a Husky-managed repo, run `git config --unset core.hooksPath` once so git stops looking at the (deleted) `.husky/_/` directory and picks up the new `.git/hooks/pre-push`.

### Unit / component — Vitest + React Testing Library

- Config: [vitest.config.ts](vitest.config.ts) (happy-dom env, globals, `~/*` alias via Vitest 4's native `resolve.tsconfigPaths: true`).
- Setup: [test/setup.ts](test/setup.ts) — adds `jest-dom` matchers, RTL `cleanup`, and stub polyfills for `ResizeObserver` and `IntersectionObserver` (`react-vertical-timeline-component` needs them).
- Render helper: [test/test-utils.tsx](test/test-utils.tsx) — wraps trees in a `createMemoryRouter` data-router (so `react-router`'s `Link` works) plus an `IntlProvider` populated from `app/intl/en-US.json`.
- Tests live next to the component as `index.test.tsx`. Pattern: `app/**/*.{test,spec}.{ts,tsx}`.
- Run: `npm test` (one shot), `npm run test:watch`, `npm run test:ui`.

> **Router dedupe.** `react-router` is the single package for router + hooks + data APIs in v7; the T15-era `react-router-dom` peer-pin workaround is gone. If you ever add a second package that transitively pulls a different `react-router` version, `npm ls react-router` should surface it.

### E2E — Playwright

- Config: [playwright.config.ts](playwright.config.ts).
- Two projects: `chromium` (Desktop Chrome) and `mobile` (Pixel 7 device emulation).
- `webServer`: starts `npm run dev` on `http://localhost:8788` automatically (reuses an existing server in dev).
- `workers: 1`, `fullyParallel: false` — Vite dev's first-hit compile is slow under parallel load. Don't re-enable parallelism without switching to `npm run preview` (the built bundle).
- Specs live in [tests/e2e/](tests/e2e/), one per route or concern: `home.spec.ts`, `skills.spec.ts`, `education.spec.ts`, `navbar.spec.ts`, plus `visual.spec.ts` for screenshot-diffs (see below).
- Run: `npm run test:e2e` (both projects), `npm run test:e2e:ui` (Playwright UI mode), `--project=chromium` to limit.

### Visual regression — `visual.spec.ts`

Full-page screenshot diffs for `/`, `/education`, `/education/:slug`. Both `/skills` routes are excluded — the heatmap's tight SVG cell grid drifts on sub-pixel anti-aliasing across environments, and `/skills/:uuid` reproducibly captured a hydration-error overlay during Docker regen. Both routes stay covered by behavioural specs. See [tests/e2e/README.md](tests/e2e/README.md#why-skills-isnt-gated) for the full reasoning. Baselines live at [tests/e2e/visual.spec.ts-snapshots/](tests/e2e/visual.spec.ts-snapshots/) and are committed for **linux only** — the spec self-skips on macOS, so `npm run test:e2e` on a Mac runs the behavioural specs only and stays green; on Ubuntu (CI) the spec runs and diffs against the committed baselines.

Why linux-only: Playwright screenshots are pixel-level. Fonts, sub-pixel anti-aliasing, and emoji rendering differ enough between macOS and Ubuntu that committing both per-platform PNGs would double the snapshot footprint without gating anything (CI is the only place that runs the assertions). The spec's `SKIP_VISUAL` flag (in [tests/e2e/visual.spec.ts](tests/e2e/visual.spec.ts)) keys off `process.platform`.

Determinism guards (set up in `prepare()` and `settle()`):

1. **`page.clock.install({ time: FIXED_NOW })`** — the /skills "Total years of experience" card and any `endDate: null` work item both call `new Date()`; without freezing, rendered text drifts every day.
2. **Animations + transitions disabled** via an injected stylesheet — the vertical-timeline intersection animation, theme-toggle slide, and any other CSS transitions would otherwise produce different pixels every run.
3. **`document.fonts.ready`** before snapshotting — Roboto loads from `/fonts/roboto/`; without this guard the first capture can land while the system fallback is still rendering.
4. **`networkidle` + 200 ms settle** for lazy chunks (TenureHeatmap, TechTree, Timeline) to land and lay out.

No content is masked on the routes that are gated — token changes and data updates that shift layout are exactly what we want to catch.

**Updating baselines after an intentional UI change:**

```sh
npm run test:visual:update
```

This shells out to [scripts/update-visual-baselines.sh](scripts/update-visual-baselines.sh), which runs Playwright inside the official `mcr.microsoft.com/playwright:v<version>-jammy` Docker image so the resulting PNGs match the Linux runners on CI. Required setup:

- **Docker Desktop** (or Colima) running on the host.
- The image tag automatically tracks the local `@playwright/test` version, so a Playwright bump produces matching baselines on the next regen.
- The script forces `--platform=linux/amd64` so the regen runs as x86_64 — matching GitHub Actions runners. On Apple Silicon Macs this means Docker emulates x86_64 via QEMU (3-5× slower regen, ~2-3 min total). Without this, freetype renders fonts slightly differently between arm64 and x86_64 and baselines won't match CI.

Review the regenerated PNGs under `tests/e2e/visual.spec.ts-snapshots/` and commit them.

**Tolerances** (`playwright.config.ts → expect.toHaveScreenshot`):

- `threshold: 0.2` — per-pixel color delta (covers anti-aliasing / sub-pixel jitter).
- `maxDiffPixelRatio: 0.002` (per-call in `visual.spec.ts`) — overall fraction of pixels allowed to differ. 0.2% is the standard "barely perceptible" tolerance.

See [tests/e2e/README.md](tests/e2e/README.md) for the full reference (adding routes, troubleshooting, etc.).

CI installs Chromium with `npx playwright install --with-deps chromium` and uploads `playwright-report/` on failure.

### When to add a test

- New component → add `index.test.tsx` covering its rendered output and any branching props.
- New route → add a spec in `tests/e2e/` covering the loader's happy path and at least one user interaction.
- Touched a util in `app/utils/` → extend `app/utils/utils.test.tsx`.

### Polyfills note

If you add a component that uses a browser API happy-dom doesn't implement (matchMedia, etc.), add a stub to [test/setup.ts](test/setup.ts) rather than mocking per-test. (`ResizeObserver` and `IntersectionObserver` are already stubbed there as a holdover from the jsdom era — happy-dom has them natively, but the stubs are harmless.)

---

## 12. Storybook

Every component in [app/components/](app/components/) has a colocated `index.stories.tsx` rendered by Storybook 10 (Vite framework).

### Run

- `npm run storybook` — dev server on port `6006`.
- `npm run build-storybook` — static build to `storybook-static/` (run on CI).

### Config

- [.storybook/main.ts](.storybook/main.ts) — picks up `app/**/*.stories.@(ts|tsx|mdx)`, points the Vite builder at [.storybook/vite.config.ts](.storybook/vite.config.ts) (a clean Vite config without the `@react-router/dev` plugin, which only works inside RR v7's own pipeline). Add-ons: a11y, docs, chromatic.
- [.storybook/preview.tsx](.storybook/preview.tsx) — one global decorator wraps stories in `IntlProvider` (so `FormattedMessage` works) and a `createMemoryRouter` data router (so `react-router`'s `<Link>` doesn't trip the `useHref` invariant). Imports `app/styles/style.css` so design tokens render.

### Adding a story

Drop `index.stories.tsx` next to the component:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import MyComponent from './index';

const meta: Meta<typeof MyComponent> = {
  title: 'Components/MyComponent',
  component: MyComponent,
};
export default meta;
export const Default: StoryObj<typeof MyComponent> = {
  args: {/* … */},
};
```

Hardcoded values are fine — stories are for visual review, not type guarantees. If a component crashes only inside a story, it's almost always one of: missing `IntlProvider` message key, a route-only loader being called, or Timeline needing the existing `ResizeObserver`/`IntersectionObserver` stubs (which Storybook doesn't run, but happy-dom in tests does).

> **Don't bump `eslint-plugin-storybook` independently** — it must match Storybook's major. The two are bumped together.

---

## 13. Conventions & lint rules

### File / folder naming ([.ls-lint.yml](.ls-lint.yml))

| Extension                                | Rule                                                               |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Directories                              | `lowercase \| kebab-case` (default)                                |
| `app/components/*` dirs                  | `lowercase \| PascalCase` (allows consecutive caps, e.g. `NavBar`) |
| `app/routes/*` dirs                      | `[a-zA-Z\$-_.]+` (RR flat-route chars: `$`, `-`, `_`, `.`)         |
| `.js`, `.ts`                             | `lowercase \| kebab-case`                                          |
| `.jsx`, `.tsx`                           | `lowercase \| PascalCase`                                          |
| `.css`, `.svg`, `.html`, `.png`, `.webp` | `lowercase \| kebab-case`                                          |

### TypeScript

- Path alias `~/*` resolves to `app/*` (configured in both `tsconfig.json` and `jsconfig.json` for tooling that doesn't speak TS).
- `strict: true`, `isolatedModules: true`, `noEmit: true` — Vite owns the build.
- Types: `vite/client`, `@cloudflare/workers-types/2023-07-01`.

### ESLint highlights ([eslint.config.js](eslint.config.js))

- ESLint 9 flat-config. Composes `@eslint/js` recommended + `typescript-eslint` recommended + `eslint-plugin-react` (recommended + jsx-runtime) + `eslint-plugin-react-hooks` (flat recommended) + `eslint-plugin-jsx-a11y` recommended + `eslint-plugin-import` (recommended + typescript) + `eslint-plugin-storybook` (story files only) + `eslint-config-prettier` (last, to disable formatting rules Prettier handles).
- We **don't** extend `eslint-config-airbnb` — Airbnb's config has no maintained flat-config support and most of what it added beyond the upstream plugin recommendations was style (which Prettier handles). Migrated away from airbnb when adopting flat-config.
- `simple-import-sort/imports` and `simple-import-sort/exports` are **errors** — let the editor's organize-imports do this.
- `no-console` allows `warn`, `error`, `info` only.
- `react/jsx-props-no-spreading` is **off** — spread props freely.
- `react/require-default-props` is on with `functions: 'defaultArguments'` — give optional props a default in the function signature, not via `defaultProps`.
- `_`-prefixed identifiers are ignored by `no-unused-vars` (via `@typescript-eslint/no-unused-vars`; the base `no-unused-vars` is off).
- Ignored paths (replaces the old `.eslintignore`) are declared inline at the top of `eslint.config.js`. Same coverage as before — generated SVGR icons, build outputs, public assets, node_modules, Playwright artifacts, Storybook static.

### Prettier ([.prettierrc.json](.prettierrc.json))

- `printWidth: 100`, `singleQuote: true`, `trailingComma: 'es5'`.
- JSON files use `trailingComma: 'none'`.
- VS Code is configured to format on save with Prettier and auto-fix ESLint ([.vscode/settings.json](.vscode/settings.json)).

### Production build

Terser drops `console.*` in production ([vite.config.ts](vite.config.ts#L17)) — use `console.warn`/`error`/`info` if you need a message to survive (and remember ESLint forbids `console.log` anyway).

---

## 14. Component patterns to keep matching

When adding a new component, mirror the existing shape:

1. Folder under `app/components/<PascalCase>/` containing `index.tsx` (+ `style.css` if it has styles).
2. `const BLOCK = 'kebab-case-block'; const getClasses = getClassMaker(BLOCK);`
3. Default-export the component. **No `links()` export.** The consuming route's stylesheet `@import`s the CSS via postcss-import (see §6). This applies even to JS-lazy-loaded components — their CSS rides eagerly with the route stylesheet so Lantern doesn't penalise extra render-blocking round-trips.
4. Type props inline (`type FooProps = { ... }`) and give optional props defaults in the parameter destructure (so `react/require-default-props` is satisfied).
5. Use `~/components/icons` for any iconography rather than inlining SVG.
6. For links, use `<Link to=...>` from `react-router`. If an element should only render as a link under some condition, do the conditional inline rather than reaching for a wrapper component.
7. For copy, use `react-intl` — never hardcode user-facing strings.

When adding a new route:

1. Create `app/routes/<flat-route-name>/index.tsx` (or `<flat-route-name>.tsx`).
2. Export `loader` if you need data — `import` the JSON from `public/data/` directly (Vite bakes it into the server bundle, no HTTP hop). Single Fetch is on by default; return a raw object, or use `data(payload, { headers, status })` from `react-router` when you need response headers or a custom status. If the route needs to expose those headers on the response (e.g. cache-control), also export a `headers` function that returns `loaderHeaders`.
3. Add a `style.css` next to the route if it has styles, and `@import` any components it consumes at the top of that file (see §6). Export `links` listing the route's own stylesheet, plus any per-route `<link rel="preload">` entries (e.g. fonts that are only needed on this route — Monaspace lives on `/skills`, `/skills/:uuid`, and `/education/:slug`).
4. Add a NavBar entry in [app/components/NavBar/index.tsx](app/components/NavBar/index.tsx) `MAIN_NAV` if the route should be reachable from the nav.
5. Optionally export a route-local `ErrorBoundary` (skills.\$uuid does this).

---

## 15. Gotchas

- **`app/components/icons/` is generated** — it's in `eslint.config.js`'s `ignores` block and `.ls-lint.yml`'s ignore list, and the lint pipeline will fail if you check it in by hand with bad names. Always go through SVGR.
- **npm peer-deps resolve cleanly without `--legacy-peer-deps`.** `@types/react` + `@types/react-dom` are pinned to `^18.x` to match `react@18`. The pre-migration `overrides` block for `@remix-run/dev`'s `wrangler@^3` peer is gone; `@react-router/dev` doesn't need it.
- **Type annotations on dates**: `formatDate(start, end)` has three overloaded behaviors keyed off `formatType` and the shape of `end` (`undefined` → `"MM/yyyy - Present"`, `''` → `"MMMM yyyy"`, otherwise → `"MM/yyyy - MM/yyyy"`); see [app/utils/utils.tsx](app/utils/utils.tsx).
- **Skills route loader 1h cache**: `/skills` sets `Cache-Control: public, max-age=3600`. After editing `skills.json`, expect up to an hour of stale data on prod.
- **Image path lookup in `skills.$uuid`** lowercases the work-item title; new companies need a `public/assets/img/<lowercased-title>.webp` file or another override branch. Also add an entry to `LOGO_DIMS` in the loader so the `<img>` gets `width`/`height` and doesn't cause CLS.
- **Don't lazy-load + statically import the same component.** Vite emits a "dynamic import will not move module into another chunk" warning and silently falls back to eager loading — defeats the code split. If you `lazy(() => import('~/components/Foo'))` in a route, do **not** also `import { links as fooLinks }` from the same path; let Foo's CSS ride along with the lazy chunk.
- **Production sourcemaps are off** ([vite.config.ts](vite.config.ts)). Stack traces show minified names. Re-enable temporarily if you're debugging a prod-only crash.
- **Verify UI changes in a browser.** `npm run dev` is the truth source for visual regressions — type-check, lint, and tests catch a lot but not everything (CSS layout, font rendering, animation timing).

---

## 16. Quick start checklist for an agent

Before opening a PR:

- [ ] `npm run typecheck` is clean.
- [ ] `npm run lint` is clean (ESLint, ls-lint, Prettier).
- [ ] `npm test` is green.
- [ ] `npm run test:e2e` is green (or `--project=chromium` for a faster local pass).
- [ ] If you intentionally changed visual output (CSS, layout, copy that affects layout), regenerate baselines with `npm run test:visual:update` (Docker required) and commit the new PNGs. CI will gate visual diffs in the `e2e-tests` job on Ubuntu.
- [ ] If you added or touched a component, `npm run build-storybook` succeeds and the new story renders in `npm run storybook`.
- [ ] If you touched any `style.css`, the parent route/component still spreads the child's `links()`.
- [ ] If you touched copy, the new key is in [app/intl/en-US.json](app/intl/en-US.json) and used via `FormattedMessage` / `formatMessage`.
- [ ] If you added an SVG, you ran `npm run build:svg && npm run build:icons` and **didn't** commit edits inside [app/components/icons/](app/components/icons/) by hand.
- [ ] If you added a route, the NavBar links to it (or there's a deliberate reason it doesn't).
- [ ] If you changed Wrangler bindings, you re-ran `npm run cf-typegen`.
- [ ] You ran `npm run dev` and verified the change in a browser.

---

## 17. Useful URLs

- Live site: <https://gonzalo-alvarez-campos-cv.com/>
- Repo: <https://github.com/Alvacampos/remix-portfolio>
- React Router docs: <https://reactrouter.com/>
- Cloudflare Pages docs: <https://developers.cloudflare.com/pages/>
