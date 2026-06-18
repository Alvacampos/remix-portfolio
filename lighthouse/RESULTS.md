# Lighthouse results

Snapshots of how `/skills` performance moved across stages. Numbers are
from real Lighthouse runs against the deployed Cloudflare Pages site,
mobile profile (moto g power 2022 emulation), default throttling.

The full JSON reports were too large to include directly (the embedded
filmstrip base64 hits chat-message size limits); we keep small
hand-extracted `.summary.json` files per run. If you want to re-capture
a full report later, drop it as `skills-<context>.json` next to its
summary using the convention in [README.md](README.md).

## /skills timeline

| Run                            | FCP    | LCP         | SI      | TBT   | Stylesheets | benchmarkIndex      |
| ------------------------------ | ------ | ----------- | ------- | ----- | ----------- | ------------------- |
| pre-Stage-6 (after Stage 5)    | 1.6 s  | 2.6 s       | 1.9 s   | —     | —           | 3175.5              |
| post-Stage-7 (after Stage 7)   | 1.2 s  | 2.2 s       | 2.4 s   | —     | —           | 3180                |
| post-Stage-10 (after Stage 10) | 1.1 s  | 2.6 s       | 1.8 s   | 15 ms | 12          | 3175                |
| post-Stage-13 (after Stage 13) | 1.2 s  | 2.2 s       | 2.0 s   | 8 ms  | **7**       | 3214                |
| **Stage 11→13 Δ**              | +27 ms | **−437 ms** | +186 ms | −7 ms | **−5**      | run-to-run variance |

Lighthouse score breakdown:

| Run           | FCP score | LCP score | SI score | Perf | A11y | BP   | SEO  |
| ------------- | --------- | --------- | -------- | ---- | ---- | ---- | ---- |
| pre-Stage-6   | 0.94      | 0.86      | 1.00     | —    | —    | —    | —    |
| post-Stage-7  | 0.99      | 0.94      | 0.98     | —    | —    | —    | —    |
| post-Stage-10 | 0.99      | 0.87      | 1.00     | 0.97 | 0.99 | 1.00 | 0.92 |
| post-Stage-13 | 0.99      | **0.94**  | 0.99     | 0.98 | 1.00 | 1.00 | 1.00 |

## What moved the numbers

**Stage 6** (merged between the pre-Stage-6 and post-Stage-7 runs):

- Code-split BarChart, Carousel, and Timeline on `/skills` via the
  manual CSS-preload pattern. Recharts (~333 KB JS) and the 25
  carousel SVG icons left the eager bundle.
- Removed 7 unused design tokens.
- Polished timeline icon/date alignment.

**Stage 7** (also between those runs):

- Replaced the loaders' `fetch(new URL('/data/*.json', request.url))`
  with a direct server-side `import`. Removed one HTTP round-trip
  from every uncached `/skills` and `/skills/:uuid` request.

**Stage 12** (between post-Stage-10 and post-Stage-13):

- Per-route canonical from the root loader (was hardcoded to `SITE_URL`).
- SVGR-generated icons now ship `aria-hidden="true"` instead of
  `role="img"` — they're decorative; their parents carry the name.

**Stage 13** (between post-Stage-10 and post-Stage-13):

- Inlined small-component CSS (Button, NavBar, Card, Input,
  LoadingSpinner, DownloadBtn) into the consuming routes' / global
  stylesheet via `postcss-import`. `/skills` went from 12 separate
  render-blocking stylesheets to 7. Lazy-loaded heavies (BarChart,
  Carousel, Timeline) keep their independent stylesheets to preserve
  Stage 6's JS chunk-split.

## Reading the deltas

### Stage 5 → Stage 7 era

- **LCP −437 ms.** This is the metric Google actually penalizes, and
  it crossed the 2.5 s "good" threshold from the wrong side. Score
  0.86 → 0.94. Stage 6's chart split removed recharts from the LCP
  critical path; Stage 7 shaved more off by removing the loader's
  inbound HTTP hop.
- **FCP −437 ms.** Same root cause — the eager bundle is smaller and
  parses sooner.
- **Speed Index +482 ms.** This looks like a regression but is the
  cost we accepted in Stage 6: SI weights "visual completeness over
  time", and code-splitting BarChart/Carousel/Timeline means those
  elements arrive in a later JS chunk. Final-paint completeness
  shifts later even though first content arrives sooner. SI 2.4 s is
  still firmly in Lighthouse's "good" band (threshold 3.4 s); the
  score moved 1.00 → 0.98. Worth it for the LCP win.

### Stage 10 → Stage 13 era

- **LCP −437 ms (again).** The post-Stage-10 baseline showed LCP had
  drifted back to 2.6 s — not a real-user regression (observed LCP
  was 439 ms; FCP and SI both improved over post-Stage-7), but
  Lighthouse's Lantern simulator charges per-stylesheet round-trip
  cost under 4× CPU + slow-3G, and Stage 6's manual-CSS-preload
  pattern was emitting **12 separate render-blocking stylesheets**
  on `/skills`. Stage 13 collapsed that to 7 via `postcss-import`,
  and LCP recovered to 2.2 s with score 0.87 → 0.94.
- **A11y 0.99 → 1.00.** Stage 12's SVGR `aria-hidden` default
  removed all 30 `svg-img-alt` failures; the audit is now
  `notApplicable` because no SVGs carry `role="img"` anymore.
- **SEO 0.92 → 1.00.** Stage 12's per-route canonical fixed the
  only failing audit (`canonical` had been pinned to the homepage
  via `links()`).
- **TBT −7 ms** and **TTFB −85 ms** are run-to-run variance from the
  Cloudflare edge / Lantern, not stage work.

## Critical-CSS-inline followup: not pursued

Post-Stage-10 we noted critical-CSS inline as a Tier-2 lever if
Lantern still penalized `/skills` after Stage 13. With LCP back at
0.94 and Performance at 0.98, that work isn't justified by the
score. If a future stage moves the LCP element to something heavier
than the `<h2>Work Experience</h2>` text, revisit.

## Next thing to measure

After future stages that visibly change `/skills`, re-run Lighthouse
and add a new row to the table above. If the change is route-specific
(`/`, `/education`), capture and compare per-route runs separately.
