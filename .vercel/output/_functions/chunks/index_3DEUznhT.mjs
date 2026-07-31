import { strFromU8, inflateSync } from 'fflate';

// The preview protocol. Both the editor plugin and the previewed page import
// these, which is the whole point: there is one definition of the wire format
// and it cannot drift between the two sides.
//
// Docs: docs/preview-system.md §4.
/**
 * A page that never sends `cms:ready` is assumed to be all-false: the editor
 * falls back to hard reloads. That is the graceful-degradation floor which lets
 * an unmodified site preview at all (§4.2).
 */
/** The URL parameter carrying an inline payload (§4.1). */
const PAYLOAD_PARAM = "__cms_preview";
/** The URL parameter carrying a stash handle, for oversized payloads (§4.1). */
const PAYLOAD_REF_PARAM = "__cms_preview_ref";
/**
 * How stale a payload may be before a receiver refuses it.
 *
 * This bounds replay of a signed preview URL: a leaked link stops showing
 * unpublished content once it expires, rather than working forever.
 */
const DEFAULT_MAX_PAYLOAD_AGE_MS = 15 * 60 * 1000;

// The payload codec: JSON -> deflate -> base64url, and back.
//
// Compression is not a micro-optimization here. A draft is mostly prose and
// repeated frontmatter keys, which deflate reduces several-fold, and the
// difference decides whether a payload rides in the URL at all or has to take
// the stash detour (§4.1). Encoding stays synchronous — `fflate` is a sync
// implementation — because every caller is on a keystroke path.
const nodeBuffer = globalThis.Buffer;
function noBase64() {
    throw new Error("preview payload encoding needs either btoa/atob or Buffer, and this runtime has neither");
}
function base64ToBytes(b64) {
    if (typeof atob === "function") {
        const binary = atob(b64);
        const out = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++)
            out[i] = binary.charCodeAt(i);
        return out;
    }
    if (!nodeBuffer)
        noBase64();
    return new Uint8Array(nodeBuffer.from(b64, "base64"));
}
function fromBase64Url(s) {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    // atob and Buffer disagree about tolerating missing padding; pad for both.
    return b64 + "=".repeat((4 - (b64.length % 4)) % 4);
}
class PreviewDecodeError extends Error {
    constructor(message, options) {
        super(message);
        this.name = "PreviewDecodeError";
        this.cause = options?.cause;
    }
}
/**
 * Decode a payload.
 *
 * Throws PreviewDecodeError on anything malformed. Callers are decoding
 * attacker-reachable input — a URL parameter on a public page — so a thrown,
 * named error is the contract rather than a partially-populated object.
 */
function decodePayload(s) {
    let parsed;
    try {
        parsed = JSON.parse(strFromU8(inflateSync(base64ToBytes(fromBase64Url(s)))));
    }
    catch (cause) {
        throw new PreviewDecodeError("preview payload is not valid deflate+base64url JSON", { cause });
    }
    return assertPayload(parsed);
}
/**
 * Validate a decoded payload's shape.
 *
 * Exported because the postMessage path receives a structured-cloned object
 * rather than a string, and it must be checked just as hard: a message from an
 * allowed origin is still only as trustworthy as the code that sent it.
 */
function assertPayload(value) {
    const p = value;
    if (typeof p !== "object" || p === null) {
        throw new PreviewDecodeError("preview payload is not an object");
    }
    if (p.v !== 1) {
        throw new PreviewDecodeError(`unsupported preview payload version ${String(p.v)}`);
    }
    if (typeof p.repositoryId !== "string" || !p.repositoryId) {
        throw new PreviewDecodeError("preview payload has no repositoryId");
    }
    if (typeof p.issuedAt !== "number" || !Number.isFinite(p.issuedAt)) {
        throw new PreviewDecodeError("preview payload has no issuedAt");
    }
    if (!Array.isArray(p.overrides)) {
        throw new PreviewDecodeError("preview payload has no overrides array");
    }
    for (const o of p.overrides) {
        if (typeof o !== "object" || o === null) {
            throw new PreviewDecodeError("preview override is not an object");
        }
        const ov = o;
        if (typeof ov.id !== "string" || !ov.id) {
            throw new PreviewDecodeError("preview override has no id");
        }
        if (typeof ov.collection !== "string") {
            throw new PreviewDecodeError(`preview override ${ov.id} has no collection`);
        }
        if (typeof ov.path !== "string") {
            throw new PreviewDecodeError(`preview override ${ov.id} has no path`);
        }
        if (typeof ov.fields !== "object" || ov.fields === null) {
            throw new PreviewDecodeError(`preview override ${ov.id} has no fields object`);
        }
    }
    return p;
}
/** True when a payload is older than `maxAgeMs` relative to `now`. */
function isExpired(p, maxAgeMs, now = Date.now()) {
    return now - p.issuedAt > maxAgeMs;
}

// Payload integrity (§9.4).
//
// An unsigned `?__cms_preview=` is an open content-injection vector: the page
// renders whatever the parameter says a document contains, and drafts carry
// body HTML. Signing makes the payload something only the CMS can mint, and
// `issuedAt` bounds how long a leaked preview URL keeps working.
//
// HMAC-SHA256 over the *encoded* payload, via WebCrypto — present in browsers,
// in Node 16+ as `globalThis.crypto`, and in every edge runtime the SSR
// integrations target. That is why this module is async while codec.ts is not.
/** Separates the encoded payload from its signature: `<payload>.<sig>`. */
const SEP = ".";
function subtle() {
    const c = globalThis.crypto;
    if (!c?.subtle) {
        throw new Error("preview payload signing needs WebCrypto (globalThis.crypto.subtle), which this runtime does not provide");
    }
    return c.subtle;
}
async function hmacKey(secret) {
    return subtle().importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
/**
 * Verify and decode a signed payload.
 *
 * Throws PreviewDecodeError when the signature is absent, wrong, or the payload
 * has expired — one error type for every rejection, so a caller cannot
 * accidentally treat "bad signature" as recoverable and render the content
 * anyway.
 */
async function verifySigned(signed, secret, opts = {}) {
    const at = signed.lastIndexOf(SEP);
    if (at <= 0) {
        throw new PreviewDecodeError("preview payload is not signed");
    }
    const encoded = signed.slice(0, at);
    const hex = signed.slice(at + 1);
    if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2 !== 0) {
        throw new PreviewDecodeError("preview payload signature is malformed");
    }
    const sig = new Uint8Array(hex.length / 2);
    for (let i = 0; i < sig.length; i++)
        sig[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    // crypto.subtle.verify is the constant-time comparison; doing it here rather
    // than string-comparing the hex is what keeps this off the timing-oracle list.
    const ok = await subtle().verify("HMAC", await hmacKey(secret), sig, new TextEncoder().encode(encoded));
    if (!ok) {
        throw new PreviewDecodeError("preview payload signature does not verify");
    }
    const payload = decodePayload(encoded);
    const maxAge = opts.maxAgeMs ?? DEFAULT_MAX_PAYLOAD_AGE_MS;
    if (isExpired(payload, maxAge, opts.now)) {
        throw new PreviewDecodeError("preview payload has expired");
    }
    return payload;
}

// Server-side preview plumbing, shared by every SSR framework integration.
//
// §8.2 and §8.4 describe Astro, Next, Nuxt and SvelteKit as four integrations.
// They are four *adapters* over one piece of logic: read a signed payload from
// the request, refuse it if it does not verify, put it where data loaders can
// reach it, and make certain the response is never cached. Writing that four
// times is how the ISR cache-bypass rule gets forgotten in three of them — and
// skipping it produces the worst bug in this whole document: a preview that
// shows stale content intermittently, which reads as "preview is broken" and is
// untraceable.
//
// So the logic lives here once, and each framework package is the ~40 lines
// that adapt its own request and response objects to it.
/** The cookie a preview payload is parked in after the first request. */
const PREVIEW_COOKIE = "__cms_preview";
/**
 * Resolve the preview payload for one request.
 *
 * Returns "rejected" rather than throwing, and rejected is *not* the same as
 * "none": a page that fails to verify a payload must render published content
 * and say so, not silently behave as though nobody asked for a preview.
 */
async function resolvePreview(url, cookies, opts = {}) {
    const inline = url.searchParams.get(PAYLOAD_PARAM);
    const handle = url.searchParams.get(PAYLOAD_REF_PARAM);
    const cookie = cookies[PREVIEW_COOKIE];
    let encoded = inline;
    if (!encoded && handle) {
        if (!opts.resolveStash) {
            return { status: "rejected", reason: "a stash handle arrived but no resolveStash was configured" };
        }
        try {
            encoded = await opts.resolveStash(handle);
        }
        catch (err) {
            return { status: "rejected", reason: `could not resolve the preview stash: ${String(err)}` };
        }
    }
    if (!encoded)
        encoded = cookie ?? null;
    if (!encoded)
        return { status: "none" };
    try {
        const payload = opts.secret
            ? await verifySigned(encoded, opts.secret, { maxAgeMs: opts.maxAgeMs, now: opts.now })
            : unsignedFallback(encoded, opts);
        return { status: "ok", payload: await payload, encoded };
    }
    catch (err) {
        const reason = err instanceof PreviewDecodeError ? err.message : String(err);
        return { status: "rejected", reason };
    }
}
/**
 * Decode without verifying — only when no secret is configured.
 *
 * Deliberately noisy: an unsigned preview is fine on a developer's laptop and
 * is a vulnerability anywhere else, and the difference is invisible unless
 * something says so.
 */
async function unsignedFallback(encoded, opts) {
    const payload = decodePayload(encoded);
    const maxAge = opts.maxAgeMs ?? DEFAULT_MAX_PAYLOAD_AGE_MS;
    if ((opts.now ?? Date.now()) - payload.issuedAt > maxAge) {
        throw new PreviewDecodeError("preview payload has expired");
    }
    console.warn("[cms-preview] accepting an UNSIGNED preview payload because no secret is configured. " +
        "Set one before deploying: an unsigned payload lets anyone inject content into this page.");
    return payload;
}
/**
 * Headers every preview response must carry.
 *
 * This is the ISR rule (§8.2/§8.4.3): a preview request must never be served
 * from, or written to, an on-demand rendering cache. `no-store` is the part
 * browsers and CDNs honour; the framework-specific revalidate/route-rule
 * opt-outs are in each adapter.
 */
function previewHeaders() {
    return {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        // Two shared caches that ignore Cache-Control on their own.
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
        Pragma: "no-cache",
    };
}
/**
 * Attributes for the cookie the payload is parked in.
 *
 * `SameSite=None` because the preview is loaded in an iframe on the CMS's
 * origin, and a Lax cookie is not sent on that subresource navigation — the
 * preview would work once from the URL and then lose the draft on the first
 * in-site link click. None requires Secure, which is why localhost gets Lax
 * instead (browsers refuse Secure cookies over plain http on some setups).
 */
function cookieOptions(url, maxAgeMs = DEFAULT_MAX_PAYLOAD_AGE_MS) {
    const secure = url.protocol === "https:";
    return {
        httpOnly: true,
        sameSite: secure ? "none" : "lax",
        secure,
        path: "/",
        maxAge: Math.floor(maxAgeMs / 1000),
    };
}
/** Serialize the cookie for a raw `Set-Cookie` header. */
function serializeCookie(value, o) {
    const parts = [
        `${PREVIEW_COOKIE}=${encodeURIComponent(value)}`,
        `Path=${o.path}`,
        `Max-Age=${o.maxAge}`,
        `SameSite=${o.sameSite === "none" ? "None" : o.sameSite === "lax" ? "Lax" : "Strict"}`,
    ];
    if (o.httpOnly)
        parts.push("HttpOnly");
    if (o.secure)
        parts.push("Secure");
    return parts.join("; ");
}
/** Parse a Cookie header into a plain record. */
function parseCookies(header) {
    const out = {};
    if (!header)
        return out;
    for (const part of header.split(";")) {
        const eq = part.indexOf("=");
        if (eq < 0)
            continue;
        out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
    }
    return out;
}

// Astro integration (§8.2).
//
// Astro is three answers under one name and the preview must handle whichever
// a route turns out to be:
//
//   SSG  — content collections run at build time, so there is nothing to
//          intercept: this is the sidecar's case, and the manifest below is
//          what the sidecar runs. `astro dev` rather than looping `astro build`,
//          because Astro's dev server is Vite and already gives fine-grained
//          HMR — the "keep state and scroll" behaviour done properly by the
//          framework instead of by DOM morphing.
//   SSR  — content is fetched per request in .astro frontmatter, which is
//          ordinary server-side JS, so the middleware below puts the draft on
//          Astro.locals and preview-graphql picks it up. First paint is already
//          correct because the server saw the draft.
//   ISR  — identical to SSR for one request, plus the rule that makes it work:
//          a preview response is never served from or written to the cache.
//
// Islands collapse back to the SPA case: they hydrate after SSR and the same
// postMessage runtime patches them live on top of server-rendered HTML. That is
// why preview-core's runtime is isomorphic.
/**
 * `export const onRequest = previewMiddleware({ secret })` in src/middleware.ts.
 */
function previewMiddleware(options = {}) {
    return async (context, next) => {
        const cookies = parseCookies(context.request.headers.get("cookie"));
        const resolved = await resolvePreview(context.url, cookies, options);
        if (resolved.status === "none") {
            context.locals.preview = null;
            return next();
        }
        if (resolved.status === "rejected") {
            // Published content, and a header saying why — not a silent fallthrough
            // that looks like a working preview of the wrong thing.
            context.locals.preview = null;
            context.locals.previewRejected = resolved.reason;
            const res = await next();
            res.headers.set("X-Cms-Preview", "rejected");
            res.headers.set("X-Cms-Preview-Reason", resolved.reason);
            return res;
        }
        context.locals.preview = resolved.payload;
        const res = await next();
        // Park the payload so in-site navigation keeps the draft without the URL
        // carrying it on every link.
        if (!cookies[PREVIEW_COOKIE]) {
            res.headers.append("Set-Cookie", serializeCookie(resolved.encoded, cookieOptions(context.url, options.maxAgeMs)));
        }
        for (const [k, v] of Object.entries(previewHeaders()))
            res.headers.set(k, v);
        res.headers.set("X-Cms-Preview", "active");
        return res;
    };
}
/**
 * An entry route (`src/pages/api/preview.ts`) that parks the payload and
 * redirects to the document's URL.
 *
 * The CMS iframe loads this first when the payload is too large to inline, and
 * it is also the "enter preview mode" link a share-a-preview flow would use.
 */
function previewEntryRoute(options = {}) {
    return async ({ request, url }) => {
        const resolved = await resolvePreview(url, parseCookies(request.headers.get("cookie")), options);
        if (resolved.status !== "ok") {
            return new Response(resolved.status === "rejected" ? `preview rejected: ${resolved.reason}` : "no preview payload", { status: 400, headers: previewHeaders() });
        }
        const to = url.searchParams.get("redirect") ?? "/";
        // Only same-origin redirects: an open redirect here would be reachable from
        // any page that can link to this route.
        const target = to.startsWith("/") && !to.startsWith("//") ? to : "/";
        return new Response(null, {
            status: 307,
            headers: {
                ...previewHeaders(),
                Location: target,
                "Set-Cookie": serializeCookie(resolved.encoded, cookieOptions(url, options.maxAgeMs)),
            },
        });
    };
}
/** Clear preview mode. */
function exitPreviewRoute() {
    return async () => new Response(null, {
        status: 307,
        headers: { ...previewHeaders(), Location: "/", "Set-Cookie": `${PREVIEW_COOKIE}=; Path=/; Max-Age=0` },
    });
}

export { previewEntryRoute as a, exitPreviewRoute as e, previewMiddleware as p };
