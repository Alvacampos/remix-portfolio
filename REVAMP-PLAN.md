# Visual revamp plan

> Goal: refresh the look-and-feel of `gonzalo-alvarez-campos-cv.com` for 2026
> while keeping the routing, data shape, and Remix scaffolding intact. The
> aesthetic stays in the dark / GitHub-inspired lane — modernized, not
> rebuilt.
>
> Subject is a Senior Software Engineer (~8 years) on a React / TS / Next.js /
> Node / Python / Django stack. Goal of the site is to **display experience
> and skills** — read as professional CV first, design portfolio second.
>
> Owner: Gonzalo Alvarez Campos. Living document — refine as work lands.

---

## Status

**Phase:** plan written, awaiting review. No code changed yet.

**Branches:**

- `stage-25-revamp-plan` — this document only.
- `stage-26-revamp-foundation` — global tokens, type, theme toggle (PR 1).
- `stage-27-revamp-home` — home page (PR 2).
- `stage-28-revamp-skills` — `/skills` index + `/skills/:uuid` (PR 3).
- `stage-29-revamp-education` — `/education` index + `/education/:slug` (PR 4).
- `stage-30-revamp-cleanup` — visual baselines regen, perf re-measure, doc sync (PR 5).

Each branch builds on the previous; expect 4-7 commits per branch.

---

## Research summary

Synthesized from ~10 reference sites and pattern verdicts. Key findings
(condensed; full notes in chat history):

**Reference cohort.** Senior-engineer portfolios that read current in
mid-2026: leerob.com, joshwcomeau.com, brittanychiang.com (current/v5),
linear.app/method, vercel.com/careers, rauno.me, emilkowal.ski, antfu.me,
cassidoo.co. Common DNA: airy density, near-monochrome with at most one
accent, mono-mixed-with-sans for metadata, prose voice over component
spectacle, restrained motion.

**Information architecture.** Multi-route is the universal pattern for
senior engineers (≥8 years). Single-scroll is for designers/agencies and
"one hero project" portfolios. Recommendation: **keep the existing
multi-route shape** (`/`, `/skills`, `/skills/:uuid`, `/education`,
`/education/:slug`).

**Aesthetic trends — current.** Mono + sans pairing, oversized display
type used sparingly (4-6rem hero, not 12rem), film-grain texture, subtle
border-shift hover, View Transitions API, theme toggle.

**Aesthetic trends — dated.** Cursor-follow spotlight (Brittany v4
clone tax), terminal hero with typing animation, marquee infinite-scroll
skill rows, gradient text on every headline, glassmorphism on dark,
profile-photo-as-hero, Lottie mascots, animated number counters,
"Hi, I'm X 👋" hero formula.

**Color systems.** GitHub-default-dark (`#0d1117`) is now dated by
association — reads as "cloned a template." Move to a cool near-black
(zinc-950 `#09090b` or Linear's `#08090a`). Keep green as identity
continuity but shift from `#2ea043` to **emerald `#10b981`** for a
fresher register.

**Typography.** Top picks for free, current, dark-mode-friendly:

1. **Geist Sans + Geist Mono** (Vercel, OFL). Designed as a pair, tight
   numerals for chips, the "2026 default" for dev-tool sites. Risk:
   strong association with the Vercel ecosystem.
2. **Inter v4 + JetBrains Mono** (free, OFL). Safer, more neutral. Inter
   v4 has tabular figures, true italics, slashed-zero variant.

Recommendation in this plan: **Geist Sans + Geist Mono**, with a fallback
sentence on rationale below.

---

## Cross-cutting work (Stage 26 — foundation)

These changes land before per-page work because the per-page work depends
on them. One PR, ~3-5 commits.

### 1. Type system

- **Add Geist Sans + Geist Mono** as self-hosted variable WOFF2 files
  under `public/fonts/geist/`. Mirrors the existing `public/fonts/roboto/`
  pattern — full control over caching headers, no runtime dep on the
  `geist` npm package, no Vite-asset plumbing. Keep Roboto present as
  fallback through Stage 29; Stage 30 deletes the Roboto folder.
- Drop the existing Roboto preload in `app/root.tsx`. Add Geist Sans
  preload.
- New scale in `app/styles/constants.js`:
  - `display`: 56px / 1.05 / -0.02em (hero h1)
  - `h1`: 40px / 1.1 / -0.015em
  - `h2`: 28px / 1.2 / -0.01em
  - `h3`: 20px / 1.3 / -0.005em
  - `body`: 16px / 1.5
  - `small`: 14px / 1.5
  - `mono`: 14px / 1.5 (Geist Mono for chips, dates, code)
- Keep existing `$font-N` tokens for the migration; add new
  `$type-display`, `$type-h1`, etc. tokens. Migrate per-route as we
  touch them.

### 2. Color tokens

Update `app/styles/constants.js`:

```js
// Before                          After (new)
'default-black':       '#0d1117',  // → '#09090b' (zinc-950)
'background-variation':'#161b22',  // → '#18181b' (zinc-900)
'card-border':         '1px solid #30363d',  // → '1px solid #27272a' (zinc-800)
'success-green':       '#238636',  // → '#10b981' (emerald-500)
'variation-green':     '#216e39',  // → '#059669' (emerald-600)
'alternative-green':   '#2ea043',  // → '#34d399' (emerald-400)
'text-color':          '#f0f6fc',  // → '#fafafa' (zinc-50)
'default-grey':        '#60686c99',// → '#a1a1aa' (zinc-400 — body muted)
```

Add new tokens:

```js
'text-muted':       '#a1a1aa',  // body muted
'text-faint':       '#71717a',  // disabled / labels
'surface-elevated': '#27272a',  // hover / selected
'accent-emerald':   '#10b981',  // primary accent
'accent-amber':     '#f59e0b',  // secondary accent (used sparingly)
```

Color rationale:

- The zinc-950 base reads as "designed dark" without the GitHub blue
  cast that's started to feel template-y in 2026.
- Emerald keeps green identity continuity (the favicon, the og:image
  accent rail, the `Learn more →` CTA, the timeline icons all use
  green) while shifting to a fresher shade.
- Amber as a sparingly-used secondary lets us add typographic emphasis
  without leaning entirely on green (the og:image already uses orange-
  adjacent gradients elsewhere — this brings cohesion).

### 3. Theme toggle

Highest-leverage user-facing addition. Add `ThemeProvider` + a NavBar
toggle.

- Light + dark + `system` (default).
- Persist user override in `localStorage`.
- Set `<html data-theme="…">` on the server side via root loader using
  `Sec-CH-Prefers-Color-Scheme` if available, else `system` placeholder
  - client correction (avoids FOUC).
- Light-theme palette uses Tailwind zinc scale inverted:
  - bg `#fafafa`, surface `#f4f4f5`, text `#09090b`, muted `#52525b`,
    border `#e4e4e7`, accent `#059669`.
- Add the toggle as a small icon button in the NavBar (sun/moon icon).
  Mobile: same component, repositioned by existing media queries.

### 4. Motion + interaction primitives

- Add `prefers-reduced-motion` short-circuit in `app/styles/style.css`:

  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

- New `IntersectionObserver`-based `<Reveal>` component for fade-up on
  scroll entry. 200ms cross-fade, runs once. Used by per-page work.
- Card hover: drop `translateY(-2px)` + `box-shadow` pattern. Replace
  with `border-color` shift to `accent-emerald` over 120ms. Less Vercel-
  template-coded.
- Link hover: animated underline expand left-to-right. Replaces the
  current static-color-only style on text links.

### 5. Responsive strategy

**Current state.** The app is mobile-first by mechanism (all 18 media
queries use `min-width`) but under-baked in coverage:

| Token             | Value    | Targets                                    |
| ----------------- | -------- | ------------------------------------------ |
| `$mobile-small`   | `496px`  | Phones-bigger-than-SE                      |
| `$desktop-small`  | `1076px` | Small laptops / large tablets in landscape |
| `$desktop-medium` | `1296px` | Standard desktops                          |

**The gap:** there's no tablet breakpoint. Everything from 497px to
1075px (iPad portrait at 768px, every Android tablet, narrow laptop
windows) renders with the same layout as a 320px phone. That's why
the bar chart on `/skills` and the certifications grid on `/education`
both look stretched/awkward at iPad-portrait widths.

**Naming.** `mobile-small` is misleading — it's a `min-width` query
that means "bigger than mobile-small". On a fresh look it reads
inverted. Worth renaming during the migration.

**Target.** Standard 4-breakpoint mobile-first system:

```js
// app/styles/constants.js — proposed
'bp-sm':  '640px',    // small phone landscape, narrow tablets
'bp-md':  '768px',    // tablet portrait (iPad), large phones landscape
'bp-lg':  '1024px',   // tablet landscape, small laptops
'bp-xl':  '1280px',   // standard desktops
```

These match Tailwind's defaults — when something looks off, hiring
managers and other engineers reading the source will recognize the
scale immediately.

**Migration approach:**

1. **Stage 26 adds the new tokens** alongside the old ones. No file
   moves to the new tokens yet.
2. **Stages 27-29 migrate per-route.** Each per-page PR also rewrites
   that route's media queries to the new system. Old tokens stay
   referenced until the per-page PRs land; then deleted in Stage 30.
3. **Tablet breakpoint (`$bp-md` 768px) gets explicit attention** on
   each page during its revamp. Specifically:
   - `/skills` timeline: tablet should show full-width cards (currently
     squashed to ~40% width).
   - `/skills` bar chart: tablet should not horizontally squeeze the
     y-axis labels.
   - `/education` certifications grid: tablet should drop to 2 columns
     (currently 3 on desktop, 1 on mobile, awkward 3 attempted on
     iPad).

**Visual regression coverage.** Stage 16 set up 4 desktop visual
baselines (1280×720). The Playwright `mobile` project (Pixel 7,
412×915) runs behavioural specs but has **no visual baselines** —
mobile layout regressions are currently invisible to CI. Stage 30
should add 4 mobile baselines so the new tablet/mobile work is
gated.

**Touch affordances.** Two specific issues to address as we touch
each route:

1. The current carousel (being cut anyway) is touch-scrollable but
   has no momentum/snap.
2. The Card hover state swaps to `border-color` shift (Stage 26
   change) — `:hover` doesn't reliably fire on touch. Use
   `:focus-visible` + `:active` together so keyboard, mouse, and
   touch all get feedback.

### 6. Noise texture

Subtle film-grain SVG overlay on the body. Adds tactile depth, very
current, near-zero cost. One inline SVG `<filter>` plus `mix-blend-mode:
overlay` on a fixed `::before` at `opacity: 0.03`. Reduce-motion-safe
(no animation).

### 7. NavBar refactor

Current NavBar is a vertical sidebar on desktop with three labeled
buttons (Home / CV / Education). Two issues:

- **"CV" as label is ambiguous** when the page is also titled "Skills &
  Work Experience". Rename to `Work` or `Experience`.
- The QR code at the bottom of the NavBar is doing a lot. Keep — the
  research said personal-touch widgets work _if_ they're real (your
  LinkedIn QR is real), but reposition for better visual rhythm.

Concrete changes:

- Rename "CV" → "Work".
- Add the theme toggle button.
- Add a "Resume (PDF)" link in the nav (low-emphasis), demoting it
  from the home page hero CTA. Senior-portfolio convention is to have
  the PDF as a quiet always-available link, not a primary action.
- Mobile: switch from bottom-nav to top-bar to match the desktop
  layout's left-rail-becomes-top-bar pattern. (Optional — only if it
  doesn't bloat the PR. Defer if so.)

### 7. AGENTS.md + visual baselines

Update `AGENTS.md` §6 to point at the new tokens. Regen all 4 visual
baselines after foundation lands (carousel-less, theme-toggled, new
type, new colors).

---

## Page 1 — Home (`/`) — Stage 27

### Current state

```
NavBar (left rail)
─────────────────────────────────
<h1>Welcome, my name is Gonzalo Alvarez Campos.</h1>
<p>I'm a Software Engineer and I made this page so you can get to know me a little better</p>
<p>Check this project repo on GitHub</p>
<DownloadBtn>Download my CV (PDF)</DownloadBtn>
```

Centered vertically + horizontally. ~16px body type. PDF prefetch wired
(Stage 22). One page-level `<h1>`, plain.

### Issues observed

1. **"Welcome, my name is…" is the most-mocked dev-portfolio hero
   formula.** Personality-thin, period at the end is over-formal,
   doesn't lead with anything specific.
2. **The hero card competes with itself.** Three lines of body text +
   external link + download button all stacked center-aligned is
   visually busy without being informative.
3. **No specific value proposition.** What does the visitor learn that
   helps them decide whether to scroll, click into `/skills`, or close
   the tab?
4. **The download button is a giant primary CTA.** Per the research,
   senior portfolios put resume PDFs as quiet secondary links, not as
   the page's primary action.

### Target

A 2-section page: a typographic hero that says something specific, then
a small "currently" / "what I'm working on" chip row that links into
`/skills`. Three-line max copy.

Mock structure:

```
HERO
  <h1>Gonzalo Alvarez Campos</h1>            ← display, 56px, Geist Sans
  <p class="role">Senior Software Engineer · Tucumán, AR</p>    ← mono, 16px, muted
  <p class="lede">8 years building React, TypeScript, Next.js
    apps in fintech and edtech. Currently at Qubika.</p>        ← body, 18px

NOW (small section, optional)
  <p class="label">Currently</p>             ← mono, 14px, accent-emerald
  → React + Node.js loan-team lead at Qubika
  → Bachelor's in AI at UBP (2024-2027)

  → View work experience  →  /skills
  → View education  →  /education
  → Resume (PDF)  →  /assets/files/...

NavBar handles the rest.
```

### Concrete changes

- New `app/routes/_index.tsx` body matching the structure above. Drop
  the centered-vertically full-screen layout; left-align with comfortable
  page margin (max 720px column).
- New i18n keys: `HERO_NAME`, `HERO_ROLE`, `HERO_LEDE`, `NOW_LABEL`,
  `NOW_QUBIKA`, `NOW_BACHELORS`, `LINK_VIEW_WORK`, `LINK_VIEW_EDUCATION`,
  `LINK_RESUME`. Drop old `WELCOME_MY_NAME_IS`,
  `I_AM_A_SOFTWARE_ENGINEER`, `CHECK_THIS_PROJECT_REPO`, `REPO_GITHUB`,
  `DOWNLOAD_CV`.
- Drop `<DownloadButton>` from this route. Move the PDF link to the nav
  (Stage 26 work).
- Keep PDF prefetch in `links()` — visitor still likely to download it,
  just from the nav now.

### Risk

- The `/now` block goes stale fast. Decision: hand-edit when context
  changes (no automation, ~5 min per quarter).
- Removing the giant download button will surprise some recruiters who
  expect a PDF on the home page. The nav link makes it always-visible;
  we're not hiding it, just demoting it.

### Responsive notes

- Hero left-aligns at all viewports; body type stays at 16px (Stage 22
  fixed mobile font-size; preserve that).
- `/now` chip rows stack vertically on `<bp-md`; horizontal at `>=bp-md`.

---

## Page 2 — Skills (`/skills`) — Stage 28

### Current state

Three sections vertically stacked:

1. **Work Experience** — vertical timeline (`react-vertical-timeline-component`),
   newest-first since Stage 24. Each entry: company name + role + date +
   skill chips. Clickable into `/skills/:uuid`.
2. **Technologies** — auto-scrolling carousel of 26 tech logos + bar
   chart of skills-by-years (recharts).
3. **Extra Activities** — 3 cards (Endava / University / Qubika) each
   listing internal contributions.

Total years card sits between the timeline and the technologies section.

### Issues observed

1. **The auto-scrolling carousel is the strongest "junior" tell on the
   site.** Multiple research sources flag marquee skill rows as the
   most-cloned-and-mocked pattern of 2024-2025. **Cut it.**
2. **The bar chart is good** (uncommon, defensible, derived from real
   work-item data) but visually heavy; it dominates the section.
3. **The Total Years card** is buried mid-page. It's actually a strong
   credibility signal at 7y10m — should be promoted closer to the hero.
4. **Extra Activities reads as "stuff I did at jobs"** — overlaps
   conceptually with the timeline cards and is below-the-fold so most
   visitors never see it.
5. **Page has no <h1>** — Stage 17 added "Skills & Work Experience" as
   a page title, but it's the same level as the section h2s; visual
   hierarchy is flat.

### Target

```
HERO STRIP
  <h1>Work & Skills</h1>             ← display
  <p class="lede">7y 10m as a software engineer.
    Currently focused on React/Next.js + Python/Django.</p>     ← body, muted

WORK EXPERIENCE
  <h2>Work</h2>                      ← (drop the redundant "Experience" word)
  Filter input + Timeline (newest-first, unchanged)
  ↓
  Total years tile inline at the top of the timeline (was below)

TECHNOLOGIES
  <h2>Tech</h2>                      ← (drop the carousel entirely)
  Static categorized grid:
    Languages       JavaScript · TypeScript · Python · SQL · HTML · CSS
    Frameworks      React · Next.js · Remix · Django · Express
    Tooling         Storybook · Playwright · Cypress · Vite · GraphQL
    Infra           Cloudflare · AWS · Heroku · Docker · Git
    (Each row is a Geist Mono chip line, no logos)
  ↓
  BarChart (unchanged from Stage 18; top 12 default + Show all)

EXTRA ACTIVITIES
  Renamed "Beyond work" or "Side activities".
  Same 3-card layout but at h3, smaller cards.
  (Or: collapse to a single accordion if visual weight is still too high.)
```

### Concrete changes

- Drop the `Carousel` component from this route. Keep the component
  file (Storybook still references it; remove its import from
  `app/routes/skills._index/index.tsx` only).
- Move the Total Years card from below the timeline to a position
  inline with the section heading.
- Static tech grid replaces the carousel. New component:
  `app/components/TechGrid/`. Reads from a new `TECH_CATEGORIES`
  constant in `public/data/skills.json` (we'll restructure `SKILLS_IMG`).
- Adjust h1/h2 hierarchy as in the target sketch.
- Update `getSkillChartData` to maintain Stage 18's `Show N more` cap
  semantics — no change to chart logic.

### Detail page (`/skills/:uuid`)

Currently: title, big company logo, hire dates card, role/job description
card, projects, skills chips. Layout is a vertical stack with the logo
floating left of the cards on desktop.

**Issues:** the company logo is huge and below the title; on mobile it
squashes weirdly; the `LOGO_DIMS` map is hand-tuned per file and stale
(comment says "intrinsic dimensions" but values were tweaked).

**Target:** typographic header (no logo, or logo as small icon next to
title), inline metadata row (date · role · location if available),
description-first layout, skills chips grouped at the bottom.

```
<h1>Globant</h1>                     ← display
<p class="meta">
  <span>Aug 2018 – Dec 2020</span>
  <span class="separator">·</span>
  <span>Jr Web Developer</span>
  <span class="separator">·</span>
  <span>Buenos Aires, AR</span>      ← if location field added to JSON
</p>

<section class="description">...</section>

<section class="projects">
  <h2>Projects</h2>
  ...
</section>

<section class="skills">
  <h2>Tech used</h2>
  Chips, no Skills: prefix, no truncation.
</section>
```

Drop the `<img>` company-logo entirely or demote to a 32px favicon-style
mark next to the h1. The logo wasn't doing accessibility or SEO work and
the `LOGO_DIMS` maintenance has been painful.

### Risk

- **Visual weight loss when carousel is cut** — the tech section will
  feel emptier. The static grid + bar chart should fill it. If it
  doesn't, add a one-line summary above the grid ("X technologies in
  N projects across Y years") to anchor the section.
- **Removing the company logos** loses the "I worked at recognizable
  brands" visual signal. Mitigation: company name in 40px display
  type still reads as a strong header.

### Responsive notes

- **Bar chart** at iPad portrait (`bp-md`-ish): y-axis labels are
  currently squashed because the chart container goes full-width but
  recharts' `<YAxis width={100}>` is hardcoded. Bump label width or
  reduce label font-size at `<bp-lg`.
- **Static tech grid** (replacing carousel): single column at `<bp-md`,
  2 cols at `bp-md`, 4 cols at `bp-lg`+.
- **Timeline** is already responsive via the third-party component;
  verify alternating left/right behavior at `bp-lg` is intact.
- **Detail page (`/skills/:uuid`)** without the company logo simplifies
  responsive — currently the logo + cards side-by-side breaks below
  `bp-lg`; new typographic header doesn't have that issue.

---

## Page 3 — Education (`/education`) — Stage 29

### Current state

Two-section page:

1. **Degrees** — 2 cards in a flex row on desktop, side-by-side. Each
   card: title + date range + institution + summary + "Learn more →"
   CTA. Clickable into `/education/:slug`.
2. **Certifications** — 6 cards in a 3-column grid (Stage 19 hero/demote).
   Each card: institution-as-title + date + description + Certification
   Link.

Detail pages (`/education/:slug`) show: title h1, inline metadata row,
description card, skills chips. Layout is good (Stage 18+19 work).

### Issues observed

1. **The "Certification" card titles are still a bit dense.** Six 3-column
   cards on desktop make the section feel busy. The Udemy course names
   are long and wrap awkwardly.
2. **No visual differentiation between credential types.** University of
   Cambridge, EF SET English, and Udemy courses all render identically.
   The first two are legitimate institutional credentials; the Udemy
   ones are course completions. Worth signaling the distinction.
3. **The "Learn more →" CTA on the degree cards** is right but the
   detail page doesn't add a ton over what's already on the index — by
   design (Stage 18 made the detail page minimal). Worth confirming
   the value-add per click.

### Target

```
HERO STRIP
  <h1>Education</h1>                ← display
  <p class="lede">Bachelor's in AI at UBP (in progress);
    Software Development associate from UNSTA.</p>            ← body, muted

DEGREES
  <h2>Degrees</h2>
  2-column grid on desktop (current). Card style updated:
    border-color shift on hover (Stage 26 token change cascades)
    Geist Mono date range
    Geist Sans for title

CREDENTIALS
  <h2>Credentials</h2>              ← renamed from "Certifications"
  Categorized split:
    Universities & Standards
      → University of Cambridge — Level 1 Certificate / FCE (2007)
      → EF SET English — C2 Proficient (2022)
    Online courses
      → JavaScript: Understanding the Weird Parts (2021)
      → The Complete Web Developer (2018)
      → The Modern JavaScript Bootcamp (2018)
      → The Complete JavaScript Course (2018)
  Display as a tighter list, not cards. One row per credential.
  Each row: name + year right-aligned + small "↗" external link icon
  if URL is present.
```

The categorization adds context (institutional vs course) without
inflating visual weight. List form vs cards reduces the "competing for
attention" feel of 6 cert cards.

### Concrete changes

- New section heading: "Credentials" (rename from "Certifications").
  i18n keys: keep `CERTIFICATIONS` (still used for plural fallback),
  add `CREDENTIALS_INSTITUTIONAL`, `CREDENTIALS_COURSES`.
- Restructure `public/data/education.json`: add `category` field to
  each cert entry (`'institutional'` | `'course'`).
- New component: `app/components/CredentialList/`. Renders a flat list
  per category. No card chrome.

### Detail page (`/education/:slug`)

No structural changes. Token cascade from Stage 26 will update colors
and type. Single tweak: drop the "Description" card title — the
description is the only block of body content on the page; the card
header is redundant chrome. Render description as bare body text
under the metadata row.

### Risk

- **Removing card chrome from credentials** could read as less polished
  to a recruiter who expects "neat boxes." Mitigation: the list form
  is what every senior-engineer credential section uses (Lee Robinson,
  Brittany Chiang, etc.). Worth the bet.

### Responsive notes

- **Degree cards** stay 2-column at `bp-lg`+, 1-column below. Currently
  Stage 18's height-equalizing flex (`display: flex` on `card-link` +
  `height: 100%` on `card-wrapper`) survives the rewrite.
- **Credentials list** is naturally responsive — single column always,
  no breakpoint needed. The right-aligned year + external-link icon
  stays right-aligned at every viewport.
- **Detail page** (`/education/:slug`): description max-width was
  `min(75%, 65ch)` from Stage 17. Switch to a flat `max-width: 65ch`
  with side margin — cleaner across viewport sizes.

---

## Stage 30 — Cleanup & re-measure

After Stages 26-29 land:

1. **Regenerate visual baselines** for all 4 gated desktop routes
   (carousel-less /skills won't apply; home/skills-detail/
   education-index/education-detail will all move).
   1a. **Add mobile visual baselines** for the same 4 routes via the
   existing Playwright `mobile` project (Pixel 7). Mobile layout
   regressions are currently invisible to CI; Stage 26's responsive
   work makes this gap a real risk.
2. **Re-measure Lighthouse** via the Stage 21 workflow + capture a
   `*-post-revamp.summary.json` per route hand-authored for the
   stage-history record. Compare to current scores. Acceptable risk:
   perf may move ±5 points; a11y must stay 1.00 (we have token
   contrast budget); BP/SEO must stay 1.00.
3. **Update README.md** Features section with the revamp story (1-2
   bullets).
4. **Update AGENTS.md** §6 (Styling system) with new token names + the
   theme-toggle pattern.
5. **Update lighthouse/RESULTS.md** with a "Post-revamp" row capturing
   the perf delta vs Stage 13's last hand-authored snapshot.
6. **Drop dead i18n keys** that we removed: `WELCOME_MY_NAME_IS`,
   `I_AM_A_SOFTWARE_ENGINEER`, `CHECK_THIS_PROJECT_REPO`, `REPO_GITHUB`,
   `DOWNLOAD_CV`, `DISCLAIMER` (already gone), and any others surfaced
   by the per-page work.
7. **Regenerate og.png** via `npm run build:og` so the social-preview
   image picks up the new palette (`#10b981` emerald + Geist Sans
   instead of `#2ea043` + Roboto). Edit `scripts/og-image.svg` to
   swap font-family + accent gradient stops; commit the regenerated
   PNG. Content (name, role, skills row) stays as-is.
8. **Drop the Roboto font folder** under `public/fonts/roboto/` —
   Geist has been the only loaded face since Stage 26, fallback
   period is over.
9. **Drop the deprecated tokens** in `app/styles/constants.js`
   (`mobile-small`, `desktop-small`, `desktop-medium`, the old
   `default-black` / `success-green` etc. before they were renamed).

---

## Decisions made

These were open questions during plan review; locked here so future
sessions don't re-litigate.

- **Geist hosting:** self-host the variable WOFF2 under
  `public/fonts/geist/`. Mirrors the Roboto pattern; no `geist` npm
  package, no Vite-asset plumbing.
- **Light-theme accent:** `#059669` emerald-600. Continuity with the
  green identity from the favicon, og:image, and timeline icons. We
  considered Linear-violet for "design-engineer" register and rejected
  it — breaks brand continuity.
- **"Currently" block on home:** keep as proposed
  ("Senior Frontend at Qubika · Bachelor's in AI at UBP"). Hand-edit
  when context changes; revisit if it goes stale faster than expected.
- **og:image:** regenerate at Stage 30 cleanup with the new colors +
  Geist. Content (name, role, chip strip) stays unchanged unless we
  spot an improvement during the regen.
- **NavBar QR code:** stays. LinkedIn vanity URL is custom and stable;
  no regen risk.
- **Backup branch before Stage 26 merge:** Gonzalo will create
  `archive/pre-revamp` (or similar) off `main` capturing the current
  state, so a rollback path exists if any stage's outcome surprises.
  Not part of any PR — it's a one-off pre-flight ritual.
- **Scope:** ship all 5 stages (26 → 30), not just the highest-leverage
  subset. Full revamp committed.

---

## Risks

1. **Type fallback during font swap.** Adding a new font family means a
   FOUC window. Mitigation: Geist Sans variable WOFF2 is ~30 KB,
   `font-display: swap` keeps content visible. The existing Roboto
   preload pattern is already in place — replace the URL.
2. **Theme toggle SSR correctness.** Setting `data-theme` on `<html>`
   from the server requires reading `Sec-CH-Prefers-Color-Scheme` (only
   sent on a 2nd visit if `Accept-CH` was set on first). For 1st-visit
   we'll have a default (`dark`) and let the client correct. May cause
   a brief flash on first visit if the user's OS is in light mode. The
   alternative — a blocking inline `<script>` in `<head>` that reads
   localStorage before paint — is the more bullet-proof pattern. Pick
   the latter.
3. **Light theme contrast** on the existing green chart bars (recharts
   `<Cell fill="#colorhex">`). The 14-color palette in `BarChart/index.tsx`
   was tuned for dark mode. We may need a light-mode version of that
   palette. ~1 hour of work.
4. **Visual baselines.** Every PR will move at least one baseline. Stage
   21's auto-Lighthouse + Stage 16 visual-regression workflows need
   to keep passing through the migration. Plan: regen baselines as the
   final commit of each per-page PR before opening it.
5. **Accessibility.** The existing site is at a11y 1.00. The new color
   tokens need contrast verified before commit. Use the `npx pa11y`
   tool against `npm run dev` after Stage 26 lands.
6. **QR code stays.** LinkedIn vanity URL is custom-set and stable;
   no expiry concern. Verify it doesn't fight the new NavBar layout
   in Stage 26.

---

## What's NOT in this plan

For honesty:

- **No framework migration.** Stays on Remix 2.17. RR7 / Next.js
  upgrade is its own decision.
- **No new content.** Same data shape (`public/data/*.json`), same
  routes, same i18n message domain (just key churn).
- **No dependency upgrades.** No React 19, no ESLint 10. Those are
  separate held-major decisions.
- **No bento grid, no spotlight cursor, no terminal hero, no marquee
  skill row, no animated counters.** Research was unanimous that these
  are 2024-era tells.
- **No light-mode-by-default.** Dark stays as the default; light is the
  toggle option.
- **No new pages.** The plan stays inside the 5-route IA.

---

## Acceptance criteria

A successful revamp means:

- [ ] All 4 visual baselines regenerate cleanly with no follow-up tweaks.
- [ ] Lighthouse perf ≥ 0.90 on all 5 routes (current baseline).
- [ ] Lighthouse a11y = 1.00 on all 5 routes.
- [ ] Theme toggle works on every route, persists across navigation,
      no FOUC on reload.
- [ ] No regression in the e2e suite (currently 18 passing tests).
- [ ] Reduce-motion preference respected — no animation runs above
      0.01ms duration.
- [ ] At least one design-engineer-tier reference site (leerob.com /
      linear.app/method) feels like a "peer" rather than "aspirational."
