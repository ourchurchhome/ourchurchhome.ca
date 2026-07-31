import { e as exitPreviewRoute } from './index_3DEUznhT.mjs';
import { c as clearBypassCookie } from './session_D7dCYp8o.mjs';

const prerender = false;
const exit = exitPreviewRoute();
const GET = async () => {
  const res = await exit();
  const headers = new Headers();
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") headers.append(key, value);
    else headers.set(key, value);
  });
  headers.append("Set-Cookie", clearBypassCookie());
  return new Response(null, { status: res.status, headers });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
