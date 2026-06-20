# Tech debt — observed during the visual-revamp pause

> Captured during the Stage 25-26 revamp investigation. The full
> revamp (`stage-26-revamp-foundation` branch) is parked, not merged.
> This document is the cheap, high-leverage subset of fixes
> identified along the way.
>
> Each item is independently shippable and reversible. Pick the
> ones worth doing; skip the rest. No stage promises a full revamp.
>
> **Parked branches** (do not delete):
>
> - `stage-25-revamp-plan` — the plan document.
> - `stage-26-revamp-foundation` — full token + theme + font swap.
> - `archive/pre-revamp` — backup of `main` before any revamp work.

## Status

**Phase:** triaged. Awaiting prioritization.

---

## Red-flag inventory

### #1 — No tablet breakpoint

**Severity:** high. Real-user impact.

`app/styles/constants.js` defines three breakpoints:

```js
'mobile-small': '496px',
'desktop-small': '1076px',
'desktop-medium': '1296px',
```

Everything from 497px to 1075px (iPad portrait at 768px, every Android
tablet, narrow laptop windows) renders with the same layout as a 320px
phone. The bar chart on `/skills` and the certifications grid on
`/education` both stretch awkwardly at iPad-portrait widths.

**Fix:** add a `$bp-md: 768px` token, audit each route's media queries
to break at it. Tailwind-aligned scale (`bp-sm: 640px`, `bp-md: 768px`,
`bp-lg: 1024px`, `bp-xl: 1280px`) is the safe default — anyone reading
the source recognizes the values.

**Effort:** ~half a day. Per-route, low risk.

---

### #2 — Token scales are improvised

**Severity:** medium. Slows down every CSS change.

Spacing tokens: `5, 10, 15, 16, 20, 30, 35, 40, 60, 70, 80, 200`. Both
15 AND 16 exist. No 25, no 50, no 100. Reads like tokens added one at
a time as needed.

Font sizes: `12, 14, 15, 16, 18, 20, 24, 32`. Same shape — gaps + a
duplicate-ish 14/15 pair.

When you add new layout, you guess which token is closest rather than
picking from a designed scale.

**Fix:** define a clean spacing scale (4-based: `4, 8, 12, 16, 24, 32,
48, 64, 96, 128`) and a clean type scale (1.25 ratio: `12, 14, 16, 20,
24, 30, 36, 48, 60`). Migrate references one route at a time. Rename
new tokens with a clear prefix (`$space-N` survives but new tokens
might be `$s-1, $s-2…` or kept numeric — pick a convention).

**Effort:** ~1-2 days, since it touches every CSS file. Lowest-risk
sequence: add new tokens, migrate one component per PR.

---

### #3 — Hover states don't work on touch

**Severity:** medium. A11y gap.

Card + link hovers across the app use bare `:hover`. Touch users get
no feedback when they tap a card before the navigation fires.

**Fix:** pair every `:hover` with `:focus-visible` and consider
`:active` for touch feedback. Examples:

- `app/routes/education._index/style.css` — `&__card-link:hover` (no
  focus pair).
- `app/components/Card/style.css` — `--styleless:hover` (no focus pair).
- `app/components/NavBar/style.css` — multiple `&:hover` blocks.

**Effort:** ~2 hours, mostly find-and-replace + visual verification.

---

### #4 — No light mode support

**Severity:** medium. Off-trend, OS-preference ignored.

The site is dark-only. Browsers / OSes that prefer light get dark
anyway. No way for a visitor to switch. By 2026 a theme toggle is
table-stakes for dev portfolios.

The full Stage 26 PR adds a working light/dark toggle but couples it
to the broader revamp. The toggle alone would be a small PR if
extracted: `<ThemeToggle>` component + FOUC-safe inline init script in
root.tsx + `[data-theme='light']` overrides for the 8-10 token values
that need flipping.

**Fix:** cherry-pick from `stage-26-revamp-foundation` if you decide
the visual revamp isn't happening soon. Otherwise wait for the full
revamp.

**Effort:** ~3-4 hours stand-alone (the parked branch already did it,
you'd extract the relevant commits).

---

### #5 — Auto-scrolling tech carousel reads "junior"

**Severity:** medium. Affects perceived seniority.

`/skills` has a horizontally-scrolling logo carousel of 26 tech logos.
Multiple research streams during Stage 25 flagged marquee skill rows
as one of the most cloned/mocked patterns in 2024-2025 dev portfolios
— "the AI-generated portfolio tell."

**Fix:** replace with a static categorized grid:

```
Languages       JavaScript · TypeScript · Python · SQL · HTML · CSS
Frameworks      React · Next.js · Remix · Django · Express
Tooling         Storybook · Playwright · Cypress · Vite · GraphQL
Infra           Cloudflare · AWS · Heroku · Docker · Git
```

**Effort:** ~3-4 hours. Needs a `TechGrid` component and a small
restructure of `SKILLS_IMG` in `public/data/skills.json` to add
category metadata.

---

### #6 — `LOGO_DIMS` map comment is stale

**Severity:** low. Maintenance friction.

`app/routes/skills.$uuid/index.tsx` has:

```ts
// Intrinsic dimensions for each company logo, fed to <img width> /
// <img height> to reserve layout space (fixes CLS). Captured from
// the source webp files; keep in sync if logos are replaced with
// different-sized variants.
const LOGO_DIMS: Record<string, { width: number; height: number }> = {
  'unsta2.webp': { width: 968, height: 400 },
  'globant.webp': { width: 3000, height: 200 },
  // ...
};
```

The comment says "intrinsic dimensions" but the values were hand-tweaked
in earlier stages — `globant.webp` real intrinsic is 3000×2000, not
3000×200 (15:1 vs 3:2 aspect ratio). The comment is now lying; whoever
edits next will misunderstand.

**Fix:** either (a) re-read intrinsic dimensions from the webp files
and put accurate values back (preserves CLS), or (b) update the comment
to say "intentionally narrowed to display the logo as a banner"
(documents what's actually true).

**Effort:** ~30 minutes. Trivial; just decide which way is right.

---

### #7 — Disabled stylelint rules masking simple-vars limitation

**Severity:** low. Not a bug, but worth knowing.

`.stylelintrc.json` disables three rules that caught false positives
when postcss-simple-vars `$tokens` mix with literals
(`padding: 0 $space-5`, `border: 1px solid $alternative-green`):

- `declaration-property-value-no-unknown`
- `shorthand-property-no-redundant-values`
- `color-function-alias-notation`

These are real CSS lint rules that work everywhere except this app's
PostCSS pipeline. A future move to native CSS custom properties
(`--space-5: 5px`) would let us re-enable them.

**Fix:** if/when the token scale gets reorganized (#2 above), do it
with native CSS custom properties instead of postcss-simple-vars.
Then re-enable the three stylelint rules.

**Effort:** ~couple of hours combined with #2.

---

### #8 — Tailwind installed but mostly unused

**Severity:** low. Dependency bloat.

`tailwind.config.ts` is set up. `corePlugins.preflight` is **disabled**.
Existing UI is pure BEM/PostCSS — Tailwind utility classes are barely
used anywhere.

The dependency adds ~50 KB to install size. Either commit to using it,
or drop it.

**Fix:** `npm un tailwindcss @tailwindcss/postcss`, delete
`tailwind.config.ts`, `app/styles/tailwind.css`, the `<link>` in
`root.tsx`. Or alternatively: convert one component to Tailwind
utilities as a proof-of-concept and decide based on the diff.

**Effort:** ~1 hour to remove cleanly.

---

### #9 — `react-router-dom` exact-pinned

**Severity:** low. Documented; just fragile.

`devDependencies` pins `react-router-dom: 6.30.4` (no caret) so it
matches whatever copy `@remix-run/react@2.17.5` ships internally. Two
copies of `react-router-dom` cause `useHref() may be used only in
the context of a <Router> component` errors in tests.

Documented in CLAUDE.md, but every Remix bump requires manual re-pinning.

**Fix:** when bumping Remix, run `npm ls react-router-dom`, find
Remix's nested version, update the dev-dep to match. No way to
automate inside this Remix major; React Router v7 (with Remix's RR7
adapter) would resolve it.

**Effort:** zero — it's just a process note. Already documented.

---

### #10 — No mobile visual baselines

**Severity:** low. Coverage gap.

Stage 16's visual regression suite gates 4 desktop baselines (Pixel
1280×720). The Playwright `mobile` project (Pixel 7, 412×915) runs
behavioural specs but has no screenshot baselines. Mobile layout
regressions slip through CI.

**Fix:** generate mobile baselines via the existing
`scripts/update-visual-baselines.sh` — needs a small spec change to
either run both projects in `visual.spec.ts` or add `--project=mobile`
to the regen script.

**Effort:** ~2 hours, mostly Docker time to generate the 4 PNGs.

---

## Priority ranking

If you ship in priority order:

| #                        | Why this order                                       |
| ------------------------ | ---------------------------------------------------- |
| #1 tablet breakpoint     | Real-user impact, every page benefits                |
| #3 touch-friendly hovers | A11y, fast                                           |
| #5 carousel → grid       | Perception, fast, removes the most-cited junior tell |
| #4 light mode            | OS-preference parity, table stakes in 2026           |
| #2 token scale           | Slowest but unlocks every future CSS change          |
| #6 logo dims comment     | 30 min, just do it next time you're in that file     |
| #10 mobile baselines     | Catches the regressions #1 might introduce           |
| #7 stylelint rules       | Pair with #2                                         |
| #8 Tailwind              | Decide-or-drop                                       |
| #9 React Router pin      | Already documented; do nothing                       |

## What's NOT in scope

- Full visual revamp. The plan + Stage 26 PR exist on parked branches
  if/when you decide the design itself needs refreshing.
- IA changes. Multi-route stays.
- Component rewrites. Card / Timeline / BarChart / Carousel keep their
  current shape; the carousel might get _replaced_ (#5), but the rest
  evolve in place.
- New features. No /uses, no /now, no contact form, no blog.

## Acceptance for "this todo list is complete"

- [ ] Tablet layouts work at 768px (manual check on `/skills`,
      `/education`, `/skills/:uuid`).
- [ ] Every clickable card/link has `:hover` + `:focus-visible` + visual
      feedback on touch.
- [ ] Theme toggle ships and OS-preference is respected by default.
- [ ] `/skills` carousel replaced with categorized grid.
- [ ] Spacing + type tokens reorganized into a clean scale (or decision
      made to defer).
- [ ] Mobile visual baselines committed.
