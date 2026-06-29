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

## Active bundles (investigation → plan → apply)

Remaining work is grouped into four substantive bundles. Each bundle
runs in three phases — **investigate** (research the surface area
without touching code), **plan** (decide the concrete sequence), then
**apply** (one or more PRs). Order is intentional: foundational tokens
first, then the last `/skills` quality gap, then a real feature, then
the framework cutover.

| #   | Bundle                | Items     | Phase       | Notes                                                  |
| --- | --------------------- | --------- | ----------- | ------------------------------------------------------ |
| 1   | Style-system overhaul | T16 + T10 | planned     | Token sweep across `constants.js` + every CSS callsite |
| 2   | `/skills` quality     | T5 + T11  | not started | Perf investigation + visual-gate decision              |
| 3   | Contact + CF infra    | U6 + T12  | not started | Pages Function + KV bindings                           |
| 4   | Framework future      | T9        | not started | React Router v7 migration (multi-PR)                   |

**Ride-along candidates** (small enough to bundle with any of the above
when they fit thematically): C10, individual U11–U24 nice-to-haves.

**Blocked**: U10 (needs the Spanish CV PDF produced).

### Bundle 1 — Style-system overhaul (T16 + T10)

**Why bundle.** Both touch [app/styles/constants.js](app/styles/constants.js) and every CSS callsite. Sequencing them in one workstream means tokens get sweep-edited once instead of twice.

- **Investigate — DONE.** `var(--token)` cannot be used inside `@media`
  queries. The MQL5 grammar (`<mf-value> = <number> | <dimension> |
<ident> | <ratio>`) admits no function tokens, and custom properties
  resolve per-element at computed-value time — there's no element
  context for `@media` evaluation. MDN states it directly: _"Variables
  do not work inside media queries and container queries"_ ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)).
  Confirmed unsupported in every mainstream browser; this is
  spec-level, not a vendor gap. Workaround options:
  - Stay on a preprocessor (postcss-simple-vars, Sass) for media-query
    tokens — build-time substitution, works everywhere.
  - `@custom-media` rule (MQL5 working draft Feb 2026) via
    `postcss-custom-media` — native support is essentially 0% in 2026,
    so this is still build-time anyway, just with different syntax.
  - JS-emitted token generators (Style Dictionary, etc.) — overkill
    for ~5 breakpoints.

  **Decision: keep `postcss-simple-vars` for breakpoint tokens only;
  migrate every other token to CSS custom properties.** This unifies
  the system with the existing `:root { --bg-*, --fg-*, --accent }`
  setup that already powers dark/light theming in [app/styles/style.css](app/styles/style.css)
  — there's already a CSS-custom-property layer there, we're just
  rolling the rest of the tokens into it. Breakpoints stay on
  simple-vars (which is what they already use today) so we don't have
  to invent a separate mechanism just for `@media`.

- **Plan.**
  1. **T16 first.** Migration plan is already written (see [T16
     entry](#t16--standardise-breakpoints-legacy--tailwind-aligned-scale-p1--done));
     remaps 17 legacy `$mobile-small`/`$desktop-small`/`$desktop-medium`
     callsites to `$bp-sm`/`$bp-md`/`$bp-lg`/`$bp-xl`/`$bp-2xl`. No
     other token changes in that PR — keeps the diff reviewable and
     the visual-baseline regen scope bounded to layout shifts at the
     new breakpoint boundaries.
  2. **T10 second.** Sweep every non-breakpoint token in
     [constants.js](app/styles/constants.js) (~50 colour/spacing/border/
     radius/typography/shadow entries) into `:root` custom properties.
     Keep the JSON-keyed export only for the breakpoint subset that
     simple-vars consumes. Drop the simple-vars `unknown` callback for
     non-breakpoint tokens — `var(--foo)` typos read as inherited
     `unset` rather than a build warning, so we'll need stylelint's
     `declaration-property-value-no-unknown` (now re-enableable) +
     potentially `stylelint-use-defined-vars` or a small custom check
     to keep the typo-catcher coverage. T10 likely splits into 2 PRs
     by category (palette + theme first, then spacing/typography/
     borders) to keep visual-baseline regen scoped.
- **Apply.** T16 PR (visual baseline regen) → T10a PR (colour + theme
  tokens) → T10b PR (spacing + typography + borders + shadows). Final
  PR re-enables stylelint's `declaration-property-value-no-unknown`,
  `shorthand-property-no-redundant-values`, `color-function-alias-notation`
  per the §6 note in [AGENTS.md](AGENTS.md).

### Bundle 2 — `/skills` quality (T5 + T11)

**Why bundle.** Both are the last open items about `/skills`'s end-user
experience (one perf, one visual-regression coverage). Investigating
together avoids relearning the route's render path twice.

- **Investigate.** Run a WebPageTest waterfall against prod `/skills`
  to identify the LCP contributor (likely route stylesheet weight or
  Roboto critical path per [T5's notes](#t5--recover-skills-lighthouse-perf-p1)).
  Separately, assess whether [T7's CI-side regen workflow](#t7--move-visual-baseline-regen-to-ci-workflow-p1)
  already eliminates the hydration race that excludes `/skills` from
  the visual gate — if so, T11 reduces to "add `/skills` back to the
  ROUTES list in [visual.spec.ts](tests/e2e/visual.spec.ts)" and no
  paid service is needed.
- **Plan.** T5 fix scope depends on the waterfall (preload tweak, font
  subset, critical-path CSS extraction, etc.). T11 either becomes a
  one-line ROUTES change or gets dropped with rationale.
- **Apply.** T5 perf PR; T11 either a tiny extend-ROUTES PR or a
  TECH-DEBT entry update closing it out.

### Bundle 3 — Contact + CF infra (U6 + T12)

**Why bundle.** U6 (`/contact`) is what motivates T12 (Cloudflare
bindings); they ship together or T12 is just speculative scaffolding.

- **Investigate.** Evaluate Resend vs Loops for transactional email
  (deliverability, free tier, DX). Decide rate-limit design (per-IP
  per-hour via KV) and spam protection (honeypot field vs Cloudflare
  Turnstile vs both). Confirm CF Pages Function patterns for body
  parsing + KV reads.
- **Plan.** Pages Function endpoint, form schema (Zod), intl keys for
  every state (idle / submitting / success / error / rate-limited),
  UX shape (single-page form vs modal).
- **Apply.** Route + Pages Function + KV binding wiring + NavBar entry
  in a single PR. Closes T12 implicitly (bindings are now real, not
  speculative).

### Bundle 4 — Framework future (T9)

**Why standalone.** Doesn't share code with the other bundles; touches
every route file plus dev tooling.

- **Investigate.** Walk the [RR v7 upgrade guide](https://reactrouter.com/upgrading/v7),
  identify which Single Fetch behaviours need adjustment, list the
  file moves (`app/routes/` flat-routes → RR v7 convention), and check
  Cloudflare adapter compatibility.
- **Plan.** Probably 2–3 PRs (tooling/deps, routes migration, cleanup).
  Also resolves the T15-era `react-router-dom` pinning workaround
  documented in [AGENTS.md](AGENTS.md) — the v7 single package
  replaces the dual `@remix-run/react` + `react-router-dom` setup.
- **Apply.** Sequence the staged PRs. Visual baselines stay valid if
  the rendered HTML doesn't change.

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
| T14 | Technical | P3       | Replace husky with simple-git-hooks                            | done   |
| T15 | Technical | P3       | `import/no-relative-parent-imports` ESLint rule                | done   |
| T16 | Technical | P1       | Standardise breakpoints (legacy → Tailwind-aligned scale)      | done   |
| C1  | Cleanup   | P0       | Doc drift: README locale claims                                | done   |
| C2  | Cleanup   | P0       | Doc drift: README "Future Plans" (Python/Django, contact form) | done   |
| C3  | Cleanup   | P0       | Doc drift: AGENTS.md cross-refs to README plans                | done   |
| C4  | Cleanup   | P1       | Data: `Mentoring` ranges (Endava + Qubika missing)             | done   |
| C5  | Cleanup   | P1       | Data: `Leadership` ranges (Qubika missing?)                    | done   |
| C6  | Cleanup   | P2       | Rename ambiguous `Programming` meta skill                      | done   |
| C7  | Cleanup   | P2       | Merge `getSkillsForJob` into `getSkillGroupsForJob`            | done   |
| C8  | Cleanup   | P3       | Move `mergeRouteMeta` out of `utils.tsx`                       | done   |
| C9  | Cleanup   | P3       | Move `FORWARD_GROUPS` out of TechTree component                | done   |
| C10 | Cleanup   | P3       | Validate `name_es` typos against a locale registry             | open   |
| C11 | Cleanup   | P3       | Verify `npm run build:og` still works                          | done   |
| C12 | Cleanup   | P3       | Audit `app/assets/icons/` for orphans                          | done   |
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

### T14 — Replace husky with simple-git-hooks (P3) — DONE

Replaced husky with `simple-git-hooks`. The pre-push script now lives at [scripts/pre-push.sh](scripts/pre-push.sh) (was [.husky/pre-push](.husky/pre-push)) and gets wired in via a new `simple-git-hooks` block in `package.json` plus a `prepare` script that invokes the binary. Migrating an existing clone requires `git config --unset core.hooksPath` once (husky set it to `.husky/_`); fresh clones don't need that step.

### T15 — `import/no-relative-parent-imports` ESLint rule (P3) — DONE

Implemented as a `no-restricted-imports` rule (the upstream `import/no-relative-parent-imports` rule resolves aliased paths to absolute paths, which false-positives on every `~/`-prefixed import in `app/`). The rule bans literal `../*` import specifiers and points authors at `~/*` (for `app/`) or the new `~data/*` alias (for `public/data/`). Added `~data/*` to both `tsconfig.json` and `jsconfig.json` so route loaders that read static JSON can use it. One escape hatch at `functions/[[path]].ts` (the Pages Function entrypoint legitimately imports the build output at `../build/server`).

### T16 — Standardise breakpoints (legacy → Tailwind-aligned scale) (P1) — DONE

All 17 legacy callsites swept to the Tailwind-aligned scale: `$mobile-small` (496) → `$bp-sm` (640); `$desktop-small` (1076) → `$bp-lg` (1024); `$desktop-medium` (1296) → `$bp-xl` (1280). Added `$bp-2xl: 1536px` for future ultrawide work. Deleted the three legacy keys from [constants.js](app/styles/constants.js). Also caught a hardcoded `(min-width: 1076px)` in [TenureHeatmap/index.tsx](app/components/TenureHeatmap/index.tsx) that mirrored the CSS breakpoint and updated it to `1024px` so JS and CSS gate at the same width.

**Original plan + current state for reference:**

[app/styles/constants.js](app/styles/constants.js) exports two parallel sets of breakpoint tokens:

| Token             | Value  | Usages | Origin                                                    |
| ----------------- | ------ | ------ | --------------------------------------------------------- |
| `$mobile-small`   | 496px  | 4      | Legacy — pre-Tailwind. Awkward; mid-phone-landscape band. |
| `$desktop-small`  | 1076px | 10     | Legacy — splits iPad Pro 11" landscape (1194) awkwardly.  |
| `$desktop-medium` | 1296px | 2      | Legacy — Tailwind `xl` (1280) + 16px noise.               |
| `$bp-sm`          | 640px  | —      | Tailwind-aligned. Currently unused in code.               |
| `$bp-md`          | 768px  | ~6     | iPad portrait, in use.                                    |
| `$bp-lg`          | 1024px | ~6     | iPad landscape / small laptops, in use.                   |
| `$bp-xl`          | 1280px | —      | Standard desktop. Currently unused.                       |

17 legacy usages across 10 stylesheets (4 routes + 4 components + 1 route shell + 1 helper) plus 12 new-token usages. The mixed scale makes it impossible to reason about a layout's break behaviour without opening the constants file.

**Goal.** Single mobile-first scale anchored to common device viewport widths, aligned with Tailwind v4 (also matches Bootstrap 5 and Material). Drop the three legacy tokens; add `$bp-2xl` for ultrawide content-max-width work.

**Target scale (`@media (min-width: $bp-*)`)**:

| Token     | Value  | Devices this catches                                          |
| --------- | ------ | ------------------------------------------------------------- |
| _(base)_  | < 640  | Every phone in portrait (320 SE → 430 Pro Max).               |
| `$bp-sm`  | 640px  | Phone landscape (~700-900 wide). Compact tablets.             |
| `$bp-md`  | 768px  | iPad portrait (744-834). Z Fold inner. Large phone landscape. |
| `$bp-lg`  | 1024px | iPad landscape (1024-1194). Small laptops.                    |
| `$bp-xl`  | 1280px | iPad Pro 12.9" landscape. Standard 13-15" laptops.            |
| `$bp-2xl` | 1536px | 27" external monitors. Cap content max-width above this.      |

Standardising on the Tailwind scale means future contributors (or AI agents) can map directly between Tailwind utility prefixes and our token names without translation.

**Migration plan (one PR, ~30 min):**

1. Add `$bp-2xl: 1536px` to [app/styles/constants.js](app/styles/constants.js).
2. Sweep all 17 legacy usages and remap:
   - `$mobile-small` (496) → `$bp-sm` (640). Affected: [Input](app/components/Input/style.css), [Timeline](app/components/Timeline/style.css), [skills.$uuid](app/routes/skills.$uuid/style.css), [skills.\_index](app/routes/skills._index/style.css). The +144px floor is intentional — modern phones in portrait now go up to 430px wide, so the legacy 496 fires mid-landscape on most flagships. Re-test each affected layout at 412-640 to confirm the new floor is comfortable.
   - `$desktop-small` (1076) → `$bp-lg` (1024). Affected: [Card](app/components/Card/style.css), [Input](app/components/Input/style.css), [TenureHeatmap](app/components/TenureHeatmap/style.css), [Timeline](app/components/Timeline/style.css), all four routes that use it. The -52px lift is small enough that most layouts should hold; the TenureHeatmap explicitly tuned for 1076 (see [TenureHeatmap/style.css#L139](app/components/TenureHeatmap/style.css#L139)) — verify the transposed grid still fits at 1024.
   - `$desktop-medium` (1296) → `$bp-xl` (1280). Affected: [Timeline](app/components/Timeline/style.css), [skills.\_index](app/routes/skills._index/style.css). The -16px shift is below visual noise.
3. Delete `mobile-small`, `desktop-small`, `desktop-medium` keys from [constants.js](app/styles/constants.js).
4. Regenerate visual baselines via the CI workflow ([.github/workflows/regen-baselines.yml](.github/workflows/regen-baselines.yml)) — every gated route (`/`, `/education/:slug`) likely shifts at the 768/1024/1280 boundaries.
5. Update [AGENTS.md §6](AGENTS.md#L6) and the doc comment in [constants.js](app/styles/constants.js#L122) to reflect the single scale.

**Out of scope.**

- **Sub-640 breakpoint** (e.g. 414 / 480 for large-phone-landscape). web.dev's mobile-first guidance is to let content dictate rather than chase devices; base styles should already cover this band cleanly. Revisit only if a real layout regression appears.
- **`prefers-reduced-motion` / `prefers-color-scheme` queries** — orthogonal to this work; tracked separately (U24).
- **Container queries** (`@container`). Worth piloting on a single component (e.g. Card) once we're off the legacy scale, but not a prereq for this migration.

**Devices on the bubble worth manually testing after migration:** iPhone SE 1st gen (320), Galaxy S24 (360), iPad mini portrait (744), iPad Pro 11" landscape (1194), 13" MacBook external (~1440). Chrome DevTools Responsive mode + the Pixel 7 Playwright project cover most of this.

Sources consulted:

- [Tailwind v4 responsive design](https://tailwindcss.com/docs/responsive-design) — sm/md/lg/xl/2xl = 640/768/1024/1280/1536.
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) — prefer content-driven over device-driven breakpoints; rem/em over px.
- [web.dev — Responsive Web Design basics](https://web.dev/articles/responsive-web-design-basics) — let content dictate; minimise breakpoint count.

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

### C6 — Rename ambiguous `Programming` meta skill (P2) — DONE

Renamed to "Teaching Programming" (`Enseñanza de Programación`) in [public/data/skills.json](public/data/skills.json). The meta-skill is tagged on Professor + Teacher roles; the verb-first form reads naturally next to the existing "Teaching" chip and disambiguates from the literal act of writing code.

### C7 — Merge `getSkillsForJob` into `getSkillGroupsForJob` (P2) — DONE

Dropped `getSkillsForJob` from [app/utils/utils.tsx](app/utils/utils.tsx); its single consumer (`/skills` index timeline cards) now calls `getSkillGroupsForJob(SKILLS, item.id, locale).flatMap((g) => g.items)`. Side effects: timeline-card chips are now (a) locale-aware (previously always English for meta skills) and (b) deterministically ordered (`language → framework → tooling → infra → meta`, alphabetical within each) instead of SKILLS-array order. Test suite trimmed accordingly.

### C8 — Move `mergeRouteMeta` out of `utils.tsx` (P3) — DONE

Extracted `mergeRouteMeta`, `RouteMetaOverrides`, and the `SITE_URL` constant into [app/utils/meta.ts](app/utils/meta.ts). All 6 route consumers updated to import from `~/utils/meta`. `utils.tsx` now sits at ~340 lines, focused on layout/data helpers; the meta-tag concern lives in its own module.

### C9 — Move `FORWARD_GROUPS` out of TechTree component (P3) — DONE

Moved `FORWARD_GROUPS` + the `ForwardGroup` type into [app/components/TechTree/forward-groups.ts](app/components/TechTree/forward-groups.ts). The component now just imports the constant. Kept the data co-located with the component rather than promoting it to `skills.json` — these are aspirations (no SKILLS entry, no range), not job experiences, so the data shape doesn't match the skill-first schema.

### C10 — Validate `name_es` typos against a locale registry (P3)

Schema accepts any string for `name_es`. A typo (Mentoria vs Mentoría) won't be caught at boot. Low risk but worth a guard once the soft-skill set stabilizes.

### C11 — Verify `npm run build:og` still works (P3) — DONE

Ran `npm run build:og` on `main` after the per-route OG PR landed. All four PNGs (`og-home.png`, `og-education.png`, `og-projects.png`, `og-skills.png`) re-rendered deterministically with no byte drift against the committed copies. The script reads `scripts/og/<slug>.svg`, swaps in the title/tagline at template time, and writes to `public/assets/img/og-<slug>.png` via `@resvg/resvg-js`. Repeatable + idempotent.

### C12 — Audit `app/assets/icons/` for orphans (P3) — DONE

Audited the 8 source SVGs against the codebase. All map to a real consumer: `Briefcase` (NavBar + Timeline), `Education` (NavBar + Timeline + both education routes), `GithubIcon`, `Home`, `LinkedinIcon`, `Paper` (all NavBar), `Sun` + `Moon` (ThemeToggle). No orphans to remove.

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
