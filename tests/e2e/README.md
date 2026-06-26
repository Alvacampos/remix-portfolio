# Playwright E2E + visual-regression

## Specs

- `home.spec.ts`, `skills.spec.ts`, `education.spec.ts`, `navbar.spec.ts` — behavioural specs (route loaders, navigation, content assertions).
- `visual.spec.ts` — full-page screenshot diffs. Covers `/` and `/education/:slug`. The `/skills` index, `/skills/:uuid`, and `/education` index routes are intentionally excluded — see "Why some routes aren't gated" below.

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

### Why some routes aren't gated

Three routes are excluded for two different reasons:

**`/skills` (index)** — the tenure-heatmap renders a tight grid of small SVG cells; sub-pixel rendering on those cells drifts ~0.4% of pixels between the local Docker regen environment (M-series Mac under amd64 emulation) and CI's GitHub Actions runner — invisible to the eye but consistently above the 0.2% diff budget. Masking the chart would leave the gate covering very little of the page, so the route isn't in the visual suite.

**`/skills/:uuid` (detail) AND `/education` (index)** — the local Docker regen environment reproducibly captures a root-error-boundary screenshot instead of the rendered page. The error is `useLocation() may be used only in the context of a <Router> component`, thrown from NavBar during client-side hydration inside the dev server's stripped-down dev container. It does NOT reproduce in normal browser use, on CI's CI runner, or in production builds — only inside the regen container. The result is a baseline stuck at the viewport height (1280×741) while CI's actual render is the full page, breaking the gate every time we try to regen. Re-adding the routes would require either fixing the Docker hydration race (no clear cause yet — Vite + Remix dev-server cold-start timing) or switching the regen path to a production build (slower, diverges from CI's setup). Behavioural coverage in `skills.spec.ts` and `education.spec.ts` already asserts both routes load and render their key content; visual regression on these specific pages wasn't catching anything the behavioural suite missed.

If a future stage moves to a screenshot tool that handles SVG better and dev-server hydration timing more deterministically (Percy, Chromatic — tracked as **T11** in [TECH-DEBT.md](../../TECH-DEBT.md)), or to a CI-side regen workflow (**T7**), all three routes can be re-added.

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

### Path 2: CI workflow (when the local race fires)

If a route's local regen captures a `useLocation() may be used only in the context of a <Router> component` hydration-race error overlay instead of the rendered page (see ["Why some routes aren't gated"](#why-some-routes-arent-gated) above), use the CI-side workflow:

```sh
gh workflow run regen-baselines.yml --ref <branch-name>
```

Or click **Run workflow** on the [Actions tab](.github/workflows/regen-baselines.yml). The workflow runs inside the exact CI environment that gates PRs — the hydration race only reproduces in the local Docker container, not on the GitHub runner, so the captured PNGs are clean. It commits the regen back to the dispatched branch automatically.

The `project` input lets you scope to `chromium`, `mobile`, or `both` (default).

Once T11 lands (a tool that handles SVG diffing better) or this workflow proves stable, the `/skills` / `/education` index / `/skills/:uuid` routes can be re-added to the gated `ROUTES` list in `visual.spec.ts`.

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
