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
  'desktop-medium': '1296px',
  'desktop-small': '1076px',
  'mobile-small': '496px',
};
