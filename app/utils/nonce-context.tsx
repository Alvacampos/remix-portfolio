import { createContext, type ReactNode, useContext } from 'react';

// React (not react-router) context carrying the per-request CSP nonce
// through the SSR tree. Populated by `entry.server.tsx`; read via
// `useNonce()`. See docs/security.md for why not loader data.
// Default '' keeps unit tests and the pre-loader error boundary safe.
const NonceContext = createContext<string>('');

export function NonceProvider({ nonce, children }: { nonce: string; children: ReactNode }) {
  return <NonceContext value={nonce}>{children}</NonceContext>;
}

export function useNonce(): string {
  return useContext(NonceContext);
}
