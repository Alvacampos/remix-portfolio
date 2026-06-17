module.exports = {
  outDir: 'app/components/icons',
  ext: 'jsx',
  jsxRuntime: 'automatic',
  // Every icon parent (NavBar links, Carousel items, Timeline elements) carries
  // its own accessible name via aria-label / surrounding text, so the SVGs
  // themselves are decorative. Marking them aria-hidden + dropping role="img"
  // lets axe / Lighthouse skip the "SVG with img role needs an accessible
  // name" rule. If a future icon needs to be a meaningful image, the consumer
  // can override these props at the call site.
  svgProps: { height: '100%', 'aria-hidden': 'true' },
};
