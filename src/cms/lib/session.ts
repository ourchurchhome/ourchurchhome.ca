// ── Vercel ISR bypass cookie ─────────────────────────────────────────────────
// Setting __prerender_bypass=<bypassToken> tells Vercel to skip its ISR cache
// and run the serverless function fresh for this visitor.

const BYPASS_COOKIE_NAME = '__prerender_bypass';

/**
 * Build a Set-Cookie header value that activates Vercel's ISR bypass for this
 * visitor. Pass the value of the ISR_SECRET environment variable as `token`.
 */
export function setBypassCookie(token: string): string {
  return `${BYPASS_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/`;
}

/** Build a Set-Cookie header value that clears the ISR bypass cookie. */
export function clearBypassCookie(): string {
  return `${BYPASS_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
