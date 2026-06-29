// Design tokens injected as PostCSS simple-vars (e.g. `$bp-md`).
// Single source of truth — unknown variable refs emit warnings via
// postcss.config.js's `unknown` callback.
//
// Almost all tokens were migrated to CSS custom properties under
// app/styles/style.css's `:root` block:
//   - T10a: color palette + theme tokens (--bg-*, --fg-*, --accent*,
//     --border-default, --border-emphasis).
//   - T10b: numeric scale tokens (--space-*, --font-*, --border-N,
//     --weight-*).
//
// What remains here is the breakpoint subset only. CSS spec forbids
// `var()` inside `@media` preludes (the MQL5 grammar accepts no
// function tokens, and custom properties resolve per-element which
// has no meaning in @media), so breakpoint values can't move to
// custom properties — they stay as preprocessor substitutions.
// See TECH-DEBT.md Bundle 1 investigation for the full reasoning.
export default {
  // ─── Break points ───────────────────────────────────────────────
  //
  // Mobile-first min-width queries — base styles target the smallest
  // viewport (sub-640px, every phone in portrait), and breakpoints add
  // rules at larger sizes. Tailwind v4-aligned (also matches Bootstrap
  // 5 and Material) so future contributors can map directly between
  // Tailwind utility prefixes and our token names without translation.
  //
  // Devices each band catches:
  //   bp-sm   640px   phone landscape (~700-900 wide). Compact tablets.
  //   bp-md   768px   iPad portrait (744-834). Z Fold inner. Large phone landscape.
  //   bp-lg  1024px   iPad landscape (1024-1194). Small laptops.
  //   bp-xl  1280px   iPad Pro 12.9" landscape. Standard 13-15" laptops.
  //   bp-2xl 1536px   27" external monitors. Cap content max-width above this.
  'bp-sm': '640px',
  'bp-md': '768px',
  'bp-lg': '1024px',
  'bp-xl': '1280px',
  'bp-2xl': '1536px',
};
