export const prerender = false;

import type { APIRoute } from 'astro';
import { setBypassCookie } from '../../cms/lib/session';

export const GET: APIRoute = ({ params, url }) => {
  const slug = params.slug ?? '';
  const query = url.search; // includes the leading "?" or is "" if none

  const target = `/${slug}${query}`;

  const headers = new Headers({
    Location: target,
    // Never let Vercel ISR (or any intermediary) cache this redirect — the
    // cache key doesn't include query strings, so a cached response would
    // strip the draft payload from every subsequent visitor.
    'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  });
  const token = import.meta.env.ISR_SECRET;
  if (token) {
    headers.append('Set-Cookie', setBypassCookie(token));
  }

  return new Response(null, { status: 302, headers });
};
