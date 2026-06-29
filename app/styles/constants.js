// Design tokens injected as PostCSS simple-vars (e.g. `$space-20`).
// Single source of truth — unknown variable refs emit warnings via
// postcss.config.js's `unknown` callback.
//
// Color / theme tokens previously lived here too but were migrated
// to CSS custom properties in app/styles/style.css's `:root` /
// `[data-theme='light']` blocks (T10a) — see TECH-DEBT.md Bundle 1.
// The remaining simple-vars exports are values that can't be served
// via `var()` (breakpoint dimensions inside `@media` preludes) or
// numeric scale tokens we haven't migrated yet (T10b will sweep
// spacing, font, border-radius, weight, shadow).
export default {
  // Border
  'border-10': '10px',
  'border-8': '8px', // GitHub-style card radius
  'border-6': '6px',
  'border-4': '4px',

  // ─── Spacing scale ──────────────────────────────────────────────
  // 4-based ladder, value-as-name. Add new steps as needed but keep
  // the 4-based discipline so the scale stays mathematically clean.
  'space-4': '4px',
  'space-8': '8px',
  'space-12': '12px',
  'space-16': '16px',
  'space-20': '20px',
  'space-24': '24px',
  'space-32': '32px',
  'space-40': '40px',
  'space-48': '48px',
  'space-60': '60px',
  'space-72': '72px',
  'space-80': '80px',
  'space-200': '200px',

  // ─── Type scale ─────────────────────────────────────────────────
  // 1.25 ratio, value-as-name. Add new steps from this ladder only
  // (12 → 14 → 16 → 20 → 24 → 30 → 36 → 48 → 60).
  'font-12': '12px',
  'font-14': '14px',
  'font-16': '16px',
  'font-20': '20px',
  'font-24': '24px',
  'font-30': '30px',

  // Weights
  'weight-700': '700',

  // Shadows
  'shadow-1': 'inset 0 -1px 0 #21262d',

  // Break points
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
  //
  // Note: postcss-simple-vars carries these into @media rules at build
  // time. `var(--bp-md)` can't be used in @media preludes (CSS spec
  // limitation — see TECH-DEBT.md Bundle 1 investigation), so the
  // breakpoint subset stays on simple-vars even as other tokens migrate
  // to CSS custom properties.
  'bp-sm': '640px',
  'bp-md': '768px',
  'bp-lg': '1024px',
  'bp-xl': '1280px',
  'bp-2xl': '1536px',
};
