module.exports = {
  outDir: 'app/components/icons',
  ext: 'jsx',
  jsxRuntime: 'automatic',
  // Icons are decorative — every parent (NavBar links, ThemeToggle,
  // Timeline elements) carries its own accessible name, so aria-hidden
  // lets axe/Lighthouse skip the "SVG with img role needs an accessible
  // name" rule. Consumers can override at the call site if a future
  // icon needs to be meaningful.
  svgProps: { height: '100%', 'aria-hidden': 'true' },
};
