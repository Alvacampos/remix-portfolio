import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // `corePlugins` is a v3 escape hatch; in v4 we still need preflight off and
  // there is no first-class API for it on the JS config yet — flag for Stage 5.
  // @ts-expect-error -- v4 typings dropped this field
  corePlugins: {
    preflight: false,
  },
} satisfies Config;
