import { type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

// Remix v2's file-based flat-routes convention is opt-in in RR v7.
// The existing app/routes/ directory shapes (`_index.tsx`,
// `skills.$uuid/index.tsx`, `contact._index/index.tsx`, etc.) are
// picked up verbatim by `flatRoutes()`.
export default flatRoutes() satisfies RouteConfig;
