import { type RouteConfig } from '@react-router/dev/routes';
import { flatRoutes } from '@react-router/fs-routes';

// File-based flat routes: directory names (`_index/`, `skills.$uuid/`,
// `contact._index/`, ...) map straight to URL segments via `flatRoutes()`.
export default flatRoutes() satisfies RouteConfig;
