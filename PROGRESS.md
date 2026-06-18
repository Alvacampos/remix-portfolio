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
5. ✅ **Stage 5 — Code optimization** (perf + a11y + SEO + i18n + CI hygiene)
6. ✅ **Stage 6 — Tier-2 follow-ups** (token cleanup, JS code-split (re-attempted), timeline alignment)
7. ✅ **Stage 7 — Tier-2 round 2** (server-side `/data/*.json` import to remove a request-time HTTP hop)
8. ✅ **Stage 8 — Dep maintenance** (patch + minor bumps inside current majors; cleared the Dependabot backlog)
9. ✅ **Stage 9 — Single Fetch** (opted into `future.v3_singleFetch`; replaced deprecated `json()` with raw objects + `data()` for headers)
10. ✅ **Stage 10 — Lazy route discovery** (opted into `future.v3_lazyRouteDiscovery`; cleared the last future-flag warning)
11. ✅ **Stage 11 — Doc sync** (caught AGENTS.md and PROGRESS.md up to what the code actually does after Stages 7–10 merged; no code changes)
12. ✅ **Stage 12 — A11y / SEO quick wins** (per-route canonical + SVGR aria-hidden default, fixed two regressions from the post-Stage-10 Lighthouse run)
13. ✅ **Stage 13 — LCP recovery** (collapsed 12 render-blocking stylesheets on `/skills` to 7 by inlining small-component CSS into route stylesheets via postcss-import; dropped 5 components' `links()` exports)
14. 🟡 **Stage 14 — Doc sync + post-Stage-13 Lighthouse capture** (record the actual Stage 12+13 perf delta; bring AGENTS.md §6/§14 in line with the new CSS conventions)

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
**PR:** merged
**Status:** ✅ done

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

### Tier 2 (status as of Stage 6)

Done in [Stage 6](#stage-6--tier-2-follow-ups):

- ✅ Color-contrast audit (no fixes needed — every text/icon pair passes WCAG AA by 3–4×).
- ✅ Design-token cleanup (dropped 7 unused tokens including the misleading `alternative-black: '#ffffff00'`).
- ✅ JS code-split for BarChart / Carousel / Timeline on `/skills` via the manual CSS-preload pattern.
- ✅ Timeline icon / date / card alignment polish.

Still deferred:

- Locale switcher UI in the NavBar (visual decision; current Spanish via `Accept-Language` works fine).
- Lighthouse-CI as a GitHub job — needs Cloudflare preview URL plumbing.
- Refactor `/data/*.json` loaders to import server-side (small win, real blast radius).
- `og:image` once a real 1200×630 cover exists.
- Space-scale token rename (`space-200` → `space-xl` etc.) — every used token has many call sites; rename costs more than it pays.

---

## Stage 6 — Tier-2 follow-ups

**Goal:** revisit Tier-2 follow-ups from Stage 5 that became viable on a second pass.

**Branch:** `stage-6-tier-2`
**PR:** merged
**Status:** ✅ done

### What this stage did

- **Color-contrast audit.** Wrote a one-off Node script that runs WCAG luminance math over every fg/bg token pair the app actually uses. Result: every text/icon/control combination passes AA — most by 3–4× the minimum (`text-color` on `background-default` = 18.87:1). The only failure was a decorative `card-border` line at 1.42 vs. an arbitrary 1.5 target I had set; WCAG doesn't require borders to meet contrast. **No fixes needed.**
- **Token cleanup.** Removed 7 unused tokens from [app/styles/constants.js](app/styles/constants.js): `alternative-white`, `alternative-black`, `border-5`, `space-100`, `space-50`, `weight-500`, `default-animation`. The alternative-black removal kills the famously-misleading `'#ffffff00'` (transparent white literal). Did **not** rename remaining tokens — every used name has ≥1 call site, and renaming costs more than it pays.
- **JS code-split via manual CSS preload.** Stage 5's first attempt at code-splitting BarChart / Carousel / Timeline broke SSR because removing the components' `links()` from the route stripped their CSS from `<head>`. Fix-path: import each component's `style.css?url` (a string, no module evaluation) and feed them straight to the route's `links()`. The JS stays dynamically imported via `lazy()` + `Suspense`, the CSS still ships in the SSR'd HTML, and Vite's "dynamic import will not move module into another chunk" warning is gone. Same pattern works for `react-vertical-timeline-component/style.min.css` from node_modules.
- **Timeline alignment polish.** Library v4 renders the `vertical-timeline-element-date` at `top: 6px` with a `0.8em` vertical padding, leaving the date pinned to the top of each row regardless of card height. Pulled it down to `top: 24px` (matches the icon's 30px center), zeroed the padding, and overrode the library's `opacity: 0.7` since we control the date color via `$text-color`. Visual measurement: icon center vs date center is 6.5px apart (was ~80px).

### Verification

- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15.
- `npm run build-storybook` — succeeds.
- Build warnings: 0 (the previous "dynamic + static import" warnings are gone — the lazy chunks now actually split).
- Headless chromium smoke test: timeline icon renders dark-bg + green ring + green check, carousel item at 100×100, 29 chart y-axis labels, date center 6.5px from icon center.

---

## Stage 7 — Tier-2 round 2

**Goal:** chase the only "amber" Lighthouse metric (LCP 2.6 s on `/skills`) by removing a request-time HTTP hop.

**Branch:** `stage-7-tier-2-followups`
**PR:** merged
**Status:** ✅ done

### What this stage did

- **Server-side `/data/*.json` import.** All three loaders (`/skills`, `/skills/:uuid`, `/education`) used to do `fetch(new URL('/data/skills.json', request.url))` from inside the Cloudflare Pages Function — a same-region HTTP round-trip on every uncached request. Replaced with direct `import` of the JSON; Vite bakes the data into the server bundle. The static asset is **still served** publicly at `/data/*.json` via the existing `_routes.json` exclude, so no behavior change for any external consumer.
- **Cleaned up the inferred types.** The literal-inferred type from the JSON is wider than what the loader uses (each optional field becomes a discriminated union), so the loaders cast `as unknown as skillsDataTypes` and `as Certification[]` to match the older runtime expectations. Skill ids in the JSON are numeric (`1`, `2`, …) — `skills._index` was typing them as `string` and the URL builders also expected strings. Tightened: type as `number` in the loader, convert to string at the boundary that serializes to `/skills/:id`.
- **No Cloudflare config changes.** `_routes.json` already excludes `/data/*` from the Pages Function, and `/data/*` cache-control was set in [public/\_headers](public/_headers) during Stage 5. The asset is now served twice (once embedded in the server bundle, once as a static file at the edge); both copies are <10 KB combined, fine.

### Why I expected the win to be small (and why it wasn't)

Going in I assumed the static asset was already served by the Cloudflare edge, so the loader's outbound `fetch` would only cost a sub-100 ms intra-region hop on cold start. The Lighthouse delta below shows the real impact was substantially bigger — the loader chain was apparently more expensive than that, and skipping it cleared **−437 ms** off both FCP and LCP.

### Verification

- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15.
- `npm run build-storybook` — succeeds.
- `npm run build` — clean (only the same pre-existing Remix v3 future-flag warnings).
- **Lighthouse delta on `/skills`** (full breakdown in [lighthouse/RESULTS.md](lighthouse/RESULTS.md)):
  - **FCP** 1.6 s → **1.2 s** (−437 ms; score 0.94 → 0.99).
  - **LCP** 2.6 s → **2.2 s** (−437 ms; score 0.86 → 0.94 — moved into Lighthouse's "good" band from the wrong side of the 2.5 s threshold).
  - Speed Index 1.9 s → 2.4 s (+482 ms). This is the cost of Stage 6's code-split: BarChart / Carousel / Timeline arrive in a later JS chunk, so visual completeness shifts later even though first content arrives sooner. Still well inside Lighthouse's "good" band (threshold 3.4 s); score 1.00 → 0.98. Worth it for the LCP win.

---

## Stage 8 — Dep maintenance

**Goal:** clear the Dependabot backlog (5+ open PRs) by taking the patch+minor bumps inside current majors. Hold every major bump for a separate, intentional decision.

**Branch:** `stage-8-deps`
**PR:** merged
**Status:** ✅ done

### Bumped (patch + minor inside current majors)

- `react-is` 19.1.1 → 19.2.7
- `stylelint-config-standard` 39.0.0 → 39.0.1
- `@cloudflare/workers-types` 4.20251014.0 → 4.20260617.1
- `happy-dom` 20.10.4 → 20.10.5
- `@eslint/compat` 1.4.0 → 1.4.1

### Held (each is its own decision)

- **eslint 8 → 10** + `@eslint/js`, `eslint-plugin-react-hooks` 4 → 7. Needs flat-config migration and an airbnb shim. Standalone PR.
- **vite 5 → 8.** Remix 2's plugin pins peer to Vite 5. Tied to a future Remix v3 / React Router v7 migration.
- **vitest 3 → 4** + `@vitest/ui`. Stage 1 hit a rolldown native-binding bug under `npm ci`; the underlying [npm/cli#4828](https://github.com/npm/cli/issues/4828) hasn't moved.
- **react 18 → 19** + `react-dom`, `react-intl` 7 → 10, `react-router-dom` 6 → 7. Whole React 19 / React Router 7 migration is its own future stage.
- **typescript 5 → 6**, **stylelint 16 → 17**, **cssnano 7 → 8**, **globals 16 → 17**, **vite-tsconfig-paths 5 → 6**, **remix-utils 7 → 9**. Each needs its own evaluation.
- **GitHub Actions majors** (`actions/checkout` 4 → 6, `setup-node` 4 → 6, `cache` 4 → 5, `upload-artifact` 4 → 7). Open as Dependabot PRs (#131-134) — close them or merge them individually; not bundling here.

### Audit for short code optimizations

Looked for low-hanging wins to bundle in. Found **none that fit "short and on-point"**:

- The two `console.error` calls in `app/entry.server.tsx` and `app/routes/skills.$uuid/index.tsx` are intentional (Terser drops `console.log` in prod but keeps `error`/`warn`/`info`).
- `entry.client.tsx`'s `<StrictMode>` wrapper is fine — it's a dev-only no-op in production builds.
- `json()` from `@remix-run/cloudflare` is **deprecated** with a clear migration path (opt into `future.v3_singleFetch` and return raw objects), but that's a multi-file refactor that changes loader response shape and deserves its own PR.
- Build still emits two CSS-minifier warnings about an `export { default } from "./style.css"` — coming from a Vite intermediate transform, not from our source. Can't fix without a Vite/Remix-side change.

### Verification

- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15.
- `npm run build-storybook` — succeeds.
- `npm run build` — clean (only the same pre-existing Remix v3 future-flag warnings + the unfixable CSS-minifier warning above).

---

## Stage 9 — Single Fetch

**Goal:** opt into Remix's `future.v3_singleFetch`, replacing the deprecated `json()` helper with raw object returns (and `data()` only where headers are required). Clears a deprecation that will become a hard break under React Router v7.

**Branch:** `stage-9-single-fetch`
**PR:** merged
**Status:** ✅ done

### What this stage did

- Enabled `future.v3_singleFetch: true` in [vite.config.ts](vite.config.ts).
- Added [app/single-fetch.d.ts](app/single-fetch.d.ts) — a one-line module augmentation (`interface Future { v3_singleFetch: true }` against `@remix-run/server-runtime`) so TS resolves `useLoaderData<typeof loader>` to the new Single Fetch types instead of the legacy `Jsonify` chain. Without this, every loader consumer fails strict type-checking even though the runtime works.
- Migrated all four loaders:
  - **root** ([app/root.tsx](app/root.tsx)) — dropped `json()`, return raw `{ locale, messages }`.
  - **skills.\_index** ([app/routes/skills.\_index/index.tsx](app/routes/skills._index/index.tsx)) — replaced `json(payload, { headers: { 'Cache-Control': … } })` with `data(payload, { headers })`. The local `data` variable name forced an `import { data as remixData }` alias.
  - **skills.$uuid** ([app/routes/skills.$uuid/index.tsx](app/routes/skills.$uuid/index.tsx)) — dropped `json()`, return raw object. The route still throws `new Error(...)` on missing id; verified the local `ErrorBoundary` still catches it under Single Fetch (smoke-tested `/skills/9999` end-to-end — renders the correct error UI).
  - **education** ([app/routes/education/index.tsx](app/routes/education/index.tsx)) — dropped `json()`, return raw object.

### Wire-format change (informational)

Under Single Fetch, route data requests now hit `<route>.data` and return a `text/x-script` turbo-stream payload instead of the old `application/json` body. Verified `/skills.data` returns `200 text/x-script` against the dev server. Edge caching for `/data/*` (the public JSON files) is unaffected — the `_routes.json` exclude routes them around the Function the same as before.

### Verification

- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15 (one flake on first run that passed on retry; same well-known dev-server-warmup symptom from Stage 1, not a regression).
- `npm run build-storybook` — succeeds.
- `npm run build` — clean (existing pre-Stage-9 warnings only).
- Manual smoke test against `npm run dev`: `/`, `/skills`, `/skills/3`, `/education` all 200 with full HTML; `/skills/9999` correctly hits the route-local ErrorBoundary; `/skills.data` returns the new turbo-stream payload.

### Followups (not in this PR)

- `v3_lazyRouteDiscovery` — still emits a future-flag warning on every dev start. One more flag flip; do separately so a regression there isn't entangled with Single Fetch.

---

## Stage 10 — Lazy route discovery

**Goal:** opt into Remix's `future.v3_lazyRouteDiscovery` (a.k.a. "fog of war"). Clears the last future-flag warning on dev start and brings the route manifest closer to the React Router v7 default behaviour.

**Branch:** `stage-10-lazy-routes`
**PR:** merged
**Status:** ✅ done

### What this stage did

- Flipped `future.v3_lazyRouteDiscovery: true` in [vite.config.ts](vite.config.ts).
- That's it. No source code touches — the flag just changes how Remix populates the route manifest at runtime: instead of shipping every route's metadata in the initial HTML, the client requests it on demand via `/__manifest?p=<path>` (with `<Link>` components prefetching eagerly on hover/focus).

### Why the impact is small here (but still worth doing)

This app has 4 routes. The "fog of war" optimization pays back proportionally to route count, so the wire-savings are negligible. The two real reasons to flip it now:

1. **Last future-flag warning gone.** Every `npm run dev` since Stage 1 has printed `[warn] Route discovery/manifest behavior is changing in React Router v7`. With this PR, no future-flag warnings remain.
2. **Closer to React Router v7 defaults.** When/if the project migrates to RR v7, this is one less behaviour change to absorb in that PR.

### Verification

- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15 (no flake).
- `npm run build-storybook` — succeeds.
- `npm run build` — clean (no future-flag warnings remaining, including the previously-persistent `v3_lazyRouteDiscovery` line).
- Manual smoke against `npm run dev`: `/`, `/skills`, `/skills/3`, `/education` all 200 with full HTML; the new `/__manifest?p=…` endpoint responds with 204 (no new routes to discover for paths already in the initial manifest, which is the correct outcome for a 4-route app).

---

## Stage 12 — A11y / SEO quick wins

**Goal:** fix two real regressions that the post-Stage-10 Lighthouse run on prod surfaced — `canonical` (SEO 92) and `svg-img-alt` (A11y 99 with 30 affected elements). Both are small, contained, and unblock 100/100 on those two categories.

**Branch:** `stage-12-a11y-seo-quickwins`
**PR:** merged
**Status:** ✅ done

### What this stage did

- **Per-route canonical.** [app/root.tsx](app/root.tsx) used to hardcode `{ rel: 'canonical', href: SITE_URL }` in `links()`, which pinned every route's canonical to the homepage. Lighthouse ran on `/skills` and rightly flagged it as wrong-target. Fixed by computing the canonical URL inside the root loader (`SITE_URL + request.url.pathname`, trailing-slash normalized), threading it through the layout's loader data, and rendering `<link rel="canonical" href={data.canonical}>` directly in `<head>` instead of via `links()`. The Layout's error-boundary fallback path now defaults to `SITE_URL` so the meta is always well-formed.
- **SVGR `aria-hidden` default.** [svgr.config.cjs](svgr.config.cjs) generated icons with `role="img"` but no `<title>`/`aria-label`/`aria-labelledby`, which is exactly what axe-core 4.11's `svg-img-alt` rule fails. The fix at the parent level (a `<title>` per icon, or an `aria-label`) would touch 30 SVGs and add no real semantics — every icon's parent already carries its own accessible name (NavBar links via `aria-label`, Carousel/Timeline rows via surrounding text). Treated SVGR-generated icons as decorative: dropped `role="img"`, added `aria-hidden="true"` as the default `svgProps` value. Re-ran `npm run build:icons` to regenerate every file under [app/components/icons/](app/components/icons/). The `{...props}` spread happens _after_ the defaults, so any future call site that needs a meaningful icon can opt back in by passing its own `aria-label` / `aria-hidden={false}`.
- **Captured the pre-fix Lighthouse summary.** Saved [lighthouse/skills-post-stage-10.summary.json](lighthouse/skills-post-stage-10.summary.json) so the impact is comparable later. The full JSON wasn't committed (it's >300 KB and contains environment-specific noise like screenshot data URLs).

### Verification

- `npm run lint`, `npm run typecheck` — clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15.
- `npm run build`, `npm run build-storybook` — succeed.
- Manual smoke against `npm run dev`:
  - canonical: `/` → `https://gonzalo-alvarez-campos-cv.com/`, `/skills` → `…/skills`, `/skills/3` → `…/skills/3`, `/education` → `…/education`.
  - icons: NavBar GitHub SVG ships as `<svg … aria-hidden="true" …>` with no `role="img"`. Same for Carousel and Timeline icons.

### Expected Lighthouse delta

Need a fresh prod run after this merges to confirm, but the predictable scores:

- **SEO** 0.92 → **1.00** (canonical was the only failing audit).
- **A11y** 0.99 → **1.00** (svg-img-alt was the only failing audit, and at weight 1 it pushes the score back to 1.0).
- **Perf, Best Practices** unchanged (no perf-affecting changes; the LCP regression from 2.2 s → 2.6 s remains and is a separate investigation — possibly Stage 13).

### Followups (not in this PR)

- LCP regressed 2.2 s → 2.6 s vs post-Stage-7 (FCP and Speed Index both improved, so the regression is specific to LCP element-render-delay). Plausibly the 12 separate render-blocking CSS files Stage 6's manual preload pattern introduced. Worth its own investigation; not bundling it here so the a11y/SEO wins land cleanly.

---

## Stage 13 — LCP recovery (CSS bundling)

**Goal:** chase the LCP regression that surfaced in the post-Stage-10 prod Lighthouse run (2.2 s → 2.6 s, score 0.94 → 0.87). Reduce the number of render-blocking stylesheets without losing the JS code-split that landed in Stage 6.

**Branch:** `stage-13-lcp-recovery`
**PR:** merged
**Status:** ✅ done

### Diagnosis

The 2.6 s LCP is **mostly a Lantern simulation artifact**, not a real-device measurement: the post-Stage-10 run's _observed_ LCP was 439 ms, FCP improved 1.2 s → 1.1 s, and Speed Index improved 2.4 s → 1.8 s versus the post-Stage-7 baseline. Real users got faster paints across the board. What regressed was Lighthouse's per-stylesheet-cost model under 4× CPU + slow-3G simulation: `/skills` shipped **12 separate render-blocking stylesheets** because Stage 6's manual-CSS-preload pattern emitted one `<link>` per component plus the route's own chain.

### What I tried first (and why it didn't work)

`build.cssCodeSplit: false` in `vite.config.ts` was the first instinct — bundle every component's CSS into one `style.css`. Build broke immediately: the Remix Vite plugin walks the manifest looking for per-CSS-chunk entries and `cssCodeSplit: false` collapses those entries into one, so `getRemixServerManifest` throws `No manifest entry found for "app/routes/style.css"`. That's a real Remix–Vite compatibility constraint, not a config-knob issue. Reverted.

### What this stage actually did

PostCSS-import is already in the chain (Stage 1 / `postcss.config.js`), so I used it to inline small components' CSS into their consuming routes' stylesheets at build time. The pattern:

1. Add `@import '../../components/<X>/style.css';` to each route's `style.css`.
2. Drop the component's `links()` export and `?url` import — its CSS is no longer a separate asset, it's part of the route's stylesheet.
3. Drop the consumer's `import { links as xLinks }` + `...xLinks()` composition.

Surface area:

- **Global stylesheet** ([app/styles/style.css](app/styles/style.css)) — inlined `Button` and `NavBar` (both used on every page). Dropped `links()` from both components and from `root.tsx`.
- **`/`** ([app/routes/style.css](app/routes/style.css)) — inlined `DownloadBtn`. Dropped `DownloadBtn`'s `links()` and the consumer's import.
- **`/education`** ([app/routes/education/style.css](app/routes/education/style.css)) — inlined `Card`. Dropped `cardLinks()` from the route's `links()`.
- **`/skills/:uuid`** ([app/routes/skills.\$uuid/style.css](app/routes/skills.$uuid/style.css)) — inlined `Card`. Dropped `cardLinks()` from the route's `links()`.
- **`/skills`** ([app/routes/skills.\_index/style.css](app/routes/skills._index/style.css)) — inlined `Card`, `Input`, `LoadingSpinner` (Button is already global). Dropped 4 `xLinks()` calls from the route's `links()` chain.
- **Card** ([app/components/Card/index.tsx](app/components/Card/index.tsx)) — dropped `links()`. Card is consumed by `Timeline` and 3 routes; Timeline still has its own `links()` for its lazy-load preload pattern, just no longer composes Card's.

The lazy-loaded heavy components (BarChart, Carousel, Timeline) keep their separate stylesheets and the manual `?url`-preload-then-stylesheet pattern from Stage 6 — that's where the real JS chunk-split win lives, and consolidating their CSS would defeat it.

### Verification

- `/skills` stylesheet count in dev: **12 → 7** (-5).
- Build asset count: **18 → 11** CSS files emitted under `build/client/assets/`.
- `style-DLdyEHl6.css` (the new global stylesheet, 3.8 KB) contains both `.button-component` and `.navbar-component` rules — confirmed via `grep`.
- No CSS duplication between bundles: the only other stylesheet with a `button-component` substring is the skills route's own `.button-component__btn--active` modifier, which lives there because it's specific to the Front End / Back End filter buttons.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build-storybook` — all clean.
- `npm test` — 41/41.
- `npm run test:e2e --project=chromium` — 15/15.
- Manual smoke against `npm run dev`: every route renders styled (no FOUC), `<html lang>` correct, NavBar + buttons + cards all carry their classes, `/skills.data` Single Fetch endpoint still returns the turbo-stream payload.

### Expected Lighthouse delta

Need a fresh prod run to confirm. Predictable shape:

- **Performance score** ~0.97 → **0.95–0.99** (5 fewer round-trips for stylesheets on `/skills`; LCP score should recover to the 0.90+ band on Lantern simulation).
- **FCP, SI, TBT, CLS** — all already excellent, expected to stay that way or improve marginally.
- **A11y, SEO, Best Practices** — unchanged (no functional changes).

If Lantern still penalizes the route heavily, the Tier-2 follow-up would be inlining critical-CSS into `<head>` for the LCP element specifically. Not bundling that here.

### Followups (not in this PR)

- AGENTS.md still describes the per-component `links()` pattern as the convention. After this merges, update §6 ("Styling system") and §14 ("Component patterns to keep matching") to reflect that small components now use postcss-import inlining instead. Bundle that with the post-Stage-13 Lighthouse capture as a small doc-sync PR.

---

## Stage 14 — Doc sync + post-Stage-13 Lighthouse capture

**Goal:** close out Stages 12 and 13 by recording the actual prod Lighthouse delta and bringing AGENTS.md in line with the new CSS conventions. No code changes.

**Branch:** `stage-14-doc-sync-and-lighthouse`
**PR:** _(fill in once opened)_
**Status:** 🟡 ready for PR

### What this stage did

- **Captured the post-Stage-13 prod Lighthouse run** as [lighthouse/skills-post-stage-13.summary.json](lighthouse/skills-post-stage-13.summary.json) and added a row + score breakdown to [lighthouse/RESULTS.md](lighthouse/RESULTS.md). Both Stage 12 and Stage 13 predictions are confirmed:

  | Metric                | Post-Stage-10 | Post-Stage-13    | Δ                      |
  | --------------------- | ------------- | ---------------- | ---------------------- |
  | Performance           | 0.97          | **0.98**         | +0.01                  |
  | Accessibility         | 0.99          | **1.00**         | +0.01 (Stage 12)       |
  | Best Practices        | 1.00          | 1.00             | —                      |
  | SEO                   | 0.92          | **1.00**         | +0.08 (Stage 12)       |
  | LCP                   | 2.6 s (0.87)  | **2.2 s (0.94)** | **−437 ms** (Stage 13) |
  | `/skills` stylesheets | 12            | **7**            | **−5** (Stage 13)      |

- The `svg-img-alt` audit is now `notApplicable` (no SVGs carry `role="img"` after Stage 12). The `canonical` audit passes. Network dependency tree's longest critical chain dropped from 387 ms (12 stylesheets) to 322 ms (7).

- **AGENTS.md §6 (Styling system).** Documented the two CSS patterns the codebase actually uses now:
  - **Pattern A — `postcss-import` inline.** Default for small, always-needed components. Component owns its `style.css` only; the consuming route adds an `@import` at the top of its own stylesheet. No `links()`, no `?url`. Currently used by Button, Card, DownloadBtn, Input, LoadingSpinner, NavBar.
  - **Pattern B — Remix `links()`.** Reserved for JS-lazy-loaded heavies (BarChart, Carousel, Timeline) that still need their CSS on first paint. Manual `?url` preload + stylesheet pair. The trade is one stylesheet round-trip in exchange for keeping the JS off the eager bundle.

- **AGENTS.md §14 (Component patterns).** Updated the "new component" checklist to default to no `links()` export (Pattern A) and the "new route" checklist to call out `@import`-ing consumed components in the route's stylesheet.

- **Dropped the critical-CSS-inline followup.** Post-Stage-10 we'd flagged it as a Tier-2 lever if Lantern still penalized `/skills` after Stage 13. With LCP recovered to 0.94 and Performance at 0.98, it's not justified by the score. RESULTS.md notes this explicitly.

### Verification

- `npm run lint` clean (Prettier-checked the docs).
- No code changes, so existing test/build pipeline is untouched.

---

## Decisions log

Record non-obvious decisions here as they're made (so future-me / future-agent doesn't have to re-derive them):

- **2026-06-16** — Stage order: tests → data → storybook → deps → optimization. Reason: tests give safety net; deps before optimization so we measure on final stack.
- **2026-06-16** — Unit tests = Vitest + RTL; E2E = Playwright. Reason: standard split, Vitest is Vite-native.
- **2026-06-16** — Hold React on 18 in Stage 4. Reason: React 19 migration is its own decision and would inflate the deps PR scope.

---

## PRs

| Stage | Branch                             | PR          | Status | Merged |
| ----- | ---------------------------------- | ----------- | ------ | ------ |
| 1     | `stage-1-tests`                    | merged      | ✅     | yes    |
| 2     | `stage-2-data-restructure`         | merged      | ✅     | yes    |
| 3     | `stage-3-storybook`                | merged      | ✅     | yes    |
| 4     | `stage-4-deps`                     | merged      | ✅     | yes    |
| 5     | `stage-5-optimize`                 | merged      | ✅     | yes    |
| 6     | `stage-6-tier-2`                   | merged      | ✅     | yes    |
| 7     | `stage-7-tier-2-followups`         | merged      | ✅     | yes    |
| 8     | `stage-8-deps`                     | merged      | ✅     | yes    |
| 9     | `stage-9-single-fetch`             | merged      | ✅     | yes    |
| 10    | `stage-10-lazy-routes`             | merged      | ✅     | yes    |
| 11    | `stage-11-doc-sync`                | merged      | ✅     | yes    |
| 12    | `stage-12-a11y-seo-quickwins`      | merged      | ✅     | yes    |
| 13    | `stage-13-lcp-recovery`            | merged      | ✅     | yes    |
| 14    | `stage-14-doc-sync-and-lighthouse` | _(opening)_ | 🟡     | —      |
