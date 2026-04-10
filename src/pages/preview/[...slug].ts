export const prerender = false;

import type { APIRoute } from 'astro';
import { setBypassCookie } from '../../cms/lib/session';

/**
 * Draft preview endpoint.
 *
 *   /preview/?draft=<base64>              → redirects to /?draft=<base64>
 *   /preview/articles/foo?draft=<base64>  → redirects to /articles/foo?draft=<base64>
 *
 * The endpoint sets the Vercel ISR `__prerender_bypass` cookie so the target
 * page's SSR function actually runs (instead of being served from the ISR
 * cache), then 302s to the target with the original query string intact.
 *
 * ── Why we parse the URL ourselves ───────────────────────────────────────────
 * Astro's Vercel adapter rewrites incoming SSR requests through an internal
 * router that *replaces* the original query string with `?x_astro_path=...`
 * by the time `Astro.url` is constructed. So `Astro.url.searchParams.get('draft')`
 * returns null even when the user requested `/preview/?draft=...`.
 *
 * The original request URL is still available — Vercel forwards it in the
 * `x-forwarded-uri` header (and also as `x-matched-path` / similar). We
 * reconstruct the query string from there.
 */
export const GET: APIRoute = ({ params, request }: { params: Record<string, string | undefined>; request: Request }) => {
  const slug = params.slug ?? '';

  // Recover the original query string. Try a few sources in order — different
  // Vercel runtimes / adapter versions expose it in different places.
  const query = extractOriginalQuery(request);

  const target = `/${slug}${query}`;

  const headers = new Headers({
    Location: target,
    // Never let Vercel ISR cache this redirect — its cache key doesn't include
    // query strings, so a cached response would strip the draft from every
    // subsequent visitor.
    'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  });
  // Read from process.env first — import.meta.env only contains values
  // inlined at build time, so on Vercel a runtime-set ISR_SECRET would be
  // missing here and the bypass cookie would silently never get set.
  const token =
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.ISR_SECRET ??
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.ISR_SECRET;
  if (token) {
    headers.append('Set-Cookie', setBypassCookie(token));
  } else {
    console.warn('[preview] ISR_SECRET not set — bypass cookie skipped, target page will serve from ISR cache');
  }

  return new Response(null, { status: 302, headers });
};

function extractOriginalQuery(request: Request): string {
  // 1. Vercel's standard forwarded-URI header carries the original path+query.
  const forwarded = request.headers.get('x-forwarded-uri');
  if (forwarded) {
    const q = forwarded.indexOf('?');
    if (q !== -1) return forwarded.slice(q);
  }

  // 2. The raw Request URL — sometimes the adapter hasn't rewritten this yet.
  try {
    const raw = new URL(request.url);
    const params = new URLSearchParams(raw.search);
    params.delete('x_astro_path'); // adapter-injected, never the user's
    const s = params.toString();
    if (s) return `?${s}`;
  } catch {
    // ignore — fall through
  }

  return '';
}
