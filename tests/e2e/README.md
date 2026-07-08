# Playwright E2E + visual-regression

## Specs

- `home.spec.ts`, `skills.spec.ts`, `education.spec.ts`, `navbar.spec.ts`, `projects.spec.ts`, `contact.spec.ts`, `error.spec.ts`, `a11y.spec.ts` — behavioural + a11y specs (route loaders, navigation, content assertions, form submission, axe violations).
- `visual.spec.ts` — full-page screenshot diffs. Covers `/`, `/education`, `/education/:slug`, `/skills/1` (a stable detail page), and `/contact`. The `/skills` index is intentionally excluded — see "Why `/skills` index isn't gated" below.

## Visual regression

Baselines live at `tests/e2e/visual.spec.ts-snapshots/<name>-<project>-linux.png`. Both `chromium` (Desktop Chrome) and `mobile` (Pixel 7) projects are gated, so layout regressions that only show up below `$bp-md` are caught at the same line as desktop ones.

They're committed for **linux only**. On macOS the visual spec auto-skips itself (`SKIP_VISUAL` in `visual.spec.ts`), so `npm run test:e2e` on a Mac runs the behavioural specs only and stays green. On Ubuntu (CI) the spec runs and diffs against the committed baselines.

### Why linux-only baselines

Playwright screenshots are pixel-level. Fonts, sub-pixel anti-aliasing, and emoji rendering differ enough between macOS and Ubuntu that a Mac-generated baseline diffs hard against the same page rendered in CI. Committing both per-platform PNGs would double the snapshot footprint and the macOS set wouldn't gate anything (CI is the only place that runs the assertions).

### Determinism

`visual.spec.ts` sets up four guards before snapshotting:

1. **`page.clock.install()`** pins "now" to a fixed ISO timestamp. The /skills "Total years of experience" card and any work-item with `endDate: null` both read `new Date()`; without freezing, the rendered text drifts every day.
2. **Animations + transitions disabled** via an `addInitScript` that injects a global stylesheet. Theme-toggle slides, entrance fades, and the `react-vertical-timeline-component` intersection animation would all otherwise produce different pixels on every run.
3. **Fonts ready** — `await document.fonts.ready` before capturing. Roboto loads from `/fonts/roboto/`; without this guard the first screenshot can land while the system fallback is still rendering.
4. **`networkidle` + 200 ms settle** for lazy chunks (TenureHeatmap, TechTree, Timeline) to land and lay out.

The QR `<svg>` in the nav is masked because its embedded font data hits the SVG anti-aliasing pipeline and produces sub-pixel diffs across environments. (No-op on mobile where the QR is `display: none`.)

### Why `/skills` index isn't gated

`/skills` is the only route still excluded. The tenure-heatmap renders ~30 SVG cells × ~10 years on a tight grid; sub-pixel anti-aliasing on those cells drifts ~0.4% of pixels between regen environments (Apple Silicon under amd64 emulation vs CI's GitHub Actions runner) — invisible to the eye but consistently above the 0.2% diff budget. Masking the chart would leave the gate covering very little of the page.

This is a tool-agnostic limitation: Percy / Chromatic pixel-diff SVG the same way. **T11 was closed with this rationale, not "switch to a paid tool".** Behavioural coverage in `skills.spec.ts` keeps the route asserted at the loader + interaction level.

`/skills/:uuid` (detail) and `/education` (index) were previously excluded too, because of a local-Docker `useLocation()` hydration race that captured a root-error-boundary screenshot instead of the page. **T7's CI-side regen workflow runs Playwright in the actual CI container where the race doesn't fire**, so both routes are gated again as of this revision. To regenerate their baselines after an intentional UI change, use Path 2 below (CI workflow).

## Updating baselines

Two paths — pick based on whether you hit the hydration race.

### Path 1: local Docker regen (fast)

```sh
npm run test:visual:update
```

Runs Playwright inside the official `mcr.microsoft.com/playwright:v<version>-jammy` Docker image so the resulting PNGs match what CI will produce. Required setup:

- **Docker Desktop** (or Colima) running on the host.
- The image tag automatically tracks the local `@playwright/test` version, so a Playwright bump produces matching baselines on the next regen.

After it finishes, review the regenerated PNGs under `tests/e2e/visual.spec.ts-snapshots/` and commit them.

### Path 2: CI workflow (recommended)

Runs Playwright inside the actual CI container, sidestepping a local Docker `useLocation()` hydration race that affects `/skills/:uuid` and `/education` regen. Also the only path that doesn't need Docker Desktop on your machine. Use it as the default:

```sh
gh workflow run regen-baselines.yml --ref <branch-name>
```

Or click **Run workflow** on the [Actions tab](.github/workflows/regen-baselines.yml). The workflow runs inside the exact CI environment that gates PRs — the hydration race only reproduces in the local Docker container, not on the GitHub runner, so the captured PNGs are clean. It commits the regen back to the dispatched branch automatically.

The `project` input lets you scope to `chromium`, `mobile`, or `both` (default).

## Running the suite

| Command                                  | What runs                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run test:e2e`                       | All specs, both projects (chromium + mobile). On Mac the visual spec self-skips.  |
| `npm run test:e2e -- --project=chromium` | Behavioural + visual specs, desktop only.                                         |
| `npm run test:visual`                    | Only `visual.spec.ts`, both projects. Self-skips on Mac.                          |
| `npm run test:visual:update`             | Regenerate baselines via Docker, both projects. Use after intentional UI changes. |

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
