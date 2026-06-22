# Tech debt

> Open items that are real today. Each section is independently
> shippable. Items get ticked off as PRs land.

## Status

| #   | Item                                | Status                |
| --- | ----------------------------------- | --------------------- |
| 1   | Stylelint rules masking simple-vars | open                  |
| 2   | Mobile visual baselines             | open                  |
| 3   | `react-router-dom` exact-pinned     | documented; no action |
| 4   | Subset Roboto                       | open                  |
| 5   | Drop unused `ConditionalWrapper`    | open                  |

---

## #1 — Stylelint rules disabled around simple-vars

**Severity:** low.

[.stylelintrc.json](.stylelintrc.json) disables three rules
(`declaration-property-value-no-unknown`, `shorthand-property-no-redundant-values`,
`color-function-alias-notation`) that produce false positives on
postcss-simple-vars `$tokens`. They're real CSS lint rules that work
everywhere except this app's PostCSS pipeline.

**Fix:** migrate from `simple-vars` to native CSS custom properties,
then re-enable. Larger change than the rule flip itself — every token
reference (`$space-12`) becomes `var(--space-12)`, and the
`postcss-simple-vars` `unknown` callback we rely on to catch typos
needs an equivalent (linter rule, build-time check, or accept the
loss of safety).

**Effort:** ~half a day to migrate, plus stylelint cleanup pass.

---

## #2 — No mobile visual baselines

**Severity:** low. Coverage gap.

The visual regression suite gates 3 desktop baselines only (`/`,
`/education`, `/education/:slug`). Mobile layout regressions slip
through CI even though both projects (chromium + mobile) run.

**Fix:** add mobile baselines via the existing Docker regen script.

**Effort:** ~2 hours.

---

## #3 — `react-router-dom` exact-pinned

**Severity:** low. Documented; just fragile.

Already in [AGENTS.md §11](AGENTS.md#tests). Each `@remix-run/react`
bump requires manual re-pin of `react-router-dom` to whatever Remix
ships internally — otherwise tests crash with `useHref() may be used
only in the context of a <Router> component`. React Router v7
adapter would resolve it but is a separate migration.

No action needed today.

---

## #4 — Subset Roboto

**Severity:** medium. Concrete perf win.

`public/fonts/roboto/Roboto-VariableFont_wdth,wght.woff2` ships
unsubsetted at ~209 KB. The site renders English + Spanish only —
ASCII letters / digits / punctuation + a small set of Spanish
accents. The same subset we applied to Monaspace (199 KB → 21 KB)
should drop Roboto to ~25 KB.

Roboto is preloaded on every route (it's the body face), so the
saving propagates to home, skills, skills/:uuid, education,
education/:slug — every page. Bigger absolute win than the
Monaspace subset.

**Fix:** generalise [scripts/subset-monaspace.mjs](scripts/subset-monaspace.mjs)
into `scripts/subset-fonts.mjs` (or copy + adjust) and run it on
Roboto. New filename suffix bump to cache-bust past the 1y immutable
asset cache. Update the `@font-face` `src` and the root `links()`
preload.

**Caveat:** Roboto is a variable font with `wdth,wght` axes —
`subset-font` should handle that, but verify the rendered output
weight (we use 400/500/700) still matches before shipping.

**Effort:** ~30 min including the variable-font sanity check.

---

## #5 — `ConditionalWrapper` is dead code

**Severity:** low. Cleanup.

[`app/components/ConditionalWrapper/index.tsx`](app/components/ConditionalWrapper/index.tsx)
exports `ConditionalWrapper` (default) and `ConditionalLink`
(named). The most recent NavBar refactor removed the only consumer
of `ConditionalLink` — the social-icon anchors had a constant URL
so the conditional branch was always-true (dead code). Both
exports are now referenced **only** by their own
`index.test.tsx` and `index.stories.tsx`.

**Fix:** delete the component, its story, and its test. If a future
need for conditional wrapping arises, the pattern is small enough to
inline at the call site.

**Effort:** ~15 min.

---
