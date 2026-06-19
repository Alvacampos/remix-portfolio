# AGENTS.md

Guidelines for AI agents (Claude Code, Cursor, Aider, etc.) working in this repository.
`CLAUDE.md` is a symlink to this file — keep changes here.

---

## 1. What this project is

Personal portfolio / online CV for **Gonzalo Alvarez Campos**, deployed at <https://gonzalo-alvarez-campos-cv.com/>.

- Single-page-feel multi-route web app showcasing work history, skills, education, and a downloadable CV (PDF).
- The frontend is the entire product today. The README mentions a future Python/Django backend and a contact form, but neither exists yet.
- A future migration to React Router v7 or Next.js is on the table but not planned.

The site is content-driven: routes load static JSON files from [public/data/](public/data/) at request time and render them.

---

## 2. Stack

| Layer             | Tech                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Framework         | [Remix](https://remix.run/) v2.17 (Vite plugin), `cloudflare` adapter                            |
| Build / dev       | Vite 5 + `@remix-run/dev` Vite plugin, Terser minification (sourcemaps off in prod)              |
| Runtime / hosting | Cloudflare Pages (Pages Functions via `functions/[[path]].ts`)                                   |
| Wrangler          | v4 (`wrangler pages dev` / `wrangler pages deploy`)                                              |
| UI                | React 18 + TypeScript                                                                            |
| Routing           | Remix file-based / flat routes ([app/routes/](app/routes/))                                      |
| Styling           | PostCSS (extend-rule, import, nested, simple-vars, mixins) + Tailwind v4                         |
| i18n              | `react-intl` (English + Spanish — picked from `Accept-Language`; see [app/intl/](app/intl/))     |
| Charts            | `recharts` (custom horizontal bar chart in [app/components/BarChart/](app/components/BarChart/)) |
| Timeline          | `react-vertical-timeline-component`                                                              |
| Dates             | `date-fns`                                                                                       |
| Icons             | Local SVGs → SVGO → SVGR-generated React components                                              |
| Linting           | ESLint (airbnb + airbnb/hooks + prettier + jsx-a11y + storybook), Prettier, Stylelint, ls-lint   |
| Type-check        | `tsc --noEmit` (Vite handles emit)                                                               |
| Node              | `>=20.19.0` (`.nvmrc` pins `v20.19.5` — Storybook 10 floor)                                      |
| npm               | `legacy-peer-deps=true` (set in `.npmrc`)                                                        |

**Tests:** Vitest + React Testing Library for components/utils, Playwright for E2E (chromium + Pixel 7 mobile project). See "Tests" section below.

**Storybook:** Storybook 10 (Vite framework) with stories colocated next to each component as `index.stories.tsx`. See "Storybook" section below.

CI runs lint, typecheck, unit, E2E, and `build-storybook` on every PR ([.github/workflows/ci.yml](.github/workflows/ci.yml)). A separate Lighthouse workflow ([.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml)) runs on push to `main`, scores the deployed prod URL across five routes, and commits the per-route summaries back to `lighthouse/` with `[skip ci]` — see [lighthouse/README.md](lighthouse/README.md) for the full flow. Dependabot ([.github/dependabot.yml](.github/dependabot.yml)) bumps deps weekly in grouped ecosystems, prefixed `chore(deps)`.

---

## 3. Repository layout

```
remix-portfolio/
├── app/                          # Remix app source
│   ├── root.tsx                  # HTML shell, IntlProvider, NavBar, error boundary
│   ├── entry.client.tsx          # hydrateRoot in StrictMode
│   ├── entry.server.tsx          # renderToReadableStream + isbot
│   ├── routes/
│   │   ├── _index.tsx            # /          → Home
│   │   ├── education/index.tsx   # /education → Degree + certifications
│   │   ├── skills._index/        # /skills    → Work timeline + tech carousel + chart
│   │   └── skills.$uuid/         # /skills/:uuid → Single work-item detail
│   ├── components/
│   │   ├── BarChart/             # recharts custom horizontal bar chart
│   │   ├── Button/               # Button + ConditionalLink wrapper
│   │   ├── Card/                 # Generic card (title / texts / itemList / skills / children)
│   │   ├── Carousel/             # Tech-stack icon strip
│   │   ├── ConditionalWrapper/   # ConditionalWrapper + ConditionalLink
│   │   ├── DownloadBtn/          # Download CV PDF
│   │   ├── Input/                # Autocomplete combobox (a11y-compliant)
│   │   ├── LoadingSpinner/
│   │   ├── NavBar/               # Side / bottom nav with social icons
│   │   ├── Timeline/             # Wraps react-vertical-timeline-component
│   │   └── icons/                # *** SVGR-generated, gitignored, do NOT edit ***
│   ├── assets/icons/             # Source .svg files (kebab-case)
│   ├── intl/                     # en-US.json + es-ES.json + Accept-Language picker (index.ts)
│   ├── styles/
│   │   ├── constants.js          # Design tokens (colors, spacing, fonts, breakpoints)
│   │   ├── style.css             # Global body/html/main + @font-face Roboto
│   │   └── tailwind.css          # @tailwind directives
│   └── utils/utils.tsx           # getClassMaker, formatDate, getSkillChartData, noop
├── functions/[[path]].ts         # Cloudflare Pages Function — serves the Remix server build
├── public/
│   ├── data/                     # Static JSON consumed by route loaders (education, skills)
│   ├── robots.txt + sitemap.xml  # SEO basics
│   ├── fonts/roboto/             # Roboto VariableFont (WOFF2)
│   ├── assets/img/               # webp logos for each company
│   ├── assets/files/             # CV PDF
│   ├── _headers                  # Cloudflare Pages cache-control headers
│   └── _routes.json              # Pages Functions invocation rules
├── build/                        # Vite output (gitignored): build/client + build/server
├── load-context.ts               # Augments Remix AppLoadContext with `cloudflare` proxy
├── worker-configuration.d.ts     # Generated `interface Env` (run `npm run cf-typegen`)
├── wrangler.toml                 # name, compatibility_date, pages_build_output_dir
├── vite.config.ts
├── tsconfig.json + jsconfig.json # `~/*` → `./app/*`
├── postcss.config.js + svgo.config.cjs + svgr.config.cjs
├── .ls-lint.yml + .eslintrc.cjs + .prettierrc.json + .stylelintrc.json
└── tailwind.config.ts
```

---

## 4. Scripts

From [package.json](package.json):

| Command                      | What it does                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                | `remix vite:dev` — local dev server on **port 8788**                             |
| `npm run build`              | `NODE_ENV=production remix vite:build` — emits `build/client` and `build/server` |
| `npm run start`              | `wrangler pages dev ./build/client` — preview the built bundle on Pages          |
| `npm run preview`            | `npm run build && wrangler pages dev`                                            |
| `npm run deploy`             | `npm run build && wrangler pages deploy` — deploys to Cloudflare Pages           |
| `npm run typecheck`          | `tsc` (no emit)                                                                  |
| `npm run typegen`            | `wrangler types` — regenerates `worker-configuration.d.ts` from bindings         |
| `npm run cf-typegen`         | Alias of the above                                                               |
| `npm run lint`               | `run-s lint:*` — runs all linters in sequence                                    |
| `npm run lint:css`           | `stylelint 'app/**/*.css'`                                                       |
| `npm run lint:es`            | ESLint over `.js,.jsx,.ts,.tsx`                                                  |
| `npm run lint:ls`            | `@ls-lint/ls-lint` — file/folder naming rules                                    |
| `npm run lint:prettier`      | `prettier --check .`                                                             |
| `npm run build:svg`          | `svgo -f ./app/assets/icons` — optimize source SVGs                              |
| `npm run build:icons`        | `svgr` over `./app/assets/icons` → `app/components/icons/*.jsx`                  |
| `npm test`                   | `vitest run` — unit / component tests                                            |
| `npm run test:watch`         | `vitest` watch mode                                                              |
| `npm run test:e2e`           | `playwright test` — chromium + Pixel 7 mobile projects                           |
| `npm run test:visual`        | Visual-regression spec only (chromium). Self-skips on macOS — see §11.           |
| `npm run test:visual:update` | Regenerate visual baselines via the Playwright Docker image.                     |
| `npm run storybook`          | `storybook dev -p 6006` — local Storybook on port 6006                           |
| `npm run build-storybook`    | `storybook build` — static build to `storybook-static/`                          |

> **Always run `npm run typecheck`, `npm run lint`, `npm test`, and (for component changes) `npm run build-storybook` before reporting work as done.**

---

## 5. Routing

Remix flat-routes convention. All Remix v3 future flags are on (`v3_fetcherPersist`, `v3_relativeSplatPath`, `v3_throwAbortReason`, `v3_singleFetch`, `v3_lazyRouteDiscovery`).

**Single Fetch is on.** Loaders return raw objects (no `json()`). Use `data(payload, { headers, status })` from `@remix-run/cloudflare` only when you need to set response headers or a custom status; everything else is just `return { ... }`. The deprecated `json()` import will fail typecheck because `app/single-fetch.d.ts` augments `Future` to enable Single Fetch types.

| URL             | File                                                                      | Loader                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | [app/routes/\_index.tsx](app/routes/_index.tsx)                           | none                                                                                                                                    |
| `/education`    | [app/routes/education/index.tsx](app/routes/education/index.tsx)          | imports `public/data/education.json` server-side                                                                                        |
| `/skills`       | [app/routes/skills.\_index/index.tsx](app/routes/skills._index/index.tsx) | imports `public/data/skills.json` server-side, returns work-items + chart data + extra activities (1h cache via `data()`)               |
| `/skills/:uuid` | [app/routes/skills.\$uuid/index.tsx](app/routes/skills.$uuid/index.tsx)   | imports `public/data/skills.json` server-side, finds matching `WORK_ITEMS[id == +uuid]`, throws on miss → renders local `ErrorBoundary` |

A `/contact` route is stubbed (commented out) in the NavBar.

Loaders import the JSON directly from `public/data/` so Vite bakes it into the server bundle (Stage 7 swapped this from a request-time `fetch()`). The static asset is still served at `/data/*` for any external consumer via the `_routes.json` exclude.

---

## 6. Styling system

### Design tokens

All design tokens live in [app/styles/constants.js](app/styles/constants.js) and are injected as PostCSS `simple-vars` (e.g. `$text-color`, `$space-20`, `$desktop-small`). Unknown variable refs emit warnings — keep tokens centralized there.

### Component CSS

Each component owns its `style.css` next to its `index.tsx`, written in BEM:

```
.block-name { ... }
.block-name__element { ... }
.block-name--modifier { ... }
```

There are **two patterns** for getting that CSS to the browser. Pick the right one for the component you're adding.

#### Pattern A — postcss-import inline (default for small / always-needed components)

Stage 13 collapsed most per-component stylesheets into the consuming route's stylesheet (or the global stylesheet, for components used everywhere). The mechanism is `postcss-import`, which is already wired up in [postcss.config.js](postcss.config.js): the build expands `@import` directives at compile time, so one stylesheet ships instead of many.

The component itself just owns its `style.css`. **No `links()` export, no `?url` import.** The consumer adds an `@import` at the top of its own `style.css`:

```css
/* app/routes/skills._index/style.css */
@import '../../components/Card/style.css';
@import '../../components/Input/style.css';

.skills-route {
  /* ... */
}
```

Components currently inlined this way: `Button`, `Card`, `DownloadBtn`, `Input`, `LoadingSpinner`, `NavBar`. Buttons + NavBar are inlined into [app/styles/style.css](app/styles/style.css) since they're on every page; the rest are inlined into the routes that consume them.

#### Pattern B — Remix `links()` (lazy-loaded heavy components only)

`BarChart`, `Carousel`, and `Timeline` are JS-lazy-loaded on `/skills` via `lazy()` + `Suspense`. Their CSS still needs to land on first paint (otherwise the component flashes unstyled when its chunk arrives), so they keep the manual-CSS-preload pattern from Stage 6:

```ts
// app/components/Timeline/index.tsx
import styles from './style.css?url';

export const links = () => [
  { rel: 'preload', href: styles, as: 'style' },
  { rel: 'stylesheet', href: styles },
];
```

The consuming route then either composes the component's `links()` chain or — if statically importing the component would defeat its lazy-chunk split — pipes the CSS in as a `?url` string directly in the route's `links()`. See [app/routes/skills.\_index/index.tsx](app/routes/skills._index/index.tsx) for the latter.

#### Which pattern do I use?

- **Pattern A (postcss-import inline)** — small CSS files (≤ a few KB), components used everywhere or on a known set of routes, no JS code-split.
- **Pattern B (links())** — heavy components (vendor CSS like `react-vertical-timeline-component/style.min.css`, big chunks of recharts styling) that are _also_ JS-lazy-loaded. The trade you're making: an extra round-trip for a stylesheet, in exchange for keeping the component's JS off the eager bundle.

Whichever pattern you pick: **don't mix them on the same component.** Both an `@import` and a `links()` entry would emit the CSS twice.

The chain bottoms out at [app/root.tsx](app/root.tsx)'s `links()`, which always loads `app/styles/style.css` (containing global styles + the `@import`-inlined NavBar/Button CSS) and `app/styles/tailwind.css`.

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

### Tailwind

Tailwind v4 is installed via `@tailwindcss/postcss`, but **`corePlugins.preflight` is disabled** ([tailwind.config.ts](tailwind.config.ts#L13)) — base resets are intentionally suppressed so Tailwind utilities don't fight the BEM/PostCSS layer. Tailwind is mostly available as utility classes; the existing UI is written in BEM/PostCSS.

### Stylelint

`stylelint-config-standard` runs as part of `npm run lint` (via `lint:css`) and gates CI. Several rules are relaxed in [.stylelintrc.json](.stylelintrc.json):

- `declaration-property-value-no-unknown` and `shorthand-property-no-redundant-values` are **disabled** because stylelint's value parser doesn't understand postcss-simple-vars `$tokens`. Mixed shapes like `padding: 0 $space-5` or `border: 1px solid $alternative-green` are valid in our pipeline (postcss-simple-vars expands them at build) but stylelint reads them as unparseable. Re-enable if/when we move off `simple-vars` to native CSS custom properties.
- `color-function-alias-notation` is **disabled** — stylistic, prefers `rgb()` 4-arg over `rgba()`. We use `rgba()` consistently; flipping isn't worth the churn.
- The token-rejection set (`alpha-value-notation`, `at-rule-no-unknown`, `color-function-notation`, `color-hex-length`, `comment-empty-line-before`, `import-notation`, `length-zero-no-unit`, `media-query-no-invalid`, `selector-class-pattern`) is unchanged — pre-existing relaxations from before stylelint was gated.

If a rule starts emitting false positives on a postcss-simple-vars expansion, prefer disabling that specific rule over wrapping the value in a `/* stylelint-disable */` comment (the comment fights ESLint's import sort order in some cases and is noisier in diffs).

---

## 7. Icons (SVG → React)

1. Drop a kebab-case SVG into [app/assets/icons/](app/assets/icons/) (e.g. `new-icon.svg`).
2. Run `npm run build:svg` — SVGO optimizes the source files in place.
3. Run `npm run build:icons` — SVGR rewrites [app/components/icons/](app/components/icons/) (a PascalCase `.jsx` per SVG, plus a barrel `index.jsx`).
4. Import: `import { NewIcon } from '~/components/icons'`.

**Do not hand-edit `app/components/icons/*.jsx`** — it's regenerated and gitignored under `.eslintignore` / `.ls-lint.yml`. SVGR config: `outDir: 'app/components/icons'`, `ext: 'jsx'`, JSX runtime automatic, `svgProps: { height: '100%', role: 'img' }`.

---

## 8. Internationalization

`IntlProvider` wraps the app in [app/root.tsx](app/root.tsx) with the locale and messages chosen by the **root loader**: it calls `pickLocale(request)` from [app/intl/index.ts](app/intl/index.ts), which reads the `Accept-Language` header and returns `'en'` or `'es'` (falling back to English). Messages live next to that helper in [en-US.json](app/intl/en-US.json) and [es-ES.json](app/intl/es-ES.json).

Use one of:

- `<FormattedMessage id="KEY" />` for inline copy.
- `useIntl().formatMessage({ id: 'KEY' })` when you need a string (placeholders, aria-labels, conditional class strings).

Adding a key: append it to **both** `en-US.json` and `es-ES.json` — the registry is case-sensitive and will warn at runtime when a key is missing in one locale. Both files share the same `UPPER_SNAKE_CASE` shape; sort keys alphabetically by convention.

Adding a third locale: extend `SUPPORTED_LOCALES` and the `MESSAGES` map in `app/intl/index.ts`, drop a sibling JSON next to the existing two. There is no UI switcher today — locale is browser-driven via `Accept-Language`.

---

## 9. Data

Site content is **not in the database** — it's static JSON under `public/data/`:

- [public/data/education.json](public/data/education.json) — degree + certifications.
- [public/data/skills.json](public/data/skills.json) — `WORK_ITEMS`, `SKILLS_IMG`, `EXTRA_ACTIVITIES`.

To update content, edit those JSON files. Route loaders import them server-side (Vite bakes the JSON into the server bundle); the skills loader still caches for 1h via `Cache-Control` so the edge holds the rendered HTML.

### Skill chart is derived from `WORK_ITEMS`

The bar chart on `/skills` is **computed from `WORK_ITEMS`** by [getSkillChartData](app/utils/utils.tsx) — for every work item, every entry in its `skills` array gets credited the item's full duration (`endDate - startDate`, falling back to "now" when `endDate` is missing). Totals are summed across jobs and converted to years.

This means **the way to edit the chart is to edit the `skills` arrays of `WORK_ITEMS`**. There is no longer a separate `SKILL_CHART_DATA` block to keep in sync — that source-of-truth split was the cause of long-standing chart drift.

A small `CHART_EXCLUDE` set in `getSkillChartData` filters out filter-chip / generic skills (`Front End`, `Back End`, `Agile`, `Teaching`, `Mentoring`, `Programming`, `C`, `Leadership`, `Interviewing`, `Router`) so they don't show as bars. To exclude a new skill from the chart, add it to that set; to include a new technology, add it to the relevant work item's `skills` array.

Per-company logos live in `public/assets/img/<company-slug>.webp`. The `skills.$uuid` route resolves the image path by lowercasing `data.title` (with two hardcoded overrides for `Professor` → `unsta2.webp` and `Teacher` → `coderhouse.webp`).

The CV PDF is at [public/assets/files/gonzalo_alvarez_campos_cv.pdf](public/assets/files/gonzalo_alvarez_campos_cv.pdf) and surfaced via [DownloadBtn](app/components/DownloadBtn/index.tsx).

---

## 10. Cloudflare Pages

- [wrangler.toml](wrangler.toml) — `compatibility_date = "2024-07-18"`, `pages_build_output_dir = "./build/client"`, project name `remix-portfolio`. No bindings (KV / D1 / R2 / Durable Objects) are configured; the file is mostly commented templates.
- [functions/\[\[path\]\].ts](functions/[[path]].ts) — the catch-all Pages Function that imports the Remix server build (`../build/server`) and hands it to `createPagesFunctionHandler`. This is what runs on every request.
- [public/\_headers](public/_headers) — `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`.
- [public/\_routes.json](public/_routes.json) — invokes the Function for everything except `/favicon.ico` and `/assets/*`.
- [load-context.ts](load-context.ts) — augments `AppLoadContext` with `cloudflare: PlatformProxy<Env>`; access bindings (when any are added) via `context.cloudflare.env.*` inside loaders.

If/when env vars or bindings are added: edit `wrangler.toml`, then run `npm run cf-typegen` to regenerate [worker-configuration.d.ts](worker-configuration.d.ts).

---

## 11. Tests

Two layers, both opt-in via npm scripts and run on CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

### Pre-push hook (husky)

[.husky/pre-push](.husky/pre-push) blocks `git push` if `npm run lint`, `npm run typecheck`, or `npm test` fails. It runs the cheap-but-meaningful trio (~10s on a warm cache) so type/lint/unit regressions get caught before they reach CI. E2E + visual specs are NOT run here — they need the dev server (slow) or Docker (visual). CI is the gate of record for those.

The hook also emits a soft warning if you changed UI-affecting files (`*.css`, `app/routes/`, `app/components/`, `app/intl/`, `public/data/`, `public/fonts/`, `app/styles/`) since `origin/main` without committing any new visual baselines. It doesn't block the push — sometimes a CSS tweak is below the diff threshold, sometimes you're working on a non-UI branch — but it nudges you so you don't push, get a CI failure, then have to regenerate baselines and push again.

Bypass in an emergency with `git push --no-verify`. Prefer fixing the underlying failure to using `--no-verify`.

The hook installs automatically via `npm install` (the `prepare` script runs `husky`).

### Unit / component — Vitest + React Testing Library

- Config: [vitest.config.ts](vitest.config.ts) (happy-dom env, globals, `~/*` alias via `vite-tsconfig-paths`).
- Setup: [test/setup.ts](test/setup.ts) — adds `jest-dom` matchers, RTL `cleanup`, and stub polyfills for `ResizeObserver` and `IntersectionObserver` (recharts and `react-vertical-timeline-component` need them).
- Render helper: [test/test-utils.tsx](test/test-utils.tsx) — wraps trees in a `createMemoryRouter` data-router (so `@remix-run/react`'s `Link` works) plus an `IntlProvider` populated from `app/intl/en-US.json`.
- Tests live next to the component as `index.test.tsx`. Pattern: `app/**/*.{test,spec}.{ts,tsx}`.
- Run: `npm test` (one shot), `npm run test:watch`, `npm run test:ui`.

> **Router dedupe matters.** `react-router-dom` is pinned to an **exact** version (no caret) in `devDependencies` and must match whatever copy `@remix-run/react` ships internally. Two copies = two `Router` contexts = `useHref() may be used only in the context of a <Router> component`. When you bump `@remix-run/react`, run `npm ls react-router-dom` and re-pin our dev-dep to whatever Remix is now bundling. Current pin: `6.30.4` against `@remix-run/react@2.17.5`.

### E2E — Playwright

- Config: [playwright.config.ts](playwright.config.ts).
- Two projects: `chromium` (Desktop Chrome) and `mobile` (Pixel 7 device emulation).
- `webServer`: starts `npm run dev` on `http://localhost:8788` automatically (reuses an existing server in dev).
- `workers: 1`, `fullyParallel: false` — Vite dev's first-hit compile is slow under parallel load. Don't re-enable parallelism without switching to `npm run preview` (the built bundle).
- Specs live in [tests/e2e/](tests/e2e/), one per route or concern: `home.spec.ts`, `skills.spec.ts`, `education.spec.ts`, `navbar.spec.ts`, plus `visual.spec.ts` for screenshot-diffs (see below).
- Run: `npm run test:e2e` (both projects), `npm run test:e2e:ui` (Playwright UI mode), `--project=chromium` to limit.

### Visual regression — `visual.spec.ts`

Full-page screenshot diffs for `/`, `/skills/:uuid`, `/education`, `/education/:slug`. The `/skills` index route is excluded because recharts axis labels and the inline QR `<svg>` produce sub-pixel anti-aliasing diffs across environments — see [tests/e2e/README.md](tests/e2e/README.md#why-skills-isnt-gated) for the full reasoning. Baselines live at [tests/e2e/visual.spec.ts-snapshots/](tests/e2e/visual.spec.ts-snapshots/) and are committed for **linux only** — the spec self-skips on macOS, so `npm run test:e2e` on a Mac runs the behavioural specs only and stays green; on Ubuntu (CI) the spec runs and diffs against the committed baselines.

Why linux-only: Playwright screenshots are pixel-level. Fonts, sub-pixel anti-aliasing, and emoji rendering differ enough between macOS and Ubuntu that committing both per-platform PNGs would double the snapshot footprint without gating anything (CI is the only place that runs the assertions). The spec's `SKIP_VISUAL` flag (in [tests/e2e/visual.spec.ts](tests/e2e/visual.spec.ts)) keys off `process.platform`.

Determinism guards (set up in `prepare()` and `settle()`):

1. **`page.clock.install({ time: FIXED_NOW })`** — the /skills "Total years of experience" card and any `endDate: null` work item both call `new Date()`; without freezing, rendered text drifts every day.
2. **Animations + transitions disabled** via an injected stylesheet — recharts entrance, carousel auto-advance, the Front End / Back End neon-loop, and the vertical-timeline intersection animation would otherwise produce different pixels every run.
3. **`document.fonts.ready`** before snapshotting — Roboto loads from `/fonts/roboto/`; without this guard the first capture can land while the system fallback is still rendering.
4. **`networkidle` + 200 ms settle** for lazy chunks (BarChart, Carousel, Timeline) to land and lay out.

The carousel is masked because its scroll-x position isn't worth gating on. The bar chart is **not** masked — that's exactly what we want to catch when a token change shifts colors or a data update changes bar order.

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

- [.storybook/main.ts](.storybook/main.ts) — picks up `app/**/*.stories.@(ts|tsx|mdx)`, points the Vite builder at [.storybook/vite.config.ts](.storybook/vite.config.ts) (a clean Vite config without the `@remix-run/dev` plugin, which only works inside Remix's own pipeline). Add-ons: a11y, docs, chromatic.
- [.storybook/preview.tsx](.storybook/preview.tsx) — one global decorator wraps stories in `IntlProvider` (so `FormattedMessage` works) and a `createMemoryRouter` data router (so `@remix-run/react`'s `<Link>` doesn't trip the `useHref` invariant). Imports `app/styles/style.css` and `app/styles/tailwind.css` so design tokens render.

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
  args: {
    /* … */
  },
};
```

Hardcoded values are fine — stories are for visual review, not type guarantees. If a component crashes only inside a story, it's almost always one of: missing `IntlProvider` message key, a route-only loader being called, or recharts/Timeline needing the existing `ResizeObserver`/`IntersectionObserver` stubs (which Storybook doesn't run, but happy-dom in tests does).

> **Don't bump `eslint-plugin-storybook` independently** — it must match Storybook's major. The two are bumped together.

---

## 13. Conventions & lint rules

### File / folder naming ([.ls-lint.yml](.ls-lint.yml))

| Extension                                | Rule                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------- |
| Directories                              | `lowercase \| kebab-case` (default)                                  |
| `app/components/*` dirs                  | `lowercase \| PascalCase` (allows consecutive caps, e.g. `BarChart`) |
| `app/routes/*` dirs                      | `[a-zA-Z\$-_.]+` (Remix flat-route chars: `$`, `-`, `_`, `.`)        |
| `.js`, `.ts`                             | `lowercase \| kebab-case`                                            |
| `.jsx`, `.tsx`                           | `lowercase \| PascalCase`                                            |
| `.css`, `.svg`, `.html`, `.png`, `.webp` | `lowercase \| kebab-case`                                            |

### TypeScript

- Path alias `~/*` resolves to `app/*` (configured in both `tsconfig.json` and `jsconfig.json` for tooling that doesn't speak TS).
- `strict: true`, `isolatedModules: true`, `noEmit: true` — Vite owns the build.
- Types: `@remix-run/cloudflare`, `vite/client`, `@cloudflare/workers-types/2023-07-01`.

### ESLint highlights ([.eslintrc.cjs](.eslintrc.cjs))

- Extends `airbnb` + `airbnb/hooks` + `plugin:react/recommended` + `plugin:jsx-a11y/recommended` + `prettier`.
- `simple-import-sort/imports` and `simple-import-sort/exports` are **errors** — let the editor's organize-imports do this.
- `no-console` allows `warn`, `error`, `info` only.
- `react/jsx-props-no-spreading` is **off** — spread props freely.
- `react/require-default-props` is on with `functions: 'defaultArguments'` — give optional props a default in the function signature, not via `defaultProps`.
- `comma-dangle: always-multiline` for arrays/objects/imports.
- `_`-prefixed identifiers are ignored by `no-unused-vars`.

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
3. Default-export the component. **No `links()` export by default** — the consuming route's stylesheet inlines the CSS via `@import` (Pattern A in §6). Only export `links()` if the component is JS-lazy-loaded and needs the manual-CSS-preload pattern (Pattern B). When in doubt, default to Pattern A.
4. Type props inline (`type FooProps = { ... }`) and give optional props defaults in the parameter destructure (so `react/require-default-props` is satisfied).
5. Use `~/components/icons` for any iconography rather than inlining SVG.
6. For links, prefer `<Link to=...>` from `@remix-run/react`; use [ConditionalLink](app/components/ConditionalWrapper/index.tsx#L32) when an element should only become a link under some condition.
7. For copy, use `react-intl` — never hardcode user-facing strings.

When adding a new route:

1. Create `app/routes/<flat-route-name>/index.tsx` (or `<flat-route-name>.tsx`).
2. Export `loader` if you need data — `import` the JSON from `public/data/` directly (Vite bakes it into the server bundle, no HTTP hop). Single Fetch is on, so return a raw object; use `data(payload, { headers })` from `@remix-run/cloudflare` only when you need to set response headers or a custom status.
3. Add a `style.css` next to the route if it has styles, and `@import` any small components it consumes at the top of that file (see §6 Pattern A). Export `links` listing the route's own stylesheet plus any Pattern B (lazy-loaded) component stylesheets.
4. Add a NavBar entry in [app/components/NavBar/index.tsx](app/components/NavBar/index.tsx) `MAIN_NAV` if the route should be reachable from the nav.
5. Optionally export a route-local `ErrorBoundary` (skills.\$uuid does this).

---

## 15. Gotchas

- **Tailwind preflight is disabled** — don't expect Tailwind to reset margins / box-sizing / etc. Existing global resets live in [app/styles/style.css](app/styles/style.css).
- **`app/components/icons/` is generated** — it's in `.eslintignore` and `.ls-lint.yml`'s ignore list, and the lint pipeline will fail if you check it in by hand with bad names. Always go through SVGR.
- **`legacy-peer-deps=true`** is on (`.npmrc`) because of mismatched React-major peer ranges between deps (e.g. `@types/react@19` while `react@18` is installed). Don't remove it without testing `npm install` end-to-end.
- **`react-is` is a direct dep** because `recharts` requires it at runtime but doesn't list it in its own dependencies. Don't try to drop it — tests fail with `Cannot find module 'react-is'`.
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
- Remix docs: <https://remix.run/docs>
- Cloudflare Pages docs: <https://developers.cloudflare.com/pages/>
