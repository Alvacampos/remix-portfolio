// SHA-256 hex digest of a client IP. Used to key rate-limit records so
// the KV namespace doesn't hold plaintext IPs if the store is ever
// inspected. Callers salt the key with a purpose prefix
// (`ratelimit:data:`, `ratelimit:contact:`) — no cross-purpose collisions.
export async function hashIp(ip: string): Promise<string> {
  const buf = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
