/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  globals: {
    context: true,
    cy: true,
    Cypress: true,
  },

  // Base config
  plugins: ['prettier', 'simple-import-sort'],
  extends: [
    'eslint:recommended',
    'airbnb',
    'airbnb/hooks',
    'prettier',
    'plugin:storybook/recommended',
  ],
  rules: {
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
      },
    ],
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '/**/*.cy.{ts,tsx,js,jsx}',
          'cypress/**/*.{ts,js}',
          'cypress.config.cjs',
          'mocks/**/*.{ts,js}',
          'tests/**/*.{ts,js}',
          'playwright.config.ts',
          '/**/*.spec.ts',
        ],
      },
    ],
    'import/prefer-default-export': 'off',
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': ['error', { allow: ['__typename'] }],
    'no-unused-vars': 'off', // use @typescript-eslint/no-unused-vars rule instead
    'no-use-before-define': ['error', 'nofunc'],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'spaced-comment': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },

  overrides: [
    // React
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      plugins: ['react', 'jsx-a11y'],
      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
      ],
      settings: {
        'import/internal-regex': '^~/',
        'import/resolver': {
          node: {
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
        react: {
          version: 'detect',
        },
        formComponents: ['Form'],
        linkComponents: [
          { name: 'Link', linkAttribute: 'to' },
          { name: 'NavLink', linkAttribute: 'to' },
        ],
      },
      rules: {
        'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.jsx'] }],
        'react/jsx-one-expression-per-line': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/jsx-wrap-multilines': ['error', { prop: 'ignore' }],
        'react/react-in-jsx-scope': 'off',
        'react/require-default-props': [
          'error',
          {
            functions: 'defaultArguments',
          },
        ],
        'react/sort-comp': 'off',
        'react/state-in-constructor': 'off',
        'react/static-property-placement': 'off',
      },
    },

    // Typescript
    {
      files: ['**/*.{ts,tsx}'],
      plugins: ['@typescript-eslint', 'import'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
      ],
      settings: {
        'import/internal-regex': '^~/',
        'import/resolver': {
          node: {
            extensions: ['.ts', '.tsx'],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      rules: {
        'react/prop-types': 'off',
      },
    },

    // Node
    {
      files: ['.eslintrc.js'],
      env: {
        node: true,
      },
    },

    // Cypress
    {
      files: ['cypress/**/*.{ts,js}', '**/*.cy.{ts,js}'],
      plugins: ['cypress'],
      extends: ['plugin:cypress/recommended'],
      rules: {
        'cypress/no-unnecessary-waiting': 'off',
        'no-unused-expressions': ['off'],
      },
    },

    // Miscellaneous
    {
      files: ['app/api/**/*.{ts,js}'],
      rules: {
        'import/no-cycle': 'off',
      },
    },
  ],
};
