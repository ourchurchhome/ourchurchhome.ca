export const prerender = false;

import type { APIRoute } from 'astro';
import { previewEntryRoute } from '@go-git-cms/preview-astro';
import { setBypassCookie } from '../../cms/lib/session';

/**
 * Draft-mode entry point (Vercel draft mode).
 *
 *   /api/preview?redirect=/articles/foo&__cms_preview=<payload>
 *
 * The package's entry route verifies the payload, parks it in the
 * __cms_preview cookie, and 307s to the target page. On top of that we set
 * Vercel's ISR bypass cookie (__prerender_bypass) so the target page's
 * serverless function actually runs instead of being served from the ISR
 * cache — the cache key ignores query strings and cookies, so without the
 * bypass every preview would show the last cached publish.
 *
 * This route itself is excluded from ISR in astro.config.mjs.
 */
const entry = previewEntryRoute({ secret: import.meta.env.CMS_PREVIEW_SECRET });

export const GET: APIRoute = async ({ request }) => {
  const res = await entry({ request, url: originalUrl(request) });

  // Rebuild the response with our own Headers: appending Set-Cookie to a
  // constructed Response's headers is guard-restricted in some runtimes.
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') headers.append(key, value);
    else headers.set(key, value);
  });

  if (res.status === 307) {
    const token =
      (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
        ?.ISR_SECRET ?? import.meta.env.ISR_SECRET;
    if (token) {
      headers.append('Set-Cookie', setBypassCookie(token));
    } else {
      console.warn(
        '[preview] ISR_SECRET not set — bypass cookie skipped, target page may serve from ISR cache'
      );
    }
  }

  return new Response(res.body, { status: res.status, headers });
};

/**
 * Recover the original query string. The Vercel adapter's internal router can
 * replace it with `?x_astro_path=...` by the time the handler runs; the
 * original path+query survives in the x-forwarded-uri header.
 */
function originalUrl(request: Request): URL {
  const url = new URL(request.url);
  if (!url.searchParams.has('__cms_preview') && !url.searchParams.has('redirect')) {
    const forwarded = request.headers.get('x-forwarded-uri');
    const q = forwarded?.indexOf('?') ?? -1;
    if (forwarded && q !== -1) return new URL(url.pathname + forwarded.slice(q), url.origin);
  }
  url.searchParams.delete('x_astro_path');
  return url;
}
