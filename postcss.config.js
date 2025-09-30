import constants from './app/styles/constants.js';

const isProd = process.env.NODE_ENV === 'production';

export default {
  plugins: {
    'postcss-extend-rule': {},
    'postcss-import': {},
    'postcss-nested': {},
    'postcss-simple-vars': {
      variables: { ...constants },
      unknown: (node, name, result) => {
        const trace = result.opts?.from;
        node.warn(result, `Unknown variable "${name}" at ${trace}`);
      },
    },
    '@tailwindcss/postcss': {},   // ✅ only this
    autoprefixer: {},
    ...(isProd ? { cssnano: {} } : {}),
  },
};
