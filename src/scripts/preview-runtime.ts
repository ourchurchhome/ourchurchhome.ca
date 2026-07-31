// The page half of the CMS preview protocol, loaded only when a preview is
// active (see BaseLayout). Without it the editor never hears `cms:ready`, so
// it neither streams drafts nor reloads the frame — edits appear frozen.
//
// This site is server-rendered, so a draft is "applied" by re-requesting the
// page through /api/preview, which re-parks the payload in the __cms_preview
// cookie and redirects back here. The cookie — not a page-URL query param —
// must carry the draft on Vercel: the adapter's internal rewrite
// (?x_astro_path=...) drops the original query string before the middleware
// sees it, so a payload on the page URL renders stale in production.
//
// We declare liveOverrides so the editor leaves reloading to us — otherwise
// it would issue its own reload of the old URL and every edit would paint
// twice. The runtime's scroll restore keeps the position across navigations.

import {
  registerPreview,
  encodePayload,
  decodePayload,
  PAYLOAD_PARAM,
} from '@go-git-cms/preview-core';

// Matches PAYLOAD_KEY in preview-core's runtime: where the last live draft is
// kept for reloads. We read it to baseline what SSR has already rendered.
const SESSION_PAYLOAD_KEY = '__cms_preview_payload';

// The newest draft already rendered, so replays of it (the runtime re-applies
// the URL/sessionStorage payload on every load) don't trigger a reload loop.
let lastIssuedAt = 0;
try {
  const inline = new URLSearchParams(window.location.search).get(PAYLOAD_PARAM);
  if (inline) lastIssuedAt = decodePayload(inline).issuedAt;
} catch {
  // Malformed param — the runtime reports it; treat as no baseline.
}
try {
  const stored = window.sessionStorage.getItem(SESSION_PAYLOAD_KEY);
  if (stored) {
    const issuedAt = (JSON.parse(stored) as { issuedAt?: number }).issuedAt ?? 0;
    if (issuedAt > lastIssuedAt) lastIssuedAt = issuedAt;
  }
} catch {
  // sessionStorage unavailable or stale JSON — no baseline.
}

let pending: number | undefined;

registerPreview({
  // The editor is served from this site's own /admin, so its origin is ours.
  allowedOrigins: [window.location.origin],
  capabilities: { liveOverrides: true },
  onDraft(payload) {
    if (!payload || payload.issuedAt <= lastIssuedAt) return;
    lastIssuedAt = payload.issuedAt;
    const target = new URL('/api/preview', window.location.origin);
    target.searchParams.set('redirect', window.location.pathname);
    target.searchParams.set(PAYLOAD_PARAM, encodePayload(payload));
    // Debounce: keystrokes arrive faster than a round trip; render the latest.
    if (pending) clearTimeout(pending);
    pending = window.setTimeout(() => window.location.replace(target.toString()), 150);
  },
});
