# Work Plan & Progress

Living document tracking the multi-stage refactor of `remix-portfolio`. Update this file as stages start, advance, and merge. Stable reference docs (stack, conventions) live in [AGENTS.md](AGENTS.md) — keep them in sync once a stage changes the conventions.

**Branching rule:** one PR per stage off `main`. Don't open the next stage's branch until the previous PR is **merged and green** (CI lint + typecheck + tests).

**Status legend:** ⬜ not started · 🟡 in progress · ✅ done · ❌ blocked

---

## Stage order (decided)

1. ✅ **Stage 1 — Tests** (Vitest + React Testing Library for units, Playwright for E2E)
2. ✅ **Stage 2 — Data restructure** (`public/data/skills.json` → derive chart from `WORK_ITEMS`)
3. ✅ **Stage 3 — Storybook** for every component in `app/components/`
4. 🟡 **Stage 4 — Dependency updates** (majors except React; React 18 → 19 deferred)
5. ⬜ **Stage 5 — Code optimization** (loading time, bundle, lazy-loading, hints — no visual change)

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
**PR:** _(fill in once opened)_
**Status:** 🟡 in progress

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

**Goal:** improve loading times and runtime cost without changing the visual output.

**Branch:** `stage-5-optimize`
**PR:** _(fill in once opened)_
**Status:** ⬜

### Investigation (do this first, then prioritize)

- [ ] Run `npm run build` and inspect bundle output in `build/client/assets/`. Note any chunks > 100 KB gzipped.
- [ ] Run Lighthouse on the deployed site or `npm run preview`. Capture baseline LCP / CLS / TBT.
- [ ] Open `recharts` import — it tree-shakes per-component, but verify only the bits we use end up in the bundle.
- [ ] Check `react-vertical-timeline-component` — already lazy-loaded in [Timeline](app/components/Timeline/index.tsx#L19) and [skills.\_index](app/routes/skills._index/index.tsx#L32), confirm there's no duplicate eager import.
- [ ] Audit images in `public/assets/img/`: WebP is already used (good); add `width` / `height` to `<img>` tags to prevent CLS; verify `loading="lazy"` is consistently applied.
- [ ] Audit fonts: the Roboto variable font is loaded via `@font-face` with `font-display: swap` — good. Consider `<link rel="preload" as="font" type="font/ttf" crossorigin>` in `root.tsx` `links()`.

### Likely wins (turn into individual commits)

- [ ] **Eliminate `uuid()` for static lists.** [Carousel](app/components/Carousel/index.tsx#L73), [Card.renderSkills](app/components/Card/index.tsx#L36), [education](app/routes/education/index.tsx#L84), [skills.\_index `renderSpan`](app/routes/skills._index/index.tsx#L144) all generate `uuid()` keys for stable lists. This re-mounts the entire list on every render and bloats the bundle (`uuid` is ~2.6 KB gzipped). Replace with stable index-based or content-based keys. **High impact, low risk.**
- [ ] **Drop the `uuid` dependency entirely** if all call sites can use stable keys.
- [ ] **Preload critical CSS / font** via `<link rel="preload">` in `root.tsx`.
- [ ] **Image dimensions:** add `width` and `height` attributes to all `<img>` tags so the browser reserves layout space (fixes CLS).
- [ ] **Code-split route CSS:** Remix already does this via `links()` — verify per-route CSS isn't loaded on `/`.
- [ ] **Memoize derived data in `skills._index`** loader (already cached via `Cache-Control` for 1h, but `getSkillChartData` runs on every server invocation — fine; just confirm it's not doing N² work).
- [ ] **Lazy-load `recharts`** the same way `react-vertical-timeline-component` is. The chart is below the fold on `/skills`.
- [ ] **`<NavBar>` `<img>` for the LinkedIn QR** is loaded eagerly even on mobile where it's hidden — set `loading="lazy"` and confirm CSS hides it before fetch.
- [ ] **Drop `react-is@19`** if it's only there as a `recharts` peer — it shouldn't be a direct dep.
- [ ] **`StrictMode` double-rendering** is intentional in dev; confirm production build doesn't ship StrictMode wrappers (Remix `entry.client.tsx` does — that's fine, it's a no-op in prod).

### Tasks

- [ ] Capture baseline metrics in this file (bundle size, Lighthouse).
- [ ] Implement each optimization as its own commit so we can revert one without losing the rest.
- [ ] Re-measure after each commit; note the delta in this file.
- [ ] Confirm no visual diff via Storybook (or screenshot diffing if we wired Chromatic).

### Exit criteria

- [ ] All tests + Storybook + lint + typecheck green.
- [ ] Lighthouse performance score ≥ baseline (and ideally improved on LCP / TBT).
- [ ] No visual regressions.
- [ ] Bundle size on the home route reduced.
- [ ] AGENTS.md "Gotchas" updated if any of them were resolved (e.g. `uuid()` keys note, `legacy-peer-deps`, etc.).

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
| 4     | `stage-4-deps`             | _(opening)_ | 🟡     | —      |
| 5     | `stage-5-optimize`         | _(pending)_ | ⬜     | —      |
