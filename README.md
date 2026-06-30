# Remix Portfolio

Personal portfolio + online CV for Gonzalo Alvarez Campos, built with [Remix](https://remix.run/) v2.17 and deployed on [Cloudflare Pages](https://pages.cloudflare.com/). Live at <https://gonzalo-alvarez-campos-cv.com/>.

Bilingual (English + Spanish) with a visible locale toggle, a downloadable CV (PDF), per-route Open Graph previews, dark/light theming, and a print stylesheet. A future migration to [React Router v7](https://reactrouter.com/) is on the roadmap ([TECH-DEBT.md](TECH-DEBT.md), entry T9) but not actively planned.

---

## Getting Started

### Prerequisites

To run this project locally, you will need:

- **Node.js** (v22.0 or higher — see [.nvmrc](.nvmrc))
- **npm** (v10 or higher)
- **Wrangler CLI** (for Cloudflare Pages — included as a dev dependency)
- **Docker Desktop** (only required if you regenerate visual-regression baselines locally — the CI workflow is the recommended path; see [Visual baselines](#visual-baselines) below)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Alvacampos/remix-portfolio.git
   cd remix-portfolio
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
   This also installs the `simple-git-hooks` pre-push hook (see [Pre-push hook](#pre-push-hook)).
3. Run the development server:
   ```sh
   npm run dev
   ```
   App runs on <http://localhost:8788>.

### Useful Scripts

| Command                      | What it does                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                | Local dev server on port 8788                                                     |
| `npm run build`              | Production build (`build/client` + `build/server`)                                |
| `npm run preview`            | Build, then preview the bundle on Cloudflare Pages locally                        |
| `npm run deploy`             | Build and deploy to Cloudflare Pages                                              |
| `npm run typecheck`          | `tsc --noEmit`                                                                    |
| `npm run lint`               | Stylelint + ESLint + ls-lint + Prettier                                           |
| `npm test`                   | Vitest unit / component tests                                                     |
| `npm run test:e2e`           | Playwright (chromium + Pixel 7 mobile)                                            |
| `npm run test:visual`        | Visual-regression spec only (chromium + mobile)                                   |
| `npm run test:visual:update` | Regenerate visual baselines via the Playwright Docker image (see below)           |
| `npm run storybook`          | Storybook dev server on port 6006                                                 |
| `npm run build:svg`          | Optimize SVGs in `app/assets/icons` with SVGO                                     |
| `npm run build:icons`        | Generate React components from `app/assets/icons` via SVGR                        |
| `npm run build:og`           | Re-render the 4 per-route OG PNGs in `public/assets/img/` from `scripts/og/*.svg` |
| `npm run prepare`            | Install the `simple-git-hooks` pre-push hook (runs automatically after `install`) |

### Pre-push hook

A pre-push hook ([scripts/pre-push.sh](scripts/pre-push.sh), wired via `simple-git-hooks`) runs lint, typecheck, and unit tests automatically before any `git push`. E2E and visual specs run on CI to keep local push fast (~10s on a warm cache).

Bypass in an emergency with `git push --no-verify` — prefer fixing the failure.

For the full agent-facing reference (architecture, conventions, gotchas), see [AGENTS.md](AGENTS.md).

---

## Features

What this project ships that goes beyond a "static CV page":

- **Multi-route Remix app** with file-based flat routing — Home, Skills (with detail pages per work item), Education (with detail pages per degree), `/projects` case studies (with detail pages per write-up), and a downloadable CV PDF.
- **Internationalization** via `react-intl` — English and Spanish, with a visible `EN | ES` toggle in the NavBar. The active locale is resolved server-side by `pickLocale(request)` in priority order: `?lang=` URL param → `locale` cookie (set by the toggle) → `Accept-Language` header. The cookie ships on every request so the chosen locale persists across page navigations.
- **Single Fetch + lazy route discovery** — Remix v3 future flags enabled. Loaders return raw objects; the tenure heatmap, tech-grid, and timeline are JS-lazy-loaded so the initial `/skills` bundle stays small.
- **Skill-first JSON schema with Zod validation** — `public/data/skills.json` follows a skill-first model: every skill is authored once with a list of date-bounded ranges that point at jobs by id. Validated at worker boot (a malformed file throws a path-precise error before any consumer reads it). The tenure heatmap, autocomplete suggestions, and per-job chip lists all derive from the same payload — no parallel data sources. Static JSON files in `public/data/` are imported server-side and baked into the bundle; they're not served publicly (`_routes.json` excludes `/data/*` so scrapers can't lift the entire payload).
- **Cloudflare Pages deployment** — Pages Functions handle SSR via Wrangler, with edge-cached static assets (`Cache-Control: public, max-age=31536000, immutable`) and a per-route 1h cache on `/skills`.
- **Theme system on CSS custom properties** — `:root` + `[data-theme='light']` blocks in [app/styles/style.css](app/styles/style.css) drive every component's colors via `var(--accent)`, `var(--bg-base)`, etc. Numeric scale tokens (`--space-*`, `--font-*`, `--border-*`, `--weight-*`) live in the same block. Breakpoint tokens stay on `postcss-simple-vars` because `var()` is invalid inside `@media` preludes — the Tailwind-aligned scale (`$bp-sm`/`$bp-md`/`$bp-lg`/`$bp-xl`/`$bp-2xl`) lives in [app/styles/constants.js](app/styles/constants.js).
- **Per-route Open Graph images** — `scripts/og/<slug>.svg` templates render to `public/assets/img/og-<slug>.png` via `@resvg/resvg-js`. `mergeRouteMeta(args, { ogImage: '<slug>' })` picks the right variant per route. Run `npm run build:og` after editing a template.
- **Comprehensive test suite**:
  - **Vitest + React Testing Library** for components and utils — render helper that wraps trees in a memory router and IntlProvider so route-level concerns don't leak into unit tests.
  - **Playwright behavioural specs** for each route's loader and key interactions.
  - **Playwright visual-regression suite** — full-page screenshot diffs at desktop (chromium) and mobile (Pixel 7) viewports. See [Visual baselines](#visual-baselines) below.
  - **axe-playwright accessibility specs** ([tests/e2e/a11y.spec.ts](tests/e2e/a11y.spec.ts)) — runs axe on every route, fails the build on serious/critical violations.
  - **Storybook 10** with stories colocated next to each component, plus a11y + docs addons.
- **Accessibility-first**:
  - SVGR-generated icons ship `aria-hidden="true"` by default (decorative); the Lighthouse `svg-img-alt` audit is `notApplicable` because no SVGs claim a `role="img"` they can't fulfill.
  - Custom autocomplete combobox follows ARIA combobox patterns end-to-end.
  - Per-route canonical URLs from the root loader.
  - WCAG 2.4.1 skip-link in the root layout.
- **Performance-tuned**:
  - Lighthouse mobile (Lantern simulation) across the last ~20 merges to main: Performance **0.94–0.98**, FCP **1.5s**, LCP **2.4s**, TBT 0ms, CLS 0. Per-commit summaries committed back to [lighthouse/](lighthouse/) by a GitHub Action ([.github/workflows/lighthouse.yml](.github/workflows/lighthouse.yml)) after every push to main.
  - JS code-split for below-the-fold heavy components (TenureHeatmap, vertical timeline, tech grid).
  - Stylesheet count on `/skills` collapsed via `postcss-import` inlining of small components into route stylesheets, while keeping JS-lazy components on a manual CSS-preload pattern.
- **CI gates on every PR** ([.github/workflows/ci.yml](.github/workflows/ci.yml)) — lint, typecheck, unit tests, E2E (behavioural + visual + a11y), Storybook build. Visual-diff PNGs auto-upload as artifacts when a screenshot test fails.

---

## Visual baselines

The Playwright visual-regression suite ([tests/e2e/visual.spec.ts](tests/e2e/visual.spec.ts)) gates a subset of routes by full-page screenshot diff. Baselines live at `tests/e2e/visual.spec.ts-snapshots/<name>-<project>-linux.png` and are committed for **Linux only** — on macOS the spec auto-skips itself, so `npm run test:e2e` on a Mac stays green without committing Mac-rendered PNGs.

When you intentionally change layout / spacing / colors, regenerate the baselines and commit them with your PR. Two paths:

### Path 1 — CI workflow (recommended)

Trigger [.github/workflows/regen-baselines.yml](.github/workflows/regen-baselines.yml) on your branch:

```sh
gh workflow run regen-baselines.yml --ref <branch-name>
```

Or click **Run workflow** on the Actions tab. The job runs inside the exact Playwright Docker image CI uses, regenerates the PNGs, and commits them back to the dispatched branch automatically. This is the recommended path because:

- It runs in the same environment that gates the PR — no risk of cross-platform pixel drift.
- It sidesteps a `useLocation()` hydration race that affects local Docker regen on a couple of routes.
- No local Docker setup needed.

The `project` input lets you scope to `chromium`, `mobile`, or `both` (default).

### Path 2 — Local Docker

```sh
npm run test:visual:update
```

Runs Playwright inside the `mcr.microsoft.com/playwright:v<version>-jammy` Docker image so the PNGs match what CI will produce. Requires Docker Desktop. On Apple Silicon the script forces `--platform=linux/amd64` so the regen runs as x86_64 — matching the GitHub Actions runners — which means QEMU emulation and ~2-3 minutes runtime.

After it finishes, review the PNGs under `tests/e2e/visual.spec.ts-snapshots/` and commit them.

### Why some routes aren't gated

`/skills` index is excluded because the tenure-heatmap renders ~30 SVG cells per row, and sub-pixel anti-aliasing on those cells drifts ~0.4% across environments — invisible to the eye but consistently above the 0.2% diff budget. This is a tool-agnostic limitation; Percy/Chromatic would pixel-diff the same way. Behavioural coverage in [tests/e2e/skills.spec.ts](tests/e2e/skills.spec.ts) keeps the route gated.

See [tests/e2e/README.md](tests/e2e/README.md) for the full reference (adding routes, tolerances, troubleshooting).

---

## Updating content

The CV is content-driven via JSON files in `public/data/`:

- **Work history + skills**: [public/data/skills.json](public/data/skills.json). Skill-first schema — every skill is authored once with a list of `ranges` pointing at job ids. Adding a skill to a job means pushing `{ jobId: N }` onto its `ranges` array. Adding a job means pushing a new `WORK_ITEMS` entry with the next `id`, then going through every relevant `SKILLS[].ranges` and adding the new id to the ones that apply.
- **Education**: [public/data/education.json](public/data/education.json) (degree, associate degree, certifications).
- **Case studies**: [public/data/projects.json](public/data/projects.json).

All three are validated at boot via Zod schemas in [app/data/](app/data/). A malformed file throws a path-precise error before any consumer reads it.

### Localization (`_es` siblings)

String fields use inline `_es` siblings — `description` carries an optional `description_es` next to it. Consumers resolve via [`localized(item, key, locale)`](app/utils/utils.tsx). Falls back to the English field when the `_es` sibling is missing or empty, so partial translation is fine.

### Adding a third locale

1. Extend `SUPPORTED_LOCALES` and `MESSAGES` in [app/intl/index.ts](app/intl/index.ts).
2. Drop a sibling JSON next to `en-US.json` and `es-ES.json`.
3. Add a button to [app/components/LocaleToggle/index.tsx](app/components/LocaleToggle/index.tsx). The toggle iterates over `SUPPORTED_LOCALES` so the JSX is automatic — just verify the CSS knob's `--knob-index` math still works for the new column count.

---

## AI Assistance

Most of this project was built solo, but throughout 2026 I used [Claude Code](https://claude.com/claude-code) (Anthropic's CLI for the Claude family of models) as a pair-programming collaborator — and the experience genuinely changed how I work on side projects.

The model didn't write the project for me; it helped me push it past where I'd normally stop. Concretely:

- **Performance recovery**: when Lighthouse showed `/skills` LCP regressing under Lantern simulation after I introduced JS code-splitting, Claude helped me understand it was a per-stylesheet round-trip cost (12 render-blocking stylesheets) and proposed `postcss-import` inlining as the recovery — keeping the JS chunk-split intact while collapsing CSS to 7 sheets. LCP recovered from 0.87 → 0.94. The diagnosis took two prompts.
- **Visual-regression infrastructure**: I described what I wanted ("screenshot tests, locally free") and Claude walked me through the trade-offs (cross-platform pixel diffs, fontconfig drift between Ubuntu versions, why baselines need to live in the same Docker image CI uses). The first CI run failed on exactly the issue it had warned me about (Ubuntu 22.04 baselines vs ubuntu-latest = 24.04 runner) — so the fix was already understood when it happened. We landed pixel-parity by running CI inside the Playwright image itself, then later moved the regen path itself to a CI workflow so a local hydration race stopped being a blocker.
- **Accessibility + SEO sweep**: identified canonical URL pinning to homepage and the `svg-img-alt` audit failures from SVGR's default `role="img"` — both were 0.92 SEO / 0.99 a11y bumps to perfect scores, neither would have been on my radar without the audit pass.
- **Code review at PR time**: I asked Claude to "audit the look as a UI designer" with screenshots and it produced a prioritised punch-list that drove a chunk of follow-up work. Honest about its own earlier wrong calls (one row was a browser overlay, not a real CSS issue — it flagged the correction itself).
- **Documentation as code grew**: AGENTS.md (architecture + conventions for AI agents working on the repo) was largely written by Claude, refined by me, then kept in sync stage-by-stage as the project evolved. It made onboarding a hypothetical second contributor — or future-me — into a 5-minute read.

Things I learned about working with an AI collaborator on a real project:

1. **Ask it to push back.** When I asked "should we screenshot-test everything per-component?" it pushed for a tighter scope (5 routes, not 50 components). The cheap option was the right one.
2. **Make it justify decisions.** Every non-obvious choice (linux-only baselines, named Docker volume for `node_modules`, pre-push not pre-commit) came with an explicit reason, which meant I learned the trade-off rather than just inheriting the answer.
3. **Treat it like a colleague who has memory limits.** I keep an [AGENTS.md](AGENTS.md) so context doesn't have to be re-derived every session, and I let Claude maintain a `~/.claude/projects/.../memory/` for things it should remember about how I work.
4. **It's a force multiplier, not a substitute.** I still write the code, make the architectural calls, and decide what ships. But the friction of "I should do X but it'll take an afternoon" disappeared, which means more X actually got done.

---

## Roadmap

The active backlog lives in [TECH-DEBT.md](TECH-DEBT.md) — technical improvements, cleanup items, and UI/feature ideas, each with a priority and a status column. Remaining work is grouped into a few phased bundles (investigate → plan → apply) so each PR has a focused diff.
