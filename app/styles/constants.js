// Design tokens injected as PostCSS simple-vars (e.g. `$text-color`).
// Single source of truth — unknown variable refs emit warnings via
// postcss.config.js's `unknown` callback.
export default {
  // ─── GitHub brand palette ────────────────────────────────────────
  // Adopted from GitHub's published brand guidelines. Used for both
  // light and dark themes — the [data-theme] CSS-variable wiring in
  // app/styles/style.css picks the right tokens per mode.
  //
  // Discipline: aim for an 80/10/10 ratio (neutral / gray-tinted
  // surfaces / green accent). Most surfaces should be neutral; green
  // does primary CTAs, focus rings, and the chart accent only.

  // Grays — cool neutral, light → dark
  'gray-1': '#f2f5f3', // page background (light)
  'gray-2': '#e4ebe6', // surface (light), border (light)
  'gray-3': '#b6bfb8', // muted text (light), border (dark)
  'gray-4': '#909692', // body muted (dark theme only — fails WCAG AA on light bg)
  'gray-5': '#232925', // surface (dark), elevated (light)
  'gray-6': '#101411', // page background (dark) — process black
  'gray-7': '#555b58', // body muted on LIGHT theme — clears 4.5:1 vs $surface-page-light

  // Greens — light → dark
  'green-1': '#bfffd1', // softest highlight (light-mode accent backgrounds)
  'green-2': '#8cf2a6',
  'green-3': '#5fed83',
  'green-4': '#0fbf3e', // GitHub Green — hero / accent / focus
  'green-5': '#066456', // deep teal-green — light-theme accent text (clears WCAG AA)
  'green-6': '#0a241b', // darkest — dark-mode accent backgrounds

  // ─── GitHub-aligned surface + border helpers ─────────────────────
  // GitHub's actual UI uses a TWO-layer model — page < card — and
  // leans on visible 1px borders to define edges. Card headers don't
  // get a separate background; they sit flush with the body and
  // are separated only by a hairline divider + typography.
  //
  // Sampled from github.com:
  //   - dark page  #0d1117, card #151b23 (~9 RGB-step lift)
  //   - light page #ffffff, card #ffffff (border-defined)
  //   - dark border  #3d444d, light border #d1d9e0
  //
  // Greens stay our own (GitHub Green #0fbf3e) to keep the brand
  // signature distinct from a pure GitHub clone.
  // Card surface in dark is a green-tinted neutral. Same-hue lifts
  // (green-on-green) read smaller than GitHub's neutral-blue lifts,
  // so the perceptual step needs to be bigger than the raw RGB step.
  // ~25 RGB units lifts the card off our process-black page enough
  // to read as a distinct surface. Border is bright enough to
  // backstop when surface contrast is subtle.
  'surface-card-dark': '#262e29', // card body (dark)
  'surface-elevated-dark': '#323a35', // chip/hover lift (dark)
  'border-card-dark': '#4a524b', // visible 1px border on dark
  // NavBar uses its own token (not card surface) so the rail can
  // sit at a tone DISTINCT from the card surface — otherwise nav +
  // cards merge into one visual block. Slightly cooler than
  // surface-card-dark.
  'surface-nav-dark': '#1a201c', // nav rail (dark) — visible above page
  'surface-nav-light': '#eaeef1', // nav rail (light) — distinct from page bg
  // Light theme: page is GitHub's canvas-subtle (#f6f8fa, the same
  // shade GitHub itself uses behind cards), card is the slightly
  // off-white #fbfcfd. Pure-white-on-pure-white was too harsh —
  // these values keep the border-defined feel without burning the
  // user's eyes on full luminance.
  'surface-page-light': '#f6f8fa', // light mode page (canvas-subtle)
  'surface-card-light': '#fbfcfd', // light card — soft off-white
  'surface-elevated-light': '#eef1f4', // chip/hover lift (light)
  'border-card-light': '#d1d9e0', // visible 1px border on light

  // ─── Legacy colors (point at GitHub palette so un-migrated CSS
  //     picks up the new look automatically) ──────────────────────
  'text-color': '#f2f5f3', // → gray-1 (legible on dark)
  'default-white': '#ffffff',
  'default-grey': '#909692', // → gray-4
  'default-black': '#101411', // → gray-6
  'success-green': '#0fbf3e', // → green-4
  'variation-green': '#08827b', // → green-5
  'alternative-green': '#5fed83', // → green-3
  'background-default': '#101411', // → gray-6
  'background-variation': '#232925', // → gray-5
  'card-border': '1px solid #232925', // → gray-5
  'error-red': '#f85149',

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
  // The legacy tokens ($mobile-small, $desktop-small, $desktop-medium)
  // are mobile-first min-width queries — base styles target the
  // smallest viewport, breakpoints add at larger sizes. Both naming
  // (`mobile-small` is the *bigger-than-smallest-mobile* threshold)
  // and coverage (no tablet stop between 497-1075px) are awkward.
  //
  // Tablet stop added below: $bp-md = 768px catches iPad portrait,
  // every Android tablet, and narrow laptop windows. Old tokens
  // retained — they still work — so each route can opt into the new
  // breakpoint as it gets touched.
  //
  // Tailwind-aligned for source-readability:
  //   bp-sm  640px   small phone landscape, large mobile
  //   bp-md  768px   tablet portrait (iPad), large phones landscape
  //   bp-lg  1024px  tablet landscape, small laptops
  //   bp-xl  1280px  standard desktops
  'bp-sm': '640px',
  'bp-md': '768px',
  'bp-lg': '1024px',
  'bp-xl': '1280px',

  // Legacy (still referenced by un-migrated CSS).
  'desktop-medium': '1296px',
  'desktop-small': '1076px',
  'mobile-small': '496px',
};
