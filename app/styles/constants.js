// Design tokens injected as PostCSS simple-vars (e.g. `$text-color`).
// Keep this file as the single source of truth — unknown variable refs
// emit warnings via postcss.config.js's `unknown` callback.
//
// STAGE 26 NOTE: this file is in transition. The "old" tokens
// ($default-black, $success-green, $mobile-small, $font-N etc.) stay
// referenced by routes that haven't been migrated yet — they shadow the
// "new" tokens at the same value where overlap exists. Per-page revamp
// PRs (Stages 27-29) migrate one route at a time. Stage 30 deletes the
// old tokens once nothing references them.
export default {
  // ─── Colors (NEW: zinc/emerald system) ───────────────────────────
  // Background scale — near-black with a cool tint, replaces the
  // GitHub-default-dark blue cast.
  'bg-base': '#09090b', // zinc-950 — page background (dark)
  'bg-surface': '#18181b', // zinc-900 — cards, hover states
  'bg-elevated': '#27272a', // zinc-800 — selected, active

  // Text scale — full white was halation-prone on dark; drop to zinc-50.
  'fg-base': '#fafafa', // primary text (dark mode)
  'fg-muted': '#a1a1aa', // zinc-400 — body muted, dates
  'fg-faint': '#71717a', // zinc-500 — disabled, decorative labels

  // Borders & accents.
  'border-default': '#27272a', // zinc-800
  'border-emphasis': '#3f3f46', // zinc-700 — hover state
  'accent-emerald': '#10b981', // emerald-500 — primary accent (dark)
  'accent-emerald-strong': '#059669', // emerald-600 — primary accent (light)
  'accent-emerald-soft': '#34d399', // emerald-400 — hover/highlights
  'accent-amber': '#f59e0b', // amber-500 — sparing secondary

  // Semantic — keep consistent in both themes.
  'error-red': '#f85149',

  // ─── Light theme overrides ───────────────────────────────────────
  // Wired in style.css via [data-theme='light'] selector. These tokens
  // exist as separate keys so postcss-simple-vars resolves them at
  // build time even though they're applied conditionally at runtime.
  'bg-base-light': '#fafafa', // zinc-50
  'bg-surface-light': '#f4f4f5', // zinc-100
  'bg-elevated-light': '#e4e4e7', // zinc-200
  'fg-base-light': '#09090b', // zinc-950
  'fg-muted-light': '#52525b', // zinc-600
  'fg-faint-light': '#71717a', // zinc-500
  'border-default-light': '#e4e4e7', // zinc-200
  'border-emphasis-light': '#d4d4d8', // zinc-300

  // ─── Type scale (NEW) ────────────────────────────────────────────
  // Geist Sans for display/body, Geist Mono for chips/dates/code.
  // Sizes use rem so user-zoom respects them.
  'type-display': '3.5rem', // 56px — hero h1
  'type-h1': '2.5rem', // 40px
  'type-h2': '1.75rem', // 28px
  'type-h3': '1.25rem', // 20px
  'type-body': '1rem', // 16px
  'type-small': '0.875rem', // 14px
  'type-mono': '0.875rem', // 14px — chips, dates, code

  'leading-tight': '1.1',
  'leading-snug': '1.3',
  'leading-normal': '1.5',
  'leading-relaxed': '1.65',

  'tracking-tight': '-0.02em',
  'tracking-snug': '-0.01em',
  'tracking-normal': '0',

  // ─── Breakpoints (NEW) ───────────────────────────────────────────
  // Tailwind-aligned 4-stop mobile-first system. Old tokens
  // ($mobile-small etc.) preserved below for migration.
  'bp-sm': '640px', // small phone landscape
  'bp-md': '768px', // tablet portrait
  'bp-lg': '1024px', // tablet landscape, small laptop
  'bp-xl': '1280px', // standard desktop

  // ─── OLD tokens (kept until per-route migration finishes) ────────
  // Routes that haven't been touched in Stages 27-29 still reference
  // these. Stage 30 deletes the lot once unreferenced. Values updated
  // to point at the NEW palette so even un-migrated routes get the
  // new look — only the names persist for backward compatibility.
  'text-color': '#fafafa',
  'default-white': '#ffffff',
  'default-grey': '#71717a',
  'default-black': '#09090b',
  'success-green': '#10b981',
  'variation-green': '#059669',
  'alternative-green': '#34d399',
  'background-default': '#09090b',
  'background-variation': '#18181b',
  'card-border': '1px solid #27272a',

  // Border (legacy)
  'border-10': '10px',
  'border-6': '6px',
  'border-4': '4px',

  // Spaces (legacy — will be reorganized into a $space-{N} scale in a future stage)
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

  // Font sizes (legacy — superseded by $type-* but retained until migration)
  'font-32': '32px',
  'font-24': '24px',
  'font-20': '20px',
  'font-18': '18px',
  'font-16': '16px',
  'font-15': '15px',
  'font-14': '14px',
  'font-12': '12px',

  'weight-700': '700',

  'shadow-1': 'inset 0 -1px 0 #27272a',

  // Old breakpoints — Stages 27-29 will rewrite their media queries to
  // use $bp-sm/md/lg/xl instead. Stage 30 deletes these.
  'desktop-medium': '1296px',
  'desktop-small': '1076px',
  'mobile-small': '496px',
};
