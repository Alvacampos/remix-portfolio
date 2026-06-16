import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories are colocated with their components under app/components/.
  stories: ['../app/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@chromatic-com/storybook', '@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {
      // The project's root vite.config.ts wires up the @remix-run/dev
      // plugin, which only works inside Remix's own pipeline. Point
      // Storybook at a clean Vite config that omits it.
      builder: {
        viteConfigPath: '.storybook/vite.config.ts',
      },
    },
  },
  typescript: {
    // Faster builds; we already run `tsc` on its own job in CI.
    check: false,
  },
};

export default config;
