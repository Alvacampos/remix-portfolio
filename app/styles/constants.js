// Design tokens injected as PostCSS simple-vars (e.g. `$text-color`).
// Keep this file as the single source of truth — unknown variable refs
// emit warnings via postcss.config.js's `unknown` callback.
//
// All entries below are referenced somewhere in app/**/*.css. Tokens
// that became unused after Stage 5 were removed:
//   - alternative-white, alternative-black (the misleading
//     `#ffffff00` literal — transparent white, not black)
//   - border-5, space-100, space-50, weight-500, default-animation
export default {
  // Colors
  'text-color': '#f0f6fc',
  'default-white': '#ffffff',
  'default-grey': '#60686c99',
  'default-black': '#0d1117',
  'success-green': '#238636',
  'variation-green': '#216e39',
  'alternative-green': '#2ea043',
  'background-default': '#010408',
  'background-variation': '#161b22',
  'card-border': '1px solid #30363d',
  'error-red': '#f85149',

  // Border
  'border-10': '10px',
  'border-6': '6px',
  'border-4': '4px',

  // Spaces
  'space-200': '200px',
  'space-80': '80px',
  'space-70': '70px',
  'space-60': '60px',
  'space-40': '40px',
  'space-35': '35px',
  'space-30': '30px',
  'space-20': '20px',
  'space-16': '16px',
  'space-15': '15px',
  'space-10': '10px',
  'space-5': '5px',

  // Font Sizes
  'font-32': '32px',
  'font-24': '24px',
  'font-20': '20px',
  'font-18': '18px',
  'font-16': '16px',
  'font-15': '15px',
  'font-14': '14px',
  'font-12': '12px',

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
