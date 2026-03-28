import { defineMiddleware } from 'astro:middleware';
import { getSession } from './cms/lib/session';

// Routes under /cms that don't require a valid session.
// These must be exact matches OR use startsWith only for the auth sub-paths.
const PUBLIC_CMS_EXACT = new Set(['/cms']);
const PUBLIC_CMS_PREFIXES = ['/cms/login', '/cms/auth/callback', '/cms/logout'];

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = context.url;

  // Only gate /cms/* routes
  if (!pathname.startsWith('/cms')) {
    return next();
  }

  // Allow exact-match public routes (e.g. /cms itself just redirects)
  if (PUBLIC_CMS_EXACT.has(pathname)) {
    return next();
  }

  // Allow auth sub-routes through without a session
  if (PUBLIC_CMS_PREFIXES.some((r) => pathname.startsWith(r))) {
    return next();
  }

  const session = getSession(context.request);

  if (!session) {
    return context.redirect('/cms/login');
  }

  // Attach session to locals so SSR pages can access it without re-parsing the cookie
  context.locals.session = session;

  return next();
});

