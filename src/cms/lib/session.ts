/**
 * src/cms/lib/session.ts
 *
 * HMAC-SHA256 signed HTTP-only cookie session helpers.
 * Cookie format: base64url(JSON payload).base64url(HMAC signature)
 */

import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'cms_session';

export interface Session {
  /** GitHub user access token — used for all subsequent API calls */
  token: string;
  /** GitHub login handle, e.g. "chrisdmacrae" */
  username: string;
  /** GitHub display name */
  name: string;
  /** GitHub avatar URL */
  avatarUrl: string;
}

function getSecret(): string {
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set');
  return secret;
}

function hmac(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

/** Encode a session object into a signed cookie value string. */
export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${hmac(payload)}`;
}

/** Decode and verify a cookie value. Returns null if invalid or tampered. */
export function decodeSession(raw: string): Session | null {
  const dot = raw.lastIndexOf('.');
  if (dot === -1) return null;

  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);

  try {
    const expected = hmac(payload);
    const sigBuf = Buffer.from(sig, 'base64url');
    const expBuf = Buffer.from(expected, 'base64url');

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
  } catch {
    return null;
  }
}

/** Extract and verify the session from an incoming Request's Cookie header. */
export function getSession(request: Request): Session | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  for (const chunk of cookieHeader.split(';')) {
    const eq = chunk.indexOf('=');
    if (eq === -1) continue;
    const key = chunk.slice(0, eq).trim();
    if (key !== COOKIE_NAME) continue;
    const value = chunk.slice(eq + 1).trim();
    return decodeSession(decodeURIComponent(value));
  }

  return null;
}

/**
 * Build a Set-Cookie header value that stores the session for 7 days.
 * Marks Secure only in production so local dev works over HTTP.
 */
export function setSessionCookie(session: Session): string {
  const value = encodeURIComponent(encodeSession(session));
  const isProduction = process.env.NODE_ENV === 'production';

  return [
    `${COOKIE_NAME}=${value}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    isProduction ? 'Secure' : '',
    'Max-Age=604800', // 7 days
  ]
    .filter(Boolean)
    .join('; ');
}

/** Build a Set-Cookie header value that immediately expires the session cookie. */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

