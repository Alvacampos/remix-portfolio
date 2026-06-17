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

| Run                          | FCP         | LCP         | SI      | benchmarkIndex  |
| ---------------------------- | ----------- | ----------- | ------- | --------------- |
| pre-Stage-6 (after Stage 5)  | 1.6 s       | 2.6 s       | 1.9 s   | 3175.5          |
| post-Stage-7 (after Stage 7) | 1.2 s       | 2.2 s       | 2.4 s   | 3180            |
| **Δ**                        | **−437 ms** | **−437 ms** | +482 ms | ~0 (env stable) |

Lighthouse score breakdown:

| Run          | FCP score | LCP score | SI score |
| ------------ | --------- | --------- | -------- |
| pre-Stage-6  | 0.94      | 0.86      | 1.00     |
| post-Stage-7 | 0.99      | 0.94      | 0.98     |

## What moved the numbers

**Stage 6** (merged between the two runs):

- Code-split BarChart, Carousel, and Timeline on `/skills` via the
  manual CSS-preload pattern. Recharts (~333 KB JS) and the 25
  carousel SVG icons left the eager bundle.
- Removed 7 unused design tokens.
- Polished timeline icon/date alignment.

**Stage 7** (also between the two runs):

- Replaced the loaders' `fetch(new URL('/data/*.json', request.url))`
  with a direct server-side `import`. Removed one HTTP round-trip
  from every uncached `/skills` and `/skills/:uuid` request.

## Reading the deltas

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

## Next thing to measure

After future stages that visibly change `/skills`, re-run Lighthouse
and add a new row to the table above. If the change is route-specific
(`/`, `/education`), capture and compare per-route runs separately.
