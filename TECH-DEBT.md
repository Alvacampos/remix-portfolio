# Tech debt + design refresh

> Captured during the Stage 25-26 revamp investigation, then refined
> in conversation. The full revamp (Stage 26 parked branch) was
> abandoned — too prescriptive, didn't feel like _this_ portfolio.
> What's documented here instead is a **design refresh of the
> existing site**: keep the layout, keep the routing, keep the
> personality. Improve what's actually wrong.
>
> Each section is independently shippable and reversible. Items get
> ticked off as PRs land.
>
> **Parked branches** (preserved as historical reference, do not delete):
>
> - `stage-25-revamp-plan` — the prescriptive revamp plan we walked away from.
> - `stage-26-revamp-foundation` — partial implementation of the parked plan.
> - `archive/pre-revamp` — backup of `main` before any revamp work.

## Status

| #   | Item                                                              | Status                                    |
| --- | ----------------------------------------------------------------- | ----------------------------------------- |
| 1   | Tablet breakpoint                                                 | ✅ shipped (`stage-27-tablet-breakpoint`) |
| 3   | Touch / keyboard-friendly hovers                                  | ✅ shipped (`stage-28-touch-hovers`)      |
| ⭐  | **Design refresh: GitHub palette + theme toggle + drop carousel** | 🔜 next                                   |
| ⭐  | **Tenure heatmap chart**                                          | 🔜 after the design refresh               |
| 2   | Token scale reorganization                                        | unchanged                                 |
| 6   | LOGO_DIMS comment                                                 | unchanged                                 |
| 10  | Mobile visual baselines                                           | unchanged                                 |
| 7   | Stylelint rules                                                   | unchanged                                 |
| 8   | Drop unused Tailwind                                              | unchanged                                 |
| 9   | React Router pin                                                  | documented; no action                     |

The two ⭐ items are the new direction — promoted from the original
"item #5 carousel → grid" + "item #4 light mode" + the chart change.
They form one coherent design refresh; not "tech debt" in the strict
sense, but on the path to a better-looking _own_ design.

---

## ⭐ Design refresh — GitHub palette + theme toggle + drop carousel

**Goal:** the site already has a GitHub-inspired aesthetic. Lean
into it instead of fighting it. Adopt GitHub's actual brand palette
(both modes), wire a real light/dark toggle, drop the auto-scrolling
tech carousel that reads "junior portfolio" in 2026.

### What changes

**Color system — adopt GitHub's actual brand palette.** Six grays + six
greens, sourced from GitHub's published brand guidelines:

```js
// Grays (cool neutral)
'gray-1':  '#F2F5F3',  // lightest — page background (light mode)
'gray-2':  '#E4EBE6',  // surface (light mode)
'gray-3':  '#B6BFB8',  // muted text (light mode)
'gray-4':  '#909692',  // body text muted
'gray-5':  '#232925',  // surface (dark mode)
'gray-6':  '#101411',  // process black — page background (dark mode)

// Greens
'green-1': '#BFFFD1',  // lightest — light-mode accent backgrounds
'green-2': '#8CF2A6',
'green-3': '#5FED83',
'green-4': '#0FBF3E',  // GitHub Green — hero / accent
'green-5': '#08827B',  // teal-tinted deep
'green-6': '#0A241B',  // darkest — dark-mode accent backgrounds
```

GitHub's published 80/10/10 ratio (neutral / gray / green) becomes
the design discipline for new component work: most surfaces neutral,
sparingly green.

**Theme toggle** — light + dark + system. Toggle button placed in the
NavBar above the Home link, between the social-icons divider and the
main nav. FOUC-safe: an inline `<script>` in `<head>` reads
`localStorage.theme` (or `prefers-color-scheme`) and sets
`<html data-theme>` _before paint_, so no flash of wrong theme on
reload.

**Drop the auto-scrolling tech carousel.** Replace with a static
categorized chip grid:

```
Languages    JavaScript · TypeScript · Python · SQL · HTML · CSS
Frameworks   React · Next.js · Remix · Django · Express
Tooling      Storybook · Playwright · Cypress · Vite · GraphQL
Infra        Cloudflare · AWS · Heroku · Docker · Git
```

No logos, no animation. Scannable, indexable, no tutorial-clone tell.

### Why

- Marquee skill rows / auto-scroll logos peaked 2024 and now read
  template-y across multiple research streams.
- Light mode is table-stakes in 2026; OS-preference parity matters.
- GitHub's published palette is the natural fit for a site that's
  always been GitHub-dark-inspired; adopting it cleanly (instead of
  approximating with zinc + emerald like Stage 26 tried) keeps the
  site's identity and gets the precision.
- Theme toggle above the Home link (your placement preference) makes
  it the first interactive nav element — cleaner than the
  utility-row tucked under the buttons.

### Out of scope for this PR

- Chart change. Stays in its own PR (next ⭐ item).
- Touch up of every existing component to match the 80/10/10 ratio —
  done gradually as components get touched.

---

## ⭐ Tenure heatmap chart

**Goal:** replace the recharts horizontal bar chart with a "tenure
heatmap" matching the GitHub-contribution-graph aesthetic the site
is leaning into.

### Shape

Rows = skills, columns = years (2018→present). Each cell colored
green if that skill was used that year, intensity scaling with how
heavily it was used (multiple concurrent jobs using the skill in a
year = darker green).

The data is already there: `WORK_ITEMS[].skills[].start/end` encodes
per-skill date ranges. The new chart consumes the same source as the
current bar chart; nothing in `public/data/skills.json` changes.

### Visual reference

GitHub's contribution graph (the one on every dev's profile). 5 tones
of green over a gray base, square cells, year columns labelled at the
top. Recognizable, on-brand, dense without being noisy.

### Why

- The current bar chart's "X years" axis is ambiguous — total years
  doesn't tell you _when_ you used the skill.
- A heatmap shows _both_ duration and recency. A skill used heavily
  2018-2020 looks different from one used continuously 2018-present.
- Aesthetic match with the GitHub palette work above; the two
  changes reinforce each other.

### Risk

- Custom chart — can't lean on recharts' defaults. ~1 day of careful
  layout work, plus light/dark color logic, plus a11y attention
  (cells need labels for screen readers, tooltips for sighted users).
- Trade-off: precision drops. The bar chart said "7 years 10 months";
  the heatmap says "used heavily across 8 calendar years." Different
  signal. Better in context, but worth knowing it's different.

### Out of scope for this PR

- Tooltips beyond a basic title attribute. Polish later if needed.
- Animation on hover. Skip; reads designer-cosplay on a CV.

---

## Other items (unchanged)

### #2 — Token scales are improvised

**Severity:** medium. Slows down every CSS change.

Spacing tokens: `5, 10, 15, 16, 20, 30, 35, 40, 60, 70, 80, 200`. Both
15 AND 16 exist. No 25, no 50, no 100. Reads like tokens added one at
a time as needed.

**Fix:** define a clean spacing scale (4-based: `4, 8, 12, 16, 24, 32,
48, 64, 96, 128`) and a clean type scale (1.25 ratio: `12, 14, 16, 20,
24, 30, 36, 48, 60`). Migrate references one route at a time.

**Effort:** ~1-2 days, since it touches every CSS file.

### #6 — `LOGO_DIMS` map comment is stale

**Severity:** low. Maintenance friction.

`app/routes/skills.$uuid/index.tsx` has a `LOGO_DIMS` const whose
comment claims "intrinsic webp dimensions" but values were
hand-tweaked in earlier stages. Comment lies; future editor will
misunderstand.

**Fix:** update the comment to say "intentionally narrowed to display
the logo as a banner" — that's what's actually true.

**Effort:** 30 min.

### #7 — Disabled stylelint rules masking simple-vars limitation

**Severity:** low.

`.stylelintrc.json` disables three rules that caught false positives
when postcss-simple-vars `$tokens` mix with literals. Real CSS lint
rules that work everywhere except this app's PostCSS pipeline. A
move to native CSS custom properties would let us re-enable them.

**Fix:** combine with #2.

**Effort:** ~couple of hours pairing with #2.

### #8 — Tailwind installed but mostly unused

**Severity:** low. Dependency bloat.

`tailwind.config.ts` set up. `corePlugins.preflight` disabled.
Existing UI is pure BEM/PostCSS. ~50 KB dep for almost zero usage.

**Fix:** `npm un tailwindcss @tailwindcss/postcss`, delete config +
stylesheet + the `<link>` in `root.tsx`.

**Effort:** ~1 hour.

### #9 — `react-router-dom` exact-pinned

**Severity:** low. Documented; just fragile.

Already in CLAUDE.md. Each Remix bump requires manual re-pin. RR7
adapter would resolve it. No action needed today.

### #10 — No mobile visual baselines

**Severity:** low. Coverage gap.

Stage 16's visual regression suite gates 4 desktop baselines only.
Mobile layout regressions slip through CI.

**Fix:** add 4 mobile baselines via the existing Docker regen script.

**Effort:** ~2 hours.

---

## Sequencing

The ⭐ design refresh + the tenure heatmap belong together
conceptually but ship as **two separate PRs** because:

1. The design refresh (palette + toggle + carousel cut) touches
   tokens, NavBar, root layout, every route's color references.
   It's already a meaty PR.
2. The tenure heatmap is a new component with its own surface area
   (component file, stories, tests, light/dark color logic).
3. Shipping them separately means the palette work is reviewable in
   isolation, and the chart change can be evaluated against the new
   palette without confounding factors.

After both ship, items #2 (token cleanup), #6 (logo comment), #7
(stylelint rules), and #10 (mobile baselines) are each ~1-day or
smaller. Pick them off in any order.

#8 (Tailwind drop) and #9 (RR pin) require a decision more than
work — defer until you actually decide.
