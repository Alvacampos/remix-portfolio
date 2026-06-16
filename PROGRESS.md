# Work Plan & Progress

Living document tracking the multi-stage refactor of `remix-portfolio`. Update this file as stages start, advance, and merge. Stable reference docs (stack, conventions) live in [AGENTS.md](AGENTS.md) — keep them in sync once a stage changes the conventions.

**Branching rule:** one PR per stage off `main`. Don't open the next stage's branch until the previous PR is **merged and green** (CI lint + typecheck + tests).

**Status legend:** ⬜ not started · 🟡 in progress · ✅ done · ❌ blocked

---

## Stage order (decided)

1. 🟡 **Stage 1 — Tests** (Vitest + React Testing Library for units, Playwright for E2E)
2. ⬜ **Stage 2 — Data restructure** (`public/data/skills.json` → derive chart from `WORK_ITEMS`)
3. ⬜ **Stage 3 — Storybook** for every component in `app/components/`
4. ⬜ **Stage 4 — Dependency updates** (majors except React; React 18 → 19 deferred)
5. ⬜ **Stage 5 — Code optimization** (loading time, bundle, lazy-loading, hints — no visual change)

Tests come first so every later stage has a safety net. Deps come before optimization so optimization measurements aren't invalidated by a later upgrade.

---

## Stage 1 — Tests

**Goal:** automated verification that every component renders and every route loads/behaves correctly.

**Branch:** `stage-1-tests`
**PR:** _(fill in once opened)_
**Status:** 🟡 ready for PR

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
**PR:** _(fill in once opened)_
**Status:** ⬜

### Problem (recorded so future-me remembers)

Today `WORK_ITEMS[i].skills` is a flat list of strings, and `SKILL_CHART_DATA` is a separate hand-maintained array of `{ name, dates: [{startDate, endDate}] }`. `getSkillChartData()` trusts `SKILL_CHART_DATA` blindly, so:

- Duplication — adding a job means updating both places.
- The chart can drift from real experience (skills used in a job but not in `SKILL_CHART_DATA` get under-counted, or vice versa).

### Proposed shape

Derive everything from `WORK_ITEMS`. Each work item already has `startDate`, `endDate`, and `skills: string[]`, which is enough.

```ts
// app/utils/utils.tsx
export function getSkillChartData(workItems: WorkItem[]): [string, number][] {
  const now = new Date();
  const totals = new Map<string, number>(); // skill → months
  for (const w of workItems) {
    const start = new Date(w.startDate);
    const end = w.endDate ? new Date(w.endDate) : now;
    const months = differenceInMonths(end, start);
    for (const skill of w.skills) {
      totals.set(skill, (totals.get(skill) ?? 0) + months);
    }
  }
  return [...totals.entries()].map(([name, months]) => [name, +(months / 12).toFixed(2)]);
}
```

If a skill should be **excluded** from the chart (e.g. soft-skill labels like `"Agile"`, `"Front End"`, `"Back End"` that are filter chips, not technologies), introduce a `chartExclude: string[]` constant or a `displayInChart: false` flag. Decide during the stage — don't pre-bake it.

### Tasks

- [ ] Snapshot the current chart (write a small one-off script or copy the rendered values) so we can sanity-check the derived numbers post-refactor.
- [ ] Decide on the exclude-list (probably: `Front End`, `Back End`, `Agile`, `Teaching`, `Mentoring`, `Programming`, `C`, generic labels). Document the decision in this file.
- [ ] Update [app/utils/utils.tsx](app/utils/utils.tsx) `getSkillChartData` signature + impl per the snippet above.
- [ ] Update [app/routes/skills.\_index/index.tsx:83](app/routes/skills._index/index.tsx#L83) loader to pass `WORK_ITEMS` (filtered by exclude-list) directly.
- [ ] Remove `SKILL_CHART_DATA` from [public/data/skills.json](public/data/skills.json) and the `skillsDataTypes` definitions.
- [ ] (Optional) Normalize skill casing inside `WORK_ITEMS` — `"NodeJs"` vs `"Nodejs"` vs `"Node.js"` will collide in the totals map otherwise. Either a `normalizeSkill()` helper or a one-time edit pass over `skills.json`.
- [ ] Update unit tests for `getSkillChartData` with new input shape.
- [ ] Update / add E2E assertions on the chart (count of bars, ordering).

### Exit criteria

- [ ] Chart renders the same set of skills (modulo intentional exclusions) with values that match the pre-refactor snapshot ±0.1 yr.
- [ ] `SKILL_CHART_DATA` no longer exists in the codebase.
- [ ] All tests green.
- [ ] AGENTS.md "Data" section updated to reflect the single-source-of-truth model.

---

## Stage 3 — Storybook

**Goal:** every component in `app/components/` has a story for visual regression and isolated development.

**Branch:** `stage-3-storybook`
**PR:** _(fill in once opened)_
**Status:** ⬜

### Tooling decisions

- Storybook 9 (latest at time of writing) with the React + Vite framework — it composes natively with our Vite config. `eslint-plugin-storybook` is already a dev-dep ([package.json:70](package.json#L70)) and the ESLint config already extends `plugin:storybook/recommended`.
- Wire up the same PostCSS pipeline so stories render with real styles.
- One `*.stories.tsx` per component, colocated next to the `index.tsx`.

### Tasks

- [ ] `npx storybook@latest init --type react-vite`.
- [ ] Configure `.storybook/main.ts` to use Vite + path alias `~`.
- [ ] Configure `.storybook/preview.ts` with `IntlProvider` decorator (so `FormattedMessage` works), `MemoryRouter` decorator from `@remix-run/react` for `<Link>`, and global CSS imports (`app/styles/style.css`, fonts).
- [ ] Stories for each component:
  - [ ] `BarChart` — with sample data.
  - [ ] `Button` — variants: label only, with `leftIcon`, with `rightIcon`, as link (`url` set), as click handler.
  - [ ] `Card` — variants: title+texts, itemList, skills, styleless, with children.
  - [ ] `Carousel` — default.
  - [ ] `ConditionalWrapper` / `ConditionalLink` — both states.
  - [ ] `DownloadBtn` — default.
  - [ ] `Input` — autocomplete with sample suggestions; "no matches" state.
  - [ ] `LoadingSpinner` — default.
  - [ ] `NavBar` — default.
  - [ ] `Timeline` — with sample items.
- [ ] Add `npm run storybook` and `npm run build-storybook` scripts.
- [ ] Update `.ls-lint.yml` if needed for `*.stories.tsx` (PascalCase / kebab-case rule should already cover it).
- [ ] (Optional) Wire Chromatic or just commit `storybook-static/` artifact upload to CI for visual diff.

### Exit criteria

- [ ] `npm run storybook` boots, every component is reachable.
- [ ] `npm run build-storybook` succeeds.
- [ ] All tests + lint + typecheck still green.
- [ ] AGENTS.md gains a "Storybook" section under Component patterns.

---

## Stage 4 — Dependency updates

**Goal:** bring everything to current majors except React (separate, larger decision).

**Branch:** `stage-4-deps`
**PR:** _(fill in once opened)_
**Status:** ⬜

### Scope decision

- **Bump:** ESLint 8 → 9 (with flat-config migration), `eslint-config-airbnb` replacement (airbnb hasn't published a v20 for ESLint 9 — likely switch to `eslint-config-airbnb-typescript` or directly to `@typescript-eslint`'s recommended plus jsx-a11y/react), recharts, date-fns, wrangler, all dev deps.
- **Hold:** `react@18` and `react-dom@18`. `@types/react@19` is already on 19 — pin that back to 18 to remove the `legacy-peer-deps` workaround **or** keep it pending the React 19 migration. Flag this in the PR description.
- **Hold:** anything that requires React 19 as a peer (re-evaluate if recharts or react-vertical-timeline-component force the upgrade).

### Tasks

- [ ] `npm outdated` — record the snapshot in this file.
- [ ] Bump dev tooling first (eslint, prettier, stylelint, tsc, vite, wrangler, @types/\*).
- [ ] Resolve ESLint 9 flat-config migration. The current `.eslintrc.js` is legacy — convert to `eslint.config.js` flat config or use `@eslint/compat` (already a dev-dep).
- [ ] Bump runtime deps (`recharts`, `date-fns`, `react-intl`, `remix-utils`, `uuid`, etc.).
- [ ] Decide `@types/react@19` → `@types/react@18` to drop `legacy-peer-deps=true` from `.npmrc`. If keeping legacy-peer-deps, document why.
- [ ] Re-run unit tests + E2E + storybook build.
- [ ] Smoke-test `npm run dev` and `npm run preview` manually.

### Exit criteria

- [ ] All linters, type-check, tests, Storybook build green on the new versions.
- [ ] No new runtime warnings in dev console.
- [ ] AGENTS.md "Stack" table updated with new versions; "Gotchas" updated re: legacy-peer-deps if it was removed.

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
| 1     | `stage-1-tests`            | _(opening)_ | 🟡     | —      |
| 2     | `stage-2-data-restructure` | _(pending)_ | ⬜     | —      |
| 3     | `stage-3-storybook`        | _(pending)_ | ⬜     | —      |
| 4     | `stage-4-deps`             | _(pending)_ | ⬜     | —      |
| 5     | `stage-5-optimize`         | _(pending)_ | ⬜     | —      |
