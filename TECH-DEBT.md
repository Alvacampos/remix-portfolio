# Tech debt & roadmap

> Single tracker for what's open across the whole project. Three sections:
> **Technical** (infra, build, perf, CI), **Cleanup** (doc drift, data
> inconsistency, dead code), **UI / Features** (what's missing from a
> senior-IC CV site). Items are ticked off as PRs land.
>
> Priority scale (effort × impact):
>
> - **P0** — high impact, low effort. Ship first.
> - **P1** — high impact, medium effort.
> - **P2** — high effort, high payoff. Multi-PR.
> - **P3** — nice-to-have / low impact.

## Status

| ID  | Section   | Priority | Item                                                           | Status |
| --- | --------- | -------- | -------------------------------------------------------------- | ------ |
| T1  | Technical | P0       | a11y test coverage in CI (axe-playwright)                      | done   |
| T2  | Technical | P0       | Lighthouse gating in CI                                        | done   |
| T3  | Technical | P0       | Stop serving `/data/*` publicly                                | done   |
| T4  | Technical | P0       | `fetchpriority="high"` on company logo (`/skills/:uuid`)       | done   |
| T5  | Technical | P1       | Recover `/skills` Lighthouse perf (0.87 → 0.95+)               | open   |
| T6  | Technical | P1       | Bundle visualizer audit                                        | done   |
| T7  | Technical | P1       | Move visual-baseline regen to CI workflow                      | done   |
| T8  | Technical | P1       | Remove `legacy-peer-deps=true`                                 | done   |
| T9  | Technical | P2       | React Router v7 migration                                      | open   |
| T10 | Technical | P2       | postcss-simple-vars → CSS custom properties                    | open   |
| T11 | Technical | P2       | Switch to Percy/Chromatic for `/skills` visual gate            | open   |
| T12 | Technical | P3       | Cloudflare KV / D1 / R2 bindings (for contact form)            | open   |
| T13 | Technical | P3       | Drop unused `@chromatic-com/storybook`                         | done   |
| T14 | Technical | P3       | Replace husky with simple-git-hooks                            | open   |
| T15 | Technical | P3       | `import/no-relative-parent-imports` ESLint rule                | open   |
| C1  | Cleanup   | P0       | Doc drift: README locale claims                                | done   |
| C2  | Cleanup   | P0       | Doc drift: README "Future Plans" (Python/Django, contact form) | done   |
| C3  | Cleanup   | P0       | Doc drift: AGENTS.md cross-refs to README plans                | done   |
| C4  | Cleanup   | P1       | Data: `Mentoring` ranges (Endava + Qubika missing)             | done   |
| C5  | Cleanup   | P1       | Data: `Leadership` ranges (Qubika missing?)                    | done   |
| C6  | Cleanup   | P2       | Rename ambiguous `Programming` meta skill                      | open   |
| C7  | Cleanup   | P2       | Merge `getSkillsForJob` into `getSkillGroupsForJob`            | open   |
| C8  | Cleanup   | P3       | Move `mergeRouteMeta` out of `utils.tsx`                       | open   |
| C9  | Cleanup   | P3       | Move `FORWARD_GROUPS` out of TechTree component                | open   |
| C10 | Cleanup   | P3       | Validate `name_es` typos against a locale registry             | open   |
| C11 | Cleanup   | P3       | Verify `npm run build:og` still works                          | done   |
| C12 | Cleanup   | P3       | Audit `app/assets/icons/` for orphans                          | open   |
| U1  | UI        | P0       | Real Home hero (value prop + metrics + CTAs)                   | done   |
| U2  | UI        | P0       | Print stylesheet (CV page printable)                           | done   |
| U3  | UI        | P0       | Promote in-progress Bachelor's on `/education`                 | done   |
| U4  | UI        | P0       | Locale-aware date format on `/education` (match `:slug`)       | done   |
| U5  | UI        | P0       | Match contrast fix on DownloadBtn hover state                  | done   |
| U6  | UI        | P1       | `/contact` route (CF Pages Function + Resend / Loops)          | open   |
| U7  | UI        | P1       | Case studies — `/projects/<slug>` (3-5 deep-dives)             | done   |
| U8  | UI        | P1       | Per-route OG images                                            | done   |
| U9  | UI        | P1       | 404 page polish (match `/skills/:uuid` error UI)               | done   |
| U10 | UI        | P1       | Spanish CV PDF (flip `HAS_ES_CV`)                              | open   |
| U11 | UI        | P2       | `/blog` or `/notes` — engineering write-ups                    | open   |
| U12 | UI        | P2       | Heatmap cell tooltips (hover detail)                           | open   |
| U13 | UI        | P2       | Cmd-K / `/` keyboard shortcut for skills filter                | open   |
| U14 | UI        | P2       | Realtime "viewers" badge (CF Durable Objects)                  | open   |
| U15 | UI        | P2       | Edge-side A/B testing on hero copy (CF Workers)                | open   |
| U16 | UI        | P3       | Second accent color (alongside GitHub Green)                   | open   |
| U17 | UI        | P3       | Display-weight typography for `h1`s                            | open   |
| U18 | UI        | P3       | Skill chip hover tooltips ("Used at: X · N years")             | open   |
| U19 | UI        | P3       | Mobile hamburger / FAB pattern                                 | open   |
| U20 | UI        | P3       | Endorsements / testimonials section                            | open   |
| U21 | UI        | P3       | GitHub activity stream (public contribs)                       | open   |
| U22 | UI        | P3       | Extended filter chips on `/skills` (by category)               | open   |
| U23 | UI        | P3       | Per-job duration totals as a stat strip                        | open   |
| U24 | UI        | P3       | `prefers-reduced-motion` sweep beyond LocaleToggle             | open   |

---

## 1. Technical

### T1 — a11y test coverage in CI (P0)

`@axe-core/playwright` integration in `tests/e2e/`. Run axe on each route, fail on serious/critical violations. Catches what Lighthouse misses. ~30 lines of spec code + 1 new devDep.

### T2 — Lighthouse gating in CI (P0)

Lighthouse CI runs post-merge today and commits scores under `lighthouse/`. Add a pre-merge run against the preview deploy; fail the PR if Performance < 0.85 mobile. Stops perf regressions before they ship.

### T3 — Stop serving `/data/*` publicly (P0)

`public/_routes.json` excludes `/data/*` from the Pages Function, exposing `skills.json` + `education.json` at `gonzalo-alvarez-campos-cv.com/data/skills.json`. No external consumer today; scrapers can lift the entire CV including draft Spanish copy. Vite bakes the JSON into the server bundle, so we don't need it served. Drop the exclude.

### T4 — `fetchpriority="high"` on company logo (P0)

Likely the LCP element on `/skills/:uuid`. Add `fetchpriority="high"` + `decoding="async"`. One-line change in [app/routes/skills.$uuid/index.tsx](app/routes/skills.$uuid/index.tsx).

### T5 — Recover `/skills` Lighthouse perf (P1)

Latest prod run shows 0.87 (LCP 3.5s, FCP 2.5s). The T6 bundle audit (below) ruled out JS payload as the main cause — total client JS is 127 KB gzip across all routes, and `/skills` adds only a few KB on top of the shared chunks. Suspects that remain: route stylesheet weight (heatmap + carousel + timeline inlined into one 20 KB CSS), Roboto WOFF2 critical-path cost, server-response latency on the Cloudflare edge for `/skills` specifically. Investigate via WebPageTest waterfall against prod rather than guessing. Target 0.95+ mobile.

### T6 — Bundle visualizer audit (P1) — DONE

Ran `npx vite-bundle-visualizer` on a fresh `npm run build`. **Total client JS: 393 KB raw / 127 KB gzip across all routes.** Per-route initial-page cost ≈ 115 KB gzip (components + root + utils + route chunk + entry.client). Findings:

- **`components-BRNNisoL.js` — 253 KB raw / 80 KB gzip.** React + ReactDOM + Remix runtime. The dominant chunk by far; no easy wins without dropping React itself.
- **`utils-BgqF83j_.js` — 76 KB raw / 21 KB gzip.** Mostly `date-fns` (`format`, `formatDuration`, `intervalToDuration`, `differenceInMonths`) + the Spanish locale data. Already using named imports — date-fns v3+ is fully tree-shakeable, so this is already the minimum cost for those 4 functions + ES locale.
- **`root-JC5yJIQD.js` — 31 KB raw / 11 KB gzip.** root.tsx + IntlProvider + react-intl runtime + @formatjs internals.
- **`react-vertical-timeline-component`** is in its own lazy chunk (`index-CZhEOpFy.js`, 8 KB) and only loads when `/skills` is visited. Not a bottleneck.
- Per-route chunks (0.6–5 KB each) are appropriately tiny.

**Conclusion: JS payload is not the perf bottleneck.** T5's 0.87 LCP on `/skills` is more likely CSS-side (route stylesheet bundling, font critical path) or server-response latency. Bundle audit findings reduced the T5 search space significantly.

### T7 — Move visual-baseline regen to CI workflow (P1)

The `useLocation()` hydration race only reproduces in local Docker regen — not on CI runners. A "regen baselines" GitHub Action triggered manually (`workflow_dispatch`) would run the regen inside the actual CI environment, eliminate the race, and let us re-include `/education` index (T11 → also `/skills` routes).

### T8 — Remove `legacy-peer-deps=true` (P1)

Set because of `@types/react@19` vs `react@18` mismatch. Either upgrade React to 19 (Remix v2 supports it) or pin types to 18. Removes a long-running install warning.

### T9 — React Router v7 migration (P2)

Remix v2 is in maintenance mode; RRv7 is the official upgrade path. Resolves T15 (formerly TECH-DEBT #2 — react-router-dom pin). Route file conventions change. Large effort, but eventual.

### T10 — postcss-simple-vars → CSS custom properties (P2)

Formerly TECH-DEBT #1. Re-enables 3 stylelint rules, unlocks runtime theming. Every `$token` becomes `var(--token)`; need an equivalent typo-catcher (linter or build-time check) since simple-vars' unknown callback is the current safety net.

### T11 — Switch to Percy/Chromatic for `/skills` visual gate (P2)

`/skills` and `/skills/:uuid` are both excluded from the visual suite ([tests/e2e/README.md](tests/e2e/README.md#why-skills-isnt-gated)). Reasons are documented (SVG anti-aliasing, hydration race). Percy/Chromatic handle SVG diffing better and run in CI not local Docker. Tradeoff: paid service. Alternative: T7 (CI-only regen) solves the hydration race without changing tools.

### T12 — Cloudflare KV / D1 / R2 bindings (P3)

[wrangler.toml](wrangler.toml) has no bindings. Will be needed for U6 (contact form rate-limiting) or U14 (Durable Objects). Scaffold when the first consumer lands.

### T13 — Drop unused `@chromatic-com/storybook` (P3)

Visual regression is covered by Playwright. Storybook addon is installed but unused.

### T14 — Replace husky with simple-git-hooks (P3)

husky adds an install-time hook setup that's slow on fresh `npm ci`. simple-git-hooks is lighter. Tiny improvement.

### T15 — `import/no-relative-parent-imports` ESLint rule (P3)

Forces use of the `~/` path alias instead of `../../../`. Already the convention; one rule makes it enforceable.

---

## 2. Cleanup / data / docs

### C1 — Doc drift: README locale claims (P0)

[README.md:3](README.md#L3) and lines 67-68 + 117 still describe i18n as Accept-Language-only with the switcher "on the backlog." LocaleToggle shipped in PR #190, cookie-based cross-page persistence in PR #193. Rewrite to reflect the actual priority chain (`?lang=` → cookie → header) and the visible NavBar toggle.

### C2 — Doc drift: README "Future Plans" (P0)

[README.md:111-118](README.md#L111) lists Python/Django backend + contact form. If neither is happening, delete the section. If the contact form is still on the table, move it to U6 and delete the rest.

### C3 — Doc drift: AGENTS.md cross-refs to README plans (P0)

[AGENTS.md:13](AGENTS.md#L13) references the stale README claims. Sync once C2 lands.

### C4 — Data: `Mentoring` ranges (P1)

Currently `[{ jobId: 3 }]` (Professor only). Description text shows mentoring at Endava (id 4, "organized and mentored the Endava Argentina Internship program") and Qubika (id 6, EXTRA_ACTIVITIES has "Senior Internship" + "Frontend Mentor"). Add those ranges.

### C5 — Data: `Leadership` ranges (P1)

Currently `[{ jobId: 4 }]` (Endava only). Qubika (id 6) senior-track work likely includes leadership moments. User to confirm.

### C6 — Rename ambiguous `Programming` meta skill (P2)

Tagged on Professor (id 3) + Teacher (id 5). The category is `meta` so it's a soft skill. Renaming to "Programming Education" or "Teaching Programming" disambiguates from the literal act of writing code.

### C7 — Merge `getSkillsForJob` into `getSkillGroupsForJob` (P2)

Group helper is a strict superset. Flat-list helper is only used by `/skills` index timeline-card chip strings. Could expose both shapes from one helper, or deprecate the flat one in favor of `getSkillGroupsForJob(...).flatMap(g => g.items)`. Reduces surface area.

### C8 — Move `mergeRouteMeta` out of `utils.tsx` (P3)

[app/utils/utils.tsx](app/utils/utils.tsx) is approaching 400 lines. `mergeRouteMeta` has a distinct concern (Remix meta tags) and belongs in `utils/meta.ts`.

### C9 — Move `FORWARD_GROUPS` out of TechTree component (P3)

The Learning / Future arrays still live inline in [app/components/TechTree/index.tsx](app/components/TechTree/index.tsx). Could move to a constants file, or — for full source-of-truth consistency — into `skills.json` under a new `FORWARD_LOOKING` block.

### C10 — Validate `name_es` typos against a locale registry (P3)

Schema accepts any string for `name_es`. A typo (Mentoria vs Mentoría) won't be caught at boot. Low risk but worth a guard once the soft-skill set stabilizes.

### C11 — Verify `npm run build:og` still works (P3) — DONE

Ran `npm run build:og` on `main` after the per-route OG PR landed. All four PNGs (`og-home.png`, `og-education.png`, `og-projects.png`, `og-skills.png`) re-rendered deterministically with no byte drift against the committed copies. The script reads `scripts/og/<slug>.svg`, swaps in the title/tagline at template time, and writes to `public/assets/img/og-<slug>.png` via `@resvg/resvg-js`. Repeatable + idempotent.

### C12 — Audit `app/assets/icons/` for orphans (P3)

9 source SVGs today. Confirm each maps to a real consumer; remove orphans. `app/components/icons/` is generated so it can't be source-of-truth.

---

## 3. UI / features

### U1 — Real Home hero (P0)

Current home is a welcome paragraph + repo link + CV download. Both audiences (recruiters, tech leads) land here. Add a one-line value prop, 3-5 top metrics (years, roles), a "Currently at Qubika" badge, and 3 link-CTAs. Same shape as tomdale.net, kentcdodds.com.

### U2 — Print stylesheet (P0)

Recruiters Ctrl-P CV pages surprisingly often. Current dark theme + sidebar nav makes the print preview unusable. `@media print { ... }` block, ~50 lines.

### U3 — Promote in-progress Bachelor's on `/education` (P0)

Bachelor's (in progress) and Associate Degree (completed) render at the same visual weight. Add a "Currently studying" badge or top-row treatment to the active degree.

### U4 — Locale-aware date format on `/education` (P0)

Index route still uses `01/2024 - 09/2027` numeric format. `/education/:slug` was upgraded to "March 2024 → September 2027" with the recent PR. Match the index format for consistency.

### U5 — Match contrast fix on DownloadBtn hover state (P0)

[app/components/DownloadBtn/style.css:26](app/components/DownloadBtn/style.css#L26) — hover sets `color: #ffffff` on `background: var(--accent)` (#0fbf3e green). Same ~2.4:1 contrast issue as the LocaleToggle finding (already fixed). Lighthouse hasn't flagged this one yet but the math is identical. Swap to `var(--bg-base)` or `$gray-6`.

### U6 — `/contact` route (P1)

Cloudflare Pages Function POSTing to Resend or Loops. Rate-limited via Cloudflare KV. Demonstrates CF Workers chops in an interview. Drop the "future contact form" promise from README (C2).

### U7 — Case studies — `/projects/<slug>` (P1)

3-5 abstracted write-ups of representative work (e.g. "AI-powered finance docs platform" from your Adalabs work at Qubika). Each: Problem / Constraints / Approach / Outcome, 300-500 words. No client names, no code samples. Solves the "no public repos" gap — depth signal lives in the writing.

### U8 — Per-route OG images (P1)

OG image is generated from SVG today (`scripts/render-og-image.mjs`). Add per-route variants: `/skills` shows heatmap snapshot, `/projects/<slug>` shows project hero. CF Workers OG generation is the idiomatic pattern.

### U9 — 404 page polish (P1)

Route-level ErrorBoundary on `/skills/:uuid` and `/education/:slug` looks good. The root error boundary (unknown URLs) doesn't match. Unify the design.

### U10 — Spanish CV PDF (P1)

Flip `HAS_ES_CV` in [app/utils/utils.tsx](app/utils/utils.tsx) when the file lands at `public/assets/files/gonzalo_alvarez_campos_cv_es.pdf`. Update the assertion in [app/utils/utils.test.tsx](app/utils/utils.test.tsx).

### U11 — `/blog` or `/notes` (P2)

Engineering write-ups on decisions made in this repo (e.g. "How I diagnosed an LCP regression", "Why visual baselines live in Docker"). The README "AI Assistance" section is already doing some of this — formalize into its own surface.

### U12 — Heatmap cell tooltips (P2)

Hover shows "React · 2024 · 11 months." Currently the chart is visual only. Adds depth + a11y (keyboard nav).

### U13 — Cmd-K / `/` keyboard shortcut for skills filter (P2)

Focus the `/skills` autocomplete on Cmd-K or `/`. Keyboard-first interaction signal. ~10 lines.

### U14 — Realtime "viewers" badge (P2)

CF Durable Objects maintain a live count of current visitors. Talking-point material for interviews. Overkill for a CV but a strong CF demonstration.

### U15 — Edge-side A/B testing on hero copy (P2)

Workers can split-test the home tagline with no client flicker. Few CVs demonstrate this; senior-IC signal.

### U16 — Second accent color (P3)

Color palette is heavily GitHub Green. A second accent (warm orange / blue) used sparingly (Learning / Future chips, focus rings) would feel more personal than a GitHub clone.

### U17 — Display-weight typography for `h1`s (P3)

Current `<h1>` is small and centered. Bigger / heavier Roboto variant (or a serif companion) on `h1`s only signals more craft.

### U18 — Skill chip hover tooltips (P3)

Chip "Cypress" on hover shows "Used at: Qubika · 3 years." Tiny but classy.

### U19 — Mobile hamburger / FAB pattern (P3)

Sidebar collapses to bottom bar on mobile (works). A FAB hamburger expanding to overlay would feel more app-like and reclaim vertical space.

### U20 — Endorsements / testimonials (P3)

2-3 quotes from past managers/colleagues (with permission + LinkedIn link). > 100 LinkedIn skill endorsements. The friction is getting permissions.

### U21 — GitHub activity stream (P3)

`octokit` + CF KV cache for the API quota. Pulls public contribs from `Alvacampos`. Shows pulse even when most projects are private.

### U22 — Extended filter chips on `/skills` (P3)

Current filter is by tech name. Add toggle chips for "Leadership / Mentoring / Public Speaking" categories. Lets the `/skills` page surface soft-skill highlights, not just tech.

### U23 — Per-job duration totals as a stat strip (P3)

Home or `/skills` shows "7+ years total experience" as a stat. `getSkillHeatmapData` already does most of this math.

### U24 — `prefers-reduced-motion` sweep (P3)

LocaleToggle honors it. Extend to ThemeToggle, NavBar transitions, Timeline entrance animation. ESLint-style sweep.

---

## How to use this file

1. Pick an open item (start with P0s).
2. Mark **status** column → `in-progress`, create the PR.
3. When merged → `done` (and check off the entry in any open PR description that referenced it).
4. New items get appended to the right section and added to the Status table.

Status legend: `open` / `in-progress` / `done` / `dropped` (decided not to do).
