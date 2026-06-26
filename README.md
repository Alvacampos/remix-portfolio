# Remix Portfolio

Welcome to my personal portfolio project! This is an ongoing project built with [Remix](https://remix.run/) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/). The goal of this project is to showcase my skills, experience, and education in a visually appealing and interactive way. The site is bilingual (English + Spanish) with a visible locale toggle and a downloadable CV.

The project has been deployed and is hosted in this url https://gonzalo-alvarez-campos-cv.com/

Although the project is currently built with Remix, a migration to [React Router](https://reactrouter.com/) or [Next.js](https://nextjs.org/) is a possibility in the future, but it is not planned for the near term.

---

## Getting Started

### Prerequisites

To run this project locally, you will need:

- **Node.js** (v20.19 or higher — see [.nvmrc](.nvmrc))
- **npm** (v10 or higher)
- **Wrangler CLI** (for Cloudflare Pages — included as a dev dependency)
- **Docker Desktop** (only required if you regenerate visual-regression baselines — see [Features](#features) below)

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
3. Run the development server:
   ```sh
   npm run dev
   ```

### Useful Scripts

| Command                      | What it does                                                     |
| ---------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                | Local dev server on port 8788                                    |
| `npm run build`              | Production build (`build/client` + `build/server`)               |
| `npm run preview`            | Build, then preview the bundle on Cloudflare Pages locally       |
| `npm run deploy`             | Build and deploy to Cloudflare Pages                             |
| `npm run typecheck`          | `tsc --noEmit`                                                   |
| `npm run lint`               | Stylelint + ESLint + ls-lint + Prettier                          |
| `npm test`                   | Vitest unit / component tests                                    |
| `npm run test:e2e`           | Playwright (chromium + Pixel 7 mobile)                           |
| `npm run test:visual`        | Visual-regression spec only (chromium)                           |
| `npm run test:visual:update` | Regenerate visual baselines via the Playwright Docker image      |
| `npm run storybook`          | Storybook dev server on port 6006                                |
| `npm run build:svg`          | Optimize SVGs in `app/assets/icons` with SVGO                    |
| `npm run build:icons`        | Generate React components from `app/assets/icons` via SVGR       |
| `npm run build:og`           | Re-render `public/assets/img/og.png` from `scripts/og-image.svg` |

A pre-push git hook (husky) runs lint, typecheck, and unit tests automatically before any `git push`. E2E and visual specs are deferred to CI to keep the local push fast.

For the full agent-facing reference (architecture, conventions, gotchas), see [AGENTS.md](AGENTS.md).

---

## Features

What this project ships that goes beyond a "static CV page":

- **Multi-route Remix app** with file-based flat routing — Home, Skills (with detail pages per work item), Education (with detail pages per degree), and a downloadable CV.
- **Internationalization** via `react-intl` — English and Spanish, with a visible `EN | ES` toggle in the NavBar. The active locale is resolved server-side by `pickLocale(request)` in priority order: `?lang=` URL param → `locale` cookie (set by the toggle) → `Accept-Language` header. The cookie ships on every request so the chosen locale persists across page navigations.
- **Single Fetch + lazy route discovery** — Remix v3 future flags enabled. Loaders return raw objects; the tenure heatmap, tech-grid, and timeline are JS-lazy-loaded so the initial `/skills` bundle stays small.
- **Skill-first JSON schema with Zod validation** — `public/data/skills.json` follows a skill-first model: every skill is authored once with a list of date-bounded ranges that point at jobs by id. Validated at worker boot (a malformed file throws a path-precise error before any consumer reads it). The tenure heatmap, autocomplete suggestions, and per-job chip lists all derive from the same payload — no parallel data sources.
- **Cloudflare Pages deployment** — Pages Functions handle SSR via Wrangler, with edge-cached static assets (`Cache-Control: public, max-age=31536000, immutable`) and a per-route 1h cache on the skills page.
- **Comprehensive test suite**:
  - **Vitest + React Testing Library** for components and utils — render helper that wraps trees in a memory router and IntlProvider so route-level concerns don't leak into unit tests.
  - **Playwright behavioural specs** for each route's loader and key interactions.
  - **Playwright visual-regression suite** — full-page screenshot diffs for `/`, `/education`, `/education/:slug`. (The `/skills` routes are excluded — the heatmap's tight SVG cell grid and the dev-server hydration timing on `/skills/:uuid` both drift across environments; both stay covered by behavioural specs.) Baselines are committed for Linux only (macOS auto-skips); CI runs Playwright inside the same `mcr.microsoft.com/playwright:vX.Y.Z-jammy` Docker image baselines were captured in, guaranteeing pixel-perfect parity.
  - **Storybook 10** with stories colocated next to each component, plus chromatic + a11y addons.
- **Accessibility-first**:
  - SVGR-generated icons ship `aria-hidden="true"` by default (decorative); the Lighthouse `svg-img-alt` audit is `notApplicable` because no SVGs claim a `role="img"` they can't fulfill.
  - Custom autocomplete combobox follows ARIA combobox patterns end-to-end.
  - Per-route canonical URLs from the root loader.
- **Performance-tuned**:
  - Lighthouse mobile (Lantern simulation): Accessibility 1.00, Best Practices 1.00, SEO 1.00; Performance 0.81–0.87 across routes (see `lighthouse/` for per-commit summaries).
  - JS code-split for below-the-fold heavy components (TenureHeatmap, vertical timeline, tech grid).
  - Stylesheet count on `/skills` collapsed from 12 → 7 via `postcss-import` inlining of small components into route stylesheets, while keeping JS-lazy components on a manual CSS-preload pattern.
- **Design tokens as a single source of truth** — `app/styles/constants.js` exports tokens injected into PostCSS as `simple-vars`. Unknown variable references emit warnings at build, so token drift is caught before it ships.
- **CI gates on every PR** — lint, typecheck, unit tests, E2E (behavioural + visual), Storybook build. Visual-diff PNGs auto-upload as artifacts when a screenshot test fails.

---

## AI Assistance

Most of this project was built solo, but throughout 2026 I used [Claude Code](https://claude.com/claude-code) (Anthropic's CLI for the Claude family of models) as a pair-programming collaborator — and the experience genuinely changed how I work on side projects.

The model didn't write the project for me; it helped me push it past where I'd normally stop. Concretely:

- **Performance recovery**: when Lighthouse showed `/skills` LCP regressing under Lantern simulation after I introduced JS code-splitting, Claude helped me understand it was a per-stylesheet round-trip cost (12 render-blocking stylesheets) and proposed `postcss-import` inlining as the recovery — keeping the JS chunk-split intact while collapsing CSS to 7 sheets. LCP recovered from 0.87 → 0.94. The diagnosis took two prompts.
- **Visual-regression infrastructure**: I described what I wanted ("screenshot tests, locally free") and Claude walked me through the trade-offs (cross-platform pixel diffs, fontconfig drift between Ubuntu versions, why baselines need to live in the same Docker image CI uses). The first CI run failed on exactly the issue it had warned me about (Ubuntu 22.04 baselines vs ubuntu-latest = 24.04 runner) — so the fix was already understood when it happened. We landed pixel-parity by running CI inside the Playwright image itself.
- **Accessibility + SEO sweep**: identified canonical URL pinning to homepage (Stage 12 fix) and the `svg-img-alt` audit failures from SVGR's default `role="img"` — both were 0.92 SEO / 0.99 a11y bumps to perfect scores, neither would have been on my radar without the audit pass.
- **Code review at PR time**: I asked Claude to "audit the look as a UI designer" with screenshots and it produced a prioritised punch-list that drove a chunk of follow-up work. Honest about its own earlier wrong calls (one row was a browser overlay, not a real CSS issue — it flagged the correction itself).
- **Documentation as code grew**: AGENTS.md (architecture + conventions for AI agents working on the repo) was largely written by Claude, refined by me, then kept in sync stage-by-stage as the project evolved. It made onboarding a hypothetical second contributor — or future-me — into a 5-minute read.

Things I learned about working with an AI collaborator on a real project:

1. **Ask it to push back.** When I asked "should we screenshot-test everything per-component?" it pushed for a tighter scope (5 routes, not 50 components). The cheap option was the right one.
2. **Make it justify decisions.** Every non-obvious choice (linux-only baselines, named Docker volume for `node_modules`, pre-push not pre-commit) came with an explicit reason, which meant I learned the trade-off rather than just inheriting the answer.
3. **Treat it like a colleague who has memory limits.** I keep an [AGENTS.md](AGENTS.md) so context doesn't have to be re-derived every session, and I let Claude maintain a `~/.claude/projects/.../memory/` for things it should remember about how I work.
4. **It's a force multiplier, not a substitute.** I still write the code, make the architectural calls, and decide what ships. But the friction of "I should do X but it'll take an afternoon" disappeared, which means more X actually got done.

---

## Roadmap

The active backlog lives in [TECH-DEBT.md](TECH-DEBT.md) — technical improvements, cleanup items, and UI/feature ideas, each with a priority and a status column.
