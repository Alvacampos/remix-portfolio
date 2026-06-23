# Tech debt

> Open items that are real today. Each section is independently
> shippable. Items get ticked off as PRs land.

## Status

| #   | Item                                | Status                |
| --- | ----------------------------------- | --------------------- |
| 1   | Stylelint rules masking simple-vars | open                  |
| 2   | `react-router-dom` exact-pinned     | documented; no action |

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

## #2 — `react-router-dom` exact-pinned

**Severity:** low. Documented; just fragile.

Already in [AGENTS.md §11](AGENTS.md#tests). Each `@remix-run/react`
bump requires manual re-pin of `react-router-dom` to whatever Remix
ships internally — otherwise tests crash with `useHref() may be used
only in the context of a <Router> component`. React Router v7
adapter would resolve it but is a separate migration.

No action needed today.

---
