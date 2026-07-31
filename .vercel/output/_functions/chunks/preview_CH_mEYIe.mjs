import { a as previewEntryRoute } from './index_3DEUznhT.mjs';
import { s as setBypassCookie } from './session_D7dCYp8o.mjs';

const prerender = false;
const entry = previewEntryRoute({ secret: undefined                                   });
const GET = async ({ request }) => {
  const res = await entry({ request, url: originalUrl(request) });
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") headers.append(key, value);
    else headers.set(key, value);
  });
  if (res.status === 307) {
    const token = globalThis.process?.env?.ISR_SECRET ?? undefined                          ;
    if (token) {
      headers.append("Set-Cookie", setBypassCookie(token));
    } else {
      console.warn(
        "[preview] ISR_SECRET not set — bypass cookie skipped, target page may serve from ISR cache"
      );
    }
  }
  return new Response(res.body, { status: res.status, headers });
};
function originalUrl(request) {
  const url = new URL(request.url);
  if (!url.searchParams.has("__cms_preview") && !url.searchParams.has("redirect")) {
    const forwarded = request.headers.get("x-forwarded-uri");
    const q = forwarded?.indexOf("?") ?? -1;
    if (forwarded && q !== -1) return new URL(url.pathname + forwarded.slice(q), url.origin);
  }
  url.searchParams.delete("x_astro_path");
  return url;
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
