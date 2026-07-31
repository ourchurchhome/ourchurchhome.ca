export const prerender = false;

import type { APIRoute } from 'astro';
import { exitPreviewRoute } from '@go-git-cms/preview-astro';
import { clearBypassCookie } from '../../../cms/lib/session';

/** Leave draft mode: clear the preview payload cookie and the ISR bypass. */
const exit = exitPreviewRoute();

export const GET: APIRoute = async () => {
  const res = await exit();

  const headers = new Headers();
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') headers.append(key, value);
    else headers.set(key, value);
  });
  headers.append('Set-Cookie', clearBypassCookie());

  return new Response(null, { status: res.status, headers });
};
