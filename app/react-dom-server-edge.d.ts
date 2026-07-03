// `react-dom` doesn't ship types for the `/server.edge` subpath in
// its bundled `@types/react-dom` — the DT package only types the plain
// `/server` and `/server.node` paths. The subpath re-exports the same
// Web Streams surface (`renderToReadableStream`, `renderToStaticMarkup`,
// etc.), so re-export `react-dom/server`'s types verbatim.
declare module 'react-dom/server.edge' {
  export * from 'react-dom/server';
}
