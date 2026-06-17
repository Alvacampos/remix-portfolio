# Lighthouse runs

Hand-saved Lighthouse JSON exports for tracking perf changes across stages.
This is a poor-person's Lighthouse-CI — no automation, just timestamped
artifacts that diff cleanly when one stage moves a metric.

## Convention

```text
<route>-<context>.json
```

- `route`: the slug from the audited URL — `home` for `/`, `skills` for
  `/skills`, `education` for `/education`, etc.
- `context`: what state of the app this run captured. Use the stage
  number that just merged (`pre-stage-6`, `post-stage-6`, …) or a
  short descriptor (`baseline`, `react-19-trial`).

Examples:

```text
skills-pre-stage-6.json
skills-post-stage-6.json
home-post-stage-6.json
```

## How to capture a run

Run Lighthouse against the deployed site (the production Cloudflare URL
is what real users hit; localhost reads are misleading because Vite dev
ships unminified code and runs on a different machine class).

Browser:

1. Open the route in Chrome incognito.
2. DevTools → Lighthouse → Mobile, Performance + Accessibility + SEO.
3. Click "Analyze page load."
4. Click the gear icon in the report → "Save as JSON."

CLI alternative (if you have `lighthouse` installed):

```sh
npx lighthouse https://gonzalo-alvarez-campos-cv.com/skills \
  --output=json \
  --output-path=lighthouse/skills-post-stage-N.json \
  --form-factor=mobile \
  --throttling-method=simulate
```

## What to compare

Diff the metric block between runs. The fields that matter:

| Field path                                        | What it means           | Threshold    |
| ------------------------------------------------- | ----------------------- | ------------ |
| `audits["first-contentful-paint"].numericValue`   | FCP (ms)                | <1800 = good |
| `audits["largest-contentful-paint"].numericValue` | LCP (ms)                | <2500 = good |
| `audits["speed-index"].numericValue`              | Speed Index (ms)        | <3387 = good |
| `audits["total-blocking-time"].numericValue`      | TBT (ms)                | <200 = good  |
| `audits["cumulative-layout-shift"].numericValue`  | CLS (unitless)          | <0.1 = good  |
| `categories.performance.score`                    | Overall perf score, 0–1 | ≥0.9 = green |

Quick diff with `jq`:

```sh
jq '{
  fcp: .audits["first-contentful-paint"].displayValue,
  lcp: .audits["largest-contentful-paint"].displayValue,
  si:  .audits["speed-index"].displayValue,
  tbt: .audits["total-blocking-time"].displayValue,
  cls: .audits["cumulative-layout-shift"].displayValue,
  perf: .categories.performance.score,
}' lighthouse/skills-pre-stage-6.json
```

## Existing runs (summary)

Captured manually before saving the full JSON; numbers are from the
metrics block of the report. If a row says "—" the JSON file isn't
saved yet.

| File                      | Route     | Stage at run time             | FCP   | LCP   | SI    | Perf score        |
| ------------------------- | --------- | ----------------------------- | ----- | ----- | ----- | ----------------- |
| `skills-pre-stage-6.json` | `/skills` | After Stage 5, before Stage 6 | 1.6 s | 2.6 s | 1.9 s | (paste from JSON) |

Notes:

- Pre-Stage-6 `/skills` is on the bubble for LCP (2.6 s vs the 2.5 s
  "good" threshold). The JS code-split that landed in Stage 6 should
  pull recharts out of the LCP critical path.
- Speed Index 1.9 s with score 1.0 is excellent and reflects how the
  filmstrip looks (real content visible by frame 4 ≈ 1.5 s).
- Re-run `/skills` and `/` after Stage 6 deploys to capture the delta.
