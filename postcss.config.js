import constants from './app/styles/constants.js';

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
    autoprefixer: {},
    cssnano: {},
  },
};
