# Playwright E2E + visual-regression

## Specs

- `home.spec.ts`, `skills.spec.ts`, `education.spec.ts`, `navbar.spec.ts` — behavioural specs (route loaders, navigation, content assertions).
- `visual.spec.ts` — full-page screenshot diffs. Covers `/`, `/skills/:uuid`, `/education`, `/education/:slug`. The `/skills` index route is intentionally excluded — see "Why /skills isn't gated" below.

## Visual regression

Baselines live at `tests/e2e/visual.spec.ts-snapshots/<name>-chromium-linux.png`.

They're committed for **linux only**. On macOS the visual spec auto-skips itself (`SKIP_VISUAL` in `visual.spec.ts`), so `npm run test:e2e` on a Mac runs the behavioural specs only and stays green. On Ubuntu (CI) the spec runs and diffs against the committed baselines.

### Why linux-only baselines

Playwright screenshots are pixel-level. Fonts, sub-pixel anti-aliasing, and emoji rendering differ enough between macOS and Ubuntu that a Mac-generated baseline diffs hard against the same page rendered in CI. Committing both per-platform PNGs would double the snapshot footprint and the macOS set wouldn't gate anything (CI is the only place that runs the assertions).

### Determinism

`visual.spec.ts` sets up four guards before snapshotting:

1. **`page.clock.install()`** pins "now" to a fixed ISO timestamp. The /skills "Total years of experience" card and any work-item with `endDate: null` both read `new Date()`; without freezing, the rendered text drifts every day.
2. **Animations + transitions disabled** via an `addInitScript` that injects a global stylesheet. Recharts entrance tweens, the carousel auto-advance, the Front End / Back End neon-loop, and the `react-vertical-timeline-component` intersection animation would all otherwise produce different pixels on every run.
3. **Fonts ready** — `await document.fonts.ready` before capturing. Roboto loads from `/fonts/roboto/`; without this guard the first screenshot can land while the system fallback is still rendering.
4. **`networkidle` + 200 ms settle** for lazy chunks (BarChart, Carousel, Timeline) to land and lay out.

The QR `<svg>` in the nav is masked because its embedded font data hits the same SVG anti-aliasing pipeline as recharts and produces sub-pixel diffs across environments.

### Why /skills isn't gated

Recharts emits SVG `<text>` for axis labels. Sub-pixel font hinting on those labels drifts ~0.4% of pixels between the local Docker regen environment (M-series Mac under amd64 emulation) and CI's GitHub Actions runner — invisible to the eye but consistently above the 0.2% diff budget. The carousel SVG icons hit the same pipeline. Masking both the chart and the icon strip would leave the gate covering very little of the page, so we don't include `/skills` in the visual suite. The route is still covered by the behavioural specs in `skills.spec.ts` (timeline rendering, autocomplete filter, FE/BE button toggle, chart container present, extra activities). If a future stage moves to a screenshot tool that handles SVG better (Percy, Chromatic), the route can be re-added.

## Updating baselines

When a UI change is intentional, regenerate the baseline:

```sh
npm run test:visual:update
```

This runs Playwright inside the official `mcr.microsoft.com/playwright:v<version>-jammy` Docker image so the resulting PNGs match what CI will produce. Required setup:

- **Docker Desktop** (or Colima) running on the host.
- The image tag automatically tracks the local `@playwright/test` version, so a Playwright bump produces matching baselines on the next regen.

After it finishes, review the regenerated PNGs under `tests/e2e/visual.spec.ts-snapshots/` and commit them.

## Running the suite

| Command                                  | What runs                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| `npm run test:e2e`                       | All specs, both projects (chromium + mobile). On Mac the visual spec self-skips. |
| `npm run test:e2e -- --project=chromium` | Behavioural + visual specs, desktop only.                                        |
| `npm run test:visual`                    | Only `visual.spec.ts`, chromium only. Self-skips on Mac.                         |
| `npm run test:visual:update`             | Regenerate baselines via Docker. Use after intentional UI changes.               |

## Tolerances

`playwright.config.ts → expect.toHaveScreenshot`:

- `threshold: 0.2` — per-pixel color delta (covers anti-aliasing / sub-pixel jitter).
- `maxDiffPixelRatio: 0.002` (set per-call in `visual.spec.ts`) — overall fraction of pixels allowed to differ. 0.2% is the standard "barely perceptible" tolerance.

If a real UI change produces a ratio under that threshold and you want it captured, regenerate the baseline.

## Adding a route

1. Add `{ name: '<slug>', path: '<url>' }` to `ROUTES` in `visual.spec.ts`.
2. Run `npm run test:visual:update` to capture the baseline.
3. Commit the new PNG.

## Troubleshooting

- **CI failure shows a diff that looks identical:** It's almost always font rendering. Bump `threshold` slightly (0.2 → 0.3) or regenerate baselines from the latest Docker image (Playwright sometimes ships a base-image refresh that nudges anti-aliasing).
- **Locally the spec is "skipped":** Expected on macOS. To run anyway, `UPDATE_VISUAL=1 npm run test:e2e -- --project=chromium` will execute the spec, but it'll diff against linux baselines and almost certainly fail — only useful for `--update-snapshots` runs (which the Docker script does for you).
- **Diff PNGs in CI artifacts:** When the visual job fails, Playwright drops `<name>-actual.png` + `<name>-diff.png` in `test-results/`, which the workflow uploads. Inspect those before deciding to regen.
