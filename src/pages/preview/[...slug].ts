export const prerender = false;

import type { APIRoute } from 'astro';
import { setBypassCookie } from '../../cms/lib/session';

export const GET: APIRoute = ({ params, url }) => {
  const slug = params.slug ?? '';
  const draft = url.searchParams.get('draft') ?? '';

  const target = `/${slug}${draft ? `?draft=${encodeURIComponent(draft)}` : ''}`;

  const headers = new Headers({ Location: target });
  const token = import.meta.env.ISR_SECRET;
  if (token) {
    headers.append('Set-Cookie', setBypassCookie(token));
  }

  return new Response(null, { status: 302, headers });
};
