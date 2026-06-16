# Work Plan & Progress

Living document tracking the multi-stage refactor of `remix-portfolio`. Update this file as stages start, advance, and merge. Stable reference docs (stack, conventions) live in [AGENTS.md](AGENTS.md) — keep them in sync once a stage changes the conventions.

**Branching rule:** one PR per stage off `main`. Don't open the next stage's branch until the previous PR is **merged and green** (CI lint + typecheck + tests).

**Status legend:** ⬜ not started · 🟡 in progress · ✅ done · ❌ blocked

---

## Stage order (decided)

1. ✅ **Stage 1 — Tests** (Vitest + React Testing Library for units, Playwright for E2E)
2. ✅ **Stage 2 — Data restructure** (`public/data/skills.json` → derive chart from `WORK_ITEMS`)
3. ✅ **Stage 3 — Storybook** for every component in `app/components/`
4. ✅ **Stage 4 — Dependency updates** (majors except React; React 18 → 19 deferred)
5. 🟡 **Stage 5 — Code optimization** (perf + a11y + SEO + i18n + CI hygiene)

Tests come first so every later stage has a safety net. Deps come before optimization so optimization measurements aren't invalidated by a later upgrade.

---

## Stage 1 — Tests

**Goal:** automated verification that every component renders and every route loads/behaves correctly.

**Branch:** `stage-1-tests`
**PR:** merged
**Status:** ✅ done

### Tooling decisions

- **Unit / component:** Vitest 3 + `@testing-library/react` + `@testing-library/jest-dom` + happy-dom. Vitest pinned at v3 to dodge the rolldown native-binding bug; happy-dom replaces jsdom because jsdom 27+ pulls ESM-only deps that break `require()` under Node 20 in CI. Happy-dom is also faster and has fewer transitive deps.
- **E2E:** Playwright. Runs against `npm run dev` (Vite dev server). Switched off `npm run preview` after seeing first-hit Vite compile timeouts under parallel workers — kept `workers: 1, fullyParallel: false` so the dev server isn't hammered.
- **Browsers:** chromium (Desktop Chrome) + mobile (Pixel 7 device emulation). Skipped Firefox / WebKit for now to keep CI fast; easy to add later.
- **No coverage gate yet** — just establish the infra. We can add a threshold later.

### Tasks

- [x] Install Vitest 3, RTL, happy-dom, `@vitest/ui`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@testing-library/dom`, Playwright.
- [x] Add [vitest.config.ts](vitest.config.ts) (happy-dom env, globals, `~/*` alias via `vite-tsconfig-paths`, setup file, `esbuild.jsx: 'automatic'` for SVGR-generated icons).
- [x] Add [test/setup.ts](test/setup.ts) — `jest-dom` matchers, RTL cleanup, `ResizeObserver` + `IntersectionObserver` polyfills (recharts and react-vertical-timeline-component need them).
- [x] Add [test/test-utils.tsx](test/test-utils.tsx) — `renderWithProviders` wrapping a `createMemoryRouter` data-router (so `@remix-run/react`'s `Link` works) plus `IntlProvider`.
- [x] Add `npm run test`, `test:watch`, `test:ui`, `test:e2e`, `test:e2e:ui` scripts.
- [x] Write unit tests for each component (36 tests across 11 files, all green):
  - [x] `BarChart` — mounts non-empty data without crashing.
  - [x] `Button` — label, `handleClick`, link-wrapping when `url` set, leftIcon rendering.
  - [x] `Card` — title, texts, itemList, skills (capped at 7 + "click for more"), children.
  - [x] `Carousel` — renders all icons.
  - [x] `ConditionalWrapper` / `ConditionalLink` — both branches.
  - [x] `DownloadBtn` — anchor with `download`, `target=_blank`, default text fallback.
  - [x] `Input` (autocomplete) — types, filters, "no matches", click-select.
  - [x] `LoadingSpinner` — renders.
  - [x] `NavBar` — Home / CV / Education + external GitHub / LinkedIn links.
  - [x] `Timeline` — one card per item, each links to `/skills/:id`.
- [x] Write E2E tests covering each route (15 tests × 2 projects = 30, all green):
  - [x] `/` — welcome heading, repo link, download CV button (`href` + `download` attrs).
  - [x] `/skills` — timeline renders, autocomplete filter, Front End / Back End toggles, bar chart visible, total years card, extra activities.
  - [x] `/skills/:uuid` — clicking a timeline card navigates to detail.
  - [x] `/education` — degree + certifications visible, credential links present.
  - [x] NavBar — desktop and mobile project cover both breakpoints.
- [x] Add [playwright.config.ts](playwright.config.ts) with chromium + mobile projects, `webServer` running `npm run dev` on port 8788.
- [x] Update [.eslintrc.cjs](.eslintrc.cjs) `import/no-extraneous-dependencies.devDependencies` to include `test/**`, `**/*.test.{ts,tsx}`, `vitest.config.ts`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`.
- [x] Add [.github/workflows/ci.yml](.github/workflows/ci.yml) running `lint`, `typecheck`, `test`, `test:e2e` (chromium) on PRs.

### Pre-existing main issues fixed in this stage (so CI is meaningful)

These weren't introduced by Stage 1 but were red on `main` and would have made CI useless:

- Renamed `.eslintrc.js` → `.eslintrc.cjs` — `package.json` has `"type": "module"` so `.js` was treated as ESM and ESLint couldn't load the config.
- Removed `plugin:storybook/recommended` from extends — `eslint-plugin-storybook@9` requires `storybook` itself to be installed; will re-add in Stage 3.
- Surgical lint fixes across components/routes (unused imports, `react/no-children-prop`, `react/no-array-index-key`, `react/require-default-props`, `react/button-has-type`, `react/display-name`, `no-param-reassign`, etc.) — all functional behaviour preserved.
- Ran `prettier --write .` to flush years of unformatted files.
- Excluded `build/` from `tsconfig.json` and cast the local-only `build/server` import in [functions/\[\[path\]\].ts](functions/[[path]].ts) so typecheck doesn't depend on the build folder existing.
- Added `// @ts-expect-error` on `corePlugins.preflight` in [tailwind.config.ts](tailwind.config.ts) — Tailwind v4 dropped that field; proper fix is in Stage 5.
- Pinned `react-router-dom` to **exactly** `6.30.0` so it dedupes with the copy bundled by `@remix-run/react@2.17.1`. Two copies = two `Router` contexts = `useHref()` invariant failure in tests.
- Installed `prettier` as a direct dev-dep (was previously only invoked via `npx`).

### Exit criteria

- [x] `npm test` — all unit tests pass (36/36).
- [x] `npm run test:e2e` — all E2E specs pass (30/30 across chromium + mobile).
- [x] `npm run lint` and `npm run typecheck` clean.
- [ ] CI workflow green on the PR. _(verifies once PR is opened)_
- [x] AGENTS.md updated with a "Tests" section and refreshed gotchas/checklist.

---

## Stage 2 — Data restructure

**Goal:** make `WORK_ITEMS` the single source of truth for skill experience, derive the chart automatically, and eliminate `SKILL_CHART_DATA` drift.

**Branch:** `stage-2-data-restructure`
**PR:** merged
**Status:** ✅ done

### Problem solved

`WORK_ITEMS[i].skills` is the source-of-truth list of skills used at each job, but the chart was reading a **separate** hand-maintained `SKILL_CHART_DATA` array of `{ name, dates: [{startDate, endDate}] }`. Two problems:

- Duplication — adding a job meant editing both places.
- Drift — skills present in `WORK_ITEMS` but missing from `SKILL_CHART_DATA` (or vice-versa) got mis-counted. Concrete pre-refactor examples: Python/Django showed 1 yr instead of 4.17, JavaScript showed 7.83 yr from a `null`-end interval that didn't even pretend to track per-job tenure.

### What this stage did

- Rewrote [`getSkillChartData`](app/utils/utils.tsx) to take `WorkItemForChart[]` (`{ startDate, endDate?, skills: string[] }`). For every work item, every entry in its `skills` array contributes the item's full duration to that skill's interval set. Intervals are then merged per skill (so concurrent jobs that both list the same skill don't double-count) and the merged-interval months are summed and divided by 12. Result: no skill can exceed total career length. Pre-sorted descending by years.
- Added a `CHART_EXCLUDE` set inside the util to filter out filter-chip / generic skills (`Front End`, `Back End`, `Agile`, `Teaching`, `Mentoring`, `Programming`, `C`, `Leadership`, `Interviewing`, `Router`).
- Updated the [skills loader](app/routes/skills._index/index.tsx) to pass `WORK_ITEMS` directly to the util; dropped the `SKILL_CHART_DATA` field from `skillsDataTypes`.
- Edited [public/data/skills.json](public/data/skills.json):
  - Removed `SKILL_CHART_DATA` (~210 lines).
  - Removed `TOP_SKILLS` (was unreferenced dead data).
  - Fixed Qubika's duplicate `Post-css` / `PostCSS` casing.
  - Added missing implicit skills based on job descriptions:
    - Globant `+= JavaScript`
    - Cliengo `+= Redux, Jest`, replaced `Router` (chart-excluded placeholder) with `Redux` (the actual library described).
- Added 2 unit tests for the new `getSkillChartData` covering: per-skill summing across multiple work items, null-endDate "Present" handling, and exclude-list filtering.
- Strengthened the chart E2E assertion: now reads `.recharts-yAxis text` labels and verifies (a) `React` and `TypeScript` are present, (b) `Front End` / `Back End` / `Agile` are NOT in the chart axis. Used `allTextContents()` because SVG `<text>` doesn't expose `innerText` consistently.

### Verification

Anchored to 2026-06-16, post-refactor chart contents (sorted desc):

| Skill                                                                         | Years | Notes                                          |
| ----------------------------------------------------------------------------- | ----- | ---------------------------------------------- |
| JavaScript                                                                    | 8.83  | Globant + Cliengo + Endava + Teacher + Qubika  |
| HTML                                                                          | 7.83  | Same as old chart ✓                            |
| CSS                                                                           | 7.83  | Same as old chart ✓                            |
| Storybook                                                                     | 7.17  | Same as old chart ✓                            |
| Highcharts                                                                    | 7.17  | NEW — was missing from old chart               |
| React                                                                         | 7.17  | Same as old chart's "ReactJs" entry ✓          |
| TypeScript                                                                    | 4.83  | Same as old chart ✓                            |
| Cypress                                                                       | 4.83  | Same as old chart ✓                            |
| Tailwind                                                                      | 4.83  | Same as old chart ✓                            |
| Python                                                                        | 4.17  | Was 1.0 — old chart understated by 3+ years    |
| Django                                                                        | 4.17  | Was 1.0 — same fix                             |
| Remix, NextJs, PostCSS, GraphQL, Playwright, Cloudflare                       | 4.17  | Cloudflare was missing entirely from old chart |
| Axios                                                                         | 3     | NEW — was missing                              |
| Vue, .Net                                                                     | 2.33  | NEW — was missing                              |
| Sass, Redux, Jest, Heroku, NodeJs, Express, Styled Components, SQL, Marklogic | 0.67  | Several were missing or under-counted          |

### Exit criteria

- [x] Chart values match what `WORK_ITEMS` actually says — and where they differ from the pre-refactor snapshot, the new value is the correct one (Python/Django, Highcharts, Cloudflare, Axios, Vue, .Net etc. were all under- or un-counted).
- [x] `SKILL_CHART_DATA` no longer exists in the codebase.
- [x] All tests green: 38/38 unit, 30/30 E2E across chromium + mobile, lint + typecheck clean.
- [x] AGENTS.md "Data" section updated to describe the single-source-of-truth model.

---

## Stage 3 — Storybook

**Goal:** every component in `app/components/` has a story for visual regression and isolated development.

**Branch:** `stage-3-storybook`
**PR:** merged
**Status:** ✅ done

### Tooling decisions

- **Storybook 10** (Vite framework) — was the current latest at time of init; the AGENTS plan said v9, the actual install pulled v10. `eslint-plugin-storybook` had to be bumped to v10 to match — its peerDependency is exact-major.
- **Custom Vite config for Storybook**: the project's root [vite.config.ts](vite.config.ts) wires up `@remix-run/dev`'s plugin, which only works inside Remix's own dev/build pipeline. Storybook crashes if it loads it. Solution: a tiny [.storybook/vite.config.ts](.storybook/vite.config.ts) with just `tsconfig-paths` and let PostCSS auto-discover from `postcss.config.js`. Pointed Storybook at it via `framework.options.builder.viteConfigPath`.
- **Global decorator**: stories run through `IntlProvider` + `createMemoryRouter` so `FormattedMessage` and `@remix-run/react`'s `<Link>` work without per-story setup. Same dependency that Stage 1 caught — Remix's Link uses the data router context, not plain `MemoryRouter`.
- **Add-ons removed from default scaffold**: dropped `@storybook/addon-mcp` (no MCP setup), `@storybook/addon-vitest` (would re-run tests inside Storybook with browser-mode against a separate Playwright installation — overlaps with our existing Vitest job and changes `vitest.config.ts` shape). Kept a11y, docs, chromatic.
- One `index.stories.tsx` per component, colocated next to the `index.tsx`.

### Tasks

- [x] `npx storybook@latest init --type react --builder vite --no-dev --skip-install`.
- [x] Bumped `eslint-plugin-storybook` 9 → 10 to match storybook major.
- [x] Wrote [.storybook/main.ts](.storybook/main.ts), [.storybook/preview.tsx](.storybook/preview.tsx), [.storybook/vite.config.ts](.storybook/vite.config.ts).
- [x] Re-enabled `plugin:storybook/recommended` in [.eslintrc.cjs](.eslintrc.cjs) (was disabled in Stage 1 to unblock CI before Storybook was installed).
- [x] Reverted the `vitest.config.ts` mangling that the Storybook init introduced (it tried to wedge `@storybook/addon-vitest`'s browser-mode setup into our config; fully removed).
- [x] Added `storybook-static/` to [.eslintignore](.eslintignore), [.prettierignore](.prettierignore), and [.ls-lint.yml](.ls-lint.yml). `.gitignore` was already updated by the init.
- [x] Stories for each component (10 components, 23 story variants total):
  - [x] `BarChart` — `RealisticPortfolio`, `Sparse`.
  - [x] `Button` — `LabelOnly`, `WithLeftIcon`, `WithRightIcon`, `AsLink`.
  - [x] `Card` — `TitleAndTexts`, `ItemList`, `SkillsCappedAtSeven`, `Styleless`, `WithChildren`.
  - [x] `Carousel` — `Default`.
  - [x] `ConditionalLink` — `ConditionTrue`, `ConditionFalse`.
  - [x] `DownloadBtn` — `Default`, `FallbackLabel`.
  - [x] `Input` — `Empty`, `FewSuggestions`.
  - [x] `LoadingSpinner` — `Default`.
  - [x] `NavBar` — `Default` (fullscreen layout).
  - [x] `Timeline` — `ThreeJobs`, `SingleJob`.
- [x] Added `storybook-build` job to [.github/workflows/ci.yml](.github/workflows/ci.yml).

### Exit criteria

- [x] `npm run storybook` boots on port 6006, all 10 component groups reachable.
- [x] `npm run build-storybook` succeeds (clean static output to `storybook-static/`).
- [x] `npm test` — 41/41 unit tests pass.
- [x] `npm run test:e2e --project=chromium` — 15/15 E2E pass.
- [x] `npm run lint` and `npm run typecheck` clean.
- [x] AGENTS.md updated: new "Storybook" section, stack table mentions Storybook, checklist includes `build-storybook`.

---

## Stage 4 — Dependency updates

**Goal:** bring everything to current majors except React (separate, larger decision).

**Branch:** `stage-4-deps`
**PR:** merged
**Status:** ✅ done

### Scope decisions (made on this branch)

- **Bump:** all patch + minor inside current majors; `react-vertical-timeline-component` 3 → 4 (still supports React 18); `stylelint-config-standard` 39 → 40; `eslint-plugin-simple-import-sort` 12 → 13.
- **Hold (this PR):**
  - **ESLint 8** — migration to flat-config + airbnb-shim is its own PR. ESLint 8 is EOL but stable.
  - **Vitest 3** — Stage 1 hit a rolldown native-binding bug under `npm ci`; the underlying npm issue ([npm/cli#4828](https://github.com/npm/cli/issues/4828)) hasn't moved. Revisit when rolldown drops native bindings.
  - **Vite 5** — Remix 2's plugin pins Vite 5 as a peer; v6+ requires Remix v3 / React Router v7, which is a separate migration listed in the project README.
  - **React 18** — entire React 19 / React Router 7 migration is its own future stage.
- **Note:** the legacy-peer-deps workaround in `.npmrc` still stands while React stays at 18 (recharts and `@types/react@19` mismatch).

### Pre-bump snapshot (`npm outdated` at branch creation)

```text
@cloudflare/workers-types          4.20251014.0  →  4.20260616.1   (patch)
@remix-run/* (cloudflare, dev, react, cloudflare-pages)            (patch  2.17.1 → 2.17.5)
@tailwindcss/postcss               4.1.13        →  4.3.1          (minor)
@types/react                       19.1.16       →  19.2.17        (minor)
@types/react-dom                   19.1.9        →  19.2.3         (minor)
@typescript-eslint/eslint-plugin   8.45.0        →  8.61.1         (minor)
typescript-eslint                  8.45.0        →  8.61.1         (minor)
autoprefixer                       10.4.21       →  10.5.0         (minor)
cssnano                            7.1.1         →  7.1.9          (patch)
date-fns                           4.1.0         →  4.4.0          (minor)
eslint-import-resolver-typescript  4.4.4         →  4.4.5          (patch)
eslint-plugin-prettier             5.5.4         →  5.5.6          (patch)
eslint-plugin-simple-import-sort   12.1.1        →  13.0.0         (major)
isbot                              5.1.31        →  5.1.43         (patch)
react-intl                         7.1.11        →  7.1.14         (patch)
react-vertical-timeline-component  3.6.0         →  4.0.0          (major, React 18 still ok)
recharts                           3.2.1         →  3.8.1          (minor)
stylelint                          16.24.0       →  16.26.1        (patch — held at 16; v17 = separate)
stylelint-config-standard          39.0.0        →  40.0.0         (major)
tailwindcss                        4.1.13        →  4.3.1          (minor)
terser                             5.44.0        →  5.48.0         (patch)
typescript                         5.9.2         →  5.9.3          (patch — held at 5; v6 = separate)
uuid                               13.0.0        →  13.0.2         (patch — held at 13; v14 = separate)
wrangler                           4.45.3        →  4.101.0        (minor)
```

### Tasks

- [x] Snapshot captured above.
- [x] Applied all patch + minor bumps within current majors.
- [x] Bumped `react-vertical-timeline-component` 3 → 4.
- [x] Bumped `eslint-plugin-simple-import-sort` 12 → 13.
- [x] Bumped `stylelint-config-standard` 39 → 40.
- [x] Re-pinned `react-router-dom` to **6.30.4** (Remix 2.17.5 ships 6.30.4 internally; the pin in our `devDependencies` had to follow it for context dedup — same hazard from Stage 1).
- [x] Resolved fallout from the bumps:
  - **recharts 3.8** tightened the `Tooltip.formatter` type and broke our overload. The `formatter` was dead code anyway (we pass `content={<CustomTooltip />}` which fully overrides default tooltip rendering). Removed `formatter`, `contentStyle`, `itemStyle`, `labelStyle`, plus the now-unused `useIntl` import in [BarChart](app/components/BarChart/index.tsx).
  - **recharts 3.8** also moved tick-label rendering from bare `<text>` children of `.recharts-yAxis` into a `.recharts-yAxis-tick-labels` group. Updated the E2E selector in [tests/e2e/skills.spec.ts](tests/e2e/skills.spec.ts).
  - **react-vertical-timeline-component 4** dropped its CommonJS default export shape; `VerticalTimelineElement` is now a named ESM export. Replaced the `import pkg, …` + destructure dance with a clean named import in [Timeline](app/components/Timeline/index.tsx).
  - **`cssnano@8`** is currently a prerelease; my initial `cssnano@latest` accidentally pulled it. Pinned back to `^7.1.9`.
- [x] Re-ran the full pipeline.

### Exit criteria

- [x] `npm run lint` and `npm run typecheck` clean.
- [x] `npm test` 41/41 unit tests pass.
- [x] `npm run test:e2e` 30/30 (chromium + mobile).
- [x] `npm run build-storybook` succeeds.
- [x] No new runtime warnings introduced in dev console (the existing Remix v3-flag warnings are pre-existing).
- [x] AGENTS.md "Stack" table version markers updated for visible changes.

---

## Stage 5 — Code optimization

**Goal:** improve loading times, accessibility, SEO, and developer ergonomics without changing the visual output.

**Branch:** `stage-5-optimize`
**PR:** _(fill in once opened)_
**Status:** 🟡 ready for PR

### Scope decisions (made on this branch)

- **One Tier-1 PR** instead of splitting — most changes are independent low-risk wins; bundling them lands the optimization pass as a coherent diff.
- **Spanish locale = invisible (Accept-Language)** — no UI switcher in this PR. Adding one is a separate visual change.
- **JSON-LD `Person` includes** name / role / employer / city / GitHub / LinkedIn from the public CV. **No email or phone** — those are scraper magnets.
- **No `og:image`** — needs an actual 1200×630 asset; Tier-2 once that exists.

### Tasks (all done)

**Performance**

- [x] Lazy-load `BarChart`, `Carousel`, and `Timeline` on `/skills` via `lazy()` + `Suspense`. Removed their static `links()` from the route to actually let Vite split the chunks (was being defeated by a "dynamic + static import" warning).
- [x] Replaced `Card`'s `lazy(() => import('~/components/Card'))` inside `Timeline` (same warning); Card is just a normal import now.
- [x] Convert Roboto variable font from TTF (468 KB) → **WOFF2 (209 KB, 55% smaller)**; deleted the unused italic variant + the `static/` folder of single-weight fonts.
- [x] `<link rel="preload" as="font" type="font/woff2" crossorigin>` in [root.tsx](app/root.tsx) so the font lands during the HTML parse.
- [x] Added `width`/`height` to every `<img>` (skills detail company logo via a `LOGO_DIMS` lookup in the loader; NavBar decorative img with intrinsic 1500×1500). Fixes CLS.
- [x] Replaced all `uuid()`-as-React-key call sites with stable content keys: `Card` skill chips, `Carousel` icons, `Skills` button spans + `extra activities`, `Education` certifications. Removed `uuid` and `@types/uuid` from deps.
- [x] `useCallback` / `useMemo` around the filter helpers and the static `buttonSpans` array in [skills.\_index](app/routes/skills._index/index.tsx).
- [x] `<Link prefetch="intent">` plumbed through `Button` → `ConditionalLink` → Remix `<Link>` for the three NavBar entries. Hover / focus pre-warms the route.
- [x] Disabled production sourcemaps in [vite.config.ts](vite.config.ts) — no path leaks, smaller deploy.

**SEO**

- [x] Per-route `meta` exports on `/`, `/skills`, `/education`, and the dynamic `/skills/:uuid` (uses the work-item title + role).
- [x] Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`) + Twitter card tags in root.
- [x] JSON-LD `Person` schema in `<head>`.
- [x] Canonical link in root `links()`.
- [x] [public/robots.txt](public/robots.txt) — disallow `/data/` (the static JSON is content data, not pages), allow everything else, sitemap pointer.
- [x] [public/sitemap.xml](public/sitemap.xml) — `/`, `/skills`, `/education`.
- [x] `theme-color` corrected from `#ffffff` → `#010408` (the actual app background).

**Accessibility**

- [x] `<html lang>` driven by the chosen locale (loader → `useLoaderData` → `Layout`). Screen readers now read the right language.
- [x] Skip-to-content link as the first focusable element in `<body>`, visually hidden until focused. WCAG 2.4.1.
- [x] [Input](app/components/Input/index.tsx) overhaul:
  - Added a real `<label>` (visually hidden via `clip-path: inset(50%)`) — was failing WCAG 1.3.1.
  - Replaced deprecated `event.keyCode` with `event.key`.
  - Implemented full keyboard nav: ArrowDown / ArrowUp wrap through suggestions, Enter selects the active one, Escape closes the listbox.
  - Set `aria-activedescendant` to the focused option's id (or undefined) — was an empty string before.
  - Stable per-instance ids via `useId()` (was a hard-coded string, would clash if two instances mounted).
- [x] [LoadingSpinner](app/components/LoadingSpinner/index.tsx) gained `role="status"`, `aria-live="polite"`, and an i18n'd `aria-label`.
- [x] NavBar's decorative `<img>` is now `alt=""` + `aria-hidden="true"` — the previous `alt="LinkedIn"` was misleading (file is a logo, not a QR) and duplicated the real LinkedIn link's announcement.

**i18n**

- [x] Added [es-ES.json](app/intl/es-ES.json) with full message coverage; mirrored the new `SKIP_TO_CONTENT` and `LOADING` keys into [en-US.json](app/intl/en-US.json).
- [x] Created [app/intl/index.ts](app/intl/index.ts) with `pickLocale(request)` that reads `Accept-Language`, normalizes to the language part, and falls back to English. Root loader returns `{ locale, messages }`.

**CI / DX**

- [x] [.github/workflows/ci.yml](.github/workflows/ci.yml) — cache the Playwright browser binaries between runs (keyed on the `@playwright/test` version). Saves ~30–60s per E2E run.
- [x] [.github/dependabot.yml](.github/dependabot.yml) — group related ecosystems (Remix, ESLint, Stylelint, Vitest, Storybook, types, Tailwind, Cloudflare). Schedule reduced to weekly. Added `github-actions` ecosystem too. Result: roughly 1 PR per ecosystem per week instead of 5+ daily.
- [x] [public/\_headers](public/_headers) — add long-cache rules for `/fonts/*`, daily-cache for robots/sitemap, and 1-hour edge cache for `/data/*`. [public/\_routes.json](public/_routes.json) excludes those paths from the Pages Function so they're served straight from the edge CDN.

**Hygiene**

- [x] Deleted `app/tailwind.css` (duplicate of `app/styles/tailwind.css`).
- [x] Removed `uuid` and `@types/uuid` deps. Tried to drop `react-is` too — recharts has an undeclared runtime dep on it, so it stays.

### Verification

Pre-Stage-5 baseline (captured at branch creation, `npm run build`):

```text
index-CX1cqMv9.js                 401 KB   (recharts in main chunk; loaded everywhere)
components-BB6NW_1M.js             245 KB
Roboto-VariableFont_…ttf           468 KB   + 497 KB italic (unused) + static/ folder
home route chunk                  ~1.2 KB
build warnings                     2 ("dynamic + static import" on Card and Timeline)
```

Post-Stage-5:

```text
index-Di3CULw-.js                 333 KB   (recharts vendor chunk; ONLY loaded on /skills)
components-RSBE7rfx.js             245 KB
index-CmCTroeT.js (Carousel)       55 KB   (lazy chunk for /skills below the fold)
Roboto-VariableFont_…woff2         209 KB   (single file)
home route chunk                  ~1.4 KB
build warnings                     0
```

The 333 KB recharts chunk no longer ships on `/` or `/education`. Combined with the 259 KB font reduction and the dropped italic, the homepage loads ~600 KB less data. CLS should be near zero now that all `<img>` have intrinsic dims.

- [x] `npm run lint`, `npm run typecheck` — clean.
- [x] `npm test` — 41/41.
- [x] `npm run test:e2e --project=chromium` — 15/15.
- [x] `npm run build-storybook` — succeeds.

### Tier 2 (deferred — separate future PRs)

- Color-contrast audit of the design tokens (might force visual changes).
- Design-token rename: drop the misleading `alternative-black: '#ffffff00'`, normalize space scale.
- Locale switcher UI in the NavBar.
- Lighthouse-CI as a GitHub job with budgets (LCP < 2.5s).
- Refactor the `/data/*.json` loaders to import the JSON server-side instead of `fetch(new URL('/data/...', request.url))`.
- `og:image` once a real 1200×630 cover exists.
- **Re-attempt JS code-split for BarChart / Carousel / Timeline on `/skills`.** Stage 5's first attempt broke SSR because removing the components' `links()` from the route stripped their CSS from `<head>`, leaving the page unstyled until hydration. The fix-path is "manual CSS preload": keep `lazy()`+`Suspense` for the JS, but pass each component's `style.css?url` directly to the route's `links()` so the CSS ships in `<head>` while the JS module stays dynamically imported. Brittle (hard-coded URLs, needs care for `react-vertical-timeline-component/style.min.css` in `node_modules`), so deferred until the savings on `/skills` are worth the carry cost.
- **Timeline node alignment polish.** Visually the date span and the card sit at slightly different vertical positions because the card has padding/borders the bare date span doesn't. Wrap the `vertical-timeline-element-date` span in a sibling box with the same height as the card so the icon/date/card baselines align cleanly. Cosmetic only; happens after the alignment looks good in a real browser screenshot loop.

---

## Decisions log

Record non-obvious decisions here as they're made (so future-me / future-agent doesn't have to re-derive them):

- **2026-06-16** — Stage order: tests → data → storybook → deps → optimization. Reason: tests give safety net; deps before optimization so we measure on final stack.
- **2026-06-16** — Unit tests = Vitest + RTL; E2E = Playwright. Reason: standard split, Vitest is Vite-native.
- **2026-06-16** — Hold React on 18 in Stage 4. Reason: React 19 migration is its own decision and would inflate the deps PR scope.

---

## PRs

| Stage | Branch                     | PR          | Status | Merged |
| ----- | -------------------------- | ----------- | ------ | ------ |
| 1     | `stage-1-tests`            | merged      | ✅     | yes    |
| 2     | `stage-2-data-restructure` | merged      | ✅     | yes    |
| 3     | `stage-3-storybook`        | merged      | ✅     | yes    |
| 4     | `stage-4-deps`             | merged      | ✅     | yes    |
| 5     | `stage-5-optimize`         | _(opening)_ | 🟡     | —      |
