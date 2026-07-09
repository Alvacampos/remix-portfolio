// RR v8 Single Fetch requires each route that wants its loader
// headers on the response to explicitly re-export them from `headers`.
// This is the identity export every non-contact route uses.
export function passLoaderHeaders({ loaderHeaders }: { loaderHeaders: Headers }) {
  return loaderHeaders;
}
