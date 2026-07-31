// The page half of the CMS preview protocol, loaded only when a preview is
// active (see BaseLayout). Without it the editor never hears `cms:ready`, so
// it neither streams drafts nor reloads the frame — edits appear frozen.
//
// This site is server-rendered, so a draft is "applied" by re-requesting the
// page with the new payload in the URL: the middleware picks it up and SSR
// paints it. We declare liveOverrides so the editor leaves reloading to us —
// otherwise it would issue its own reload of the *old* URL and every edit
// would paint twice. The runtime's scroll restore keeps the position across
// these navigations.

import {
  registerPreview,
  encodePayload,
  decodePayload,
  PAYLOAD_PARAM,
} from '@go-git-cms/preview-core';

// The newest draft already rendered. Seeded from the URL payload so the
// initial `onDraft` replay of it doesn't trigger a reload loop.
let lastIssuedAt = 0;
const inline = new URLSearchParams(window.location.search).get(PAYLOAD_PARAM);
if (inline) {
  try {
    lastIssuedAt = decodePayload(inline).issuedAt;
  } catch {
    // Malformed param — the runtime reports it; treat as no baseline.
  }
}

let pending: number | undefined;

registerPreview({
  // The editor is served from this site's own /admin, so its origin is ours.
  allowedOrigins: [window.location.origin],
  capabilities: { liveOverrides: true },
  onDraft(payload) {
    if (!payload || payload.issuedAt <= lastIssuedAt) return;
    lastIssuedAt = payload.issuedAt;
    const url = new URL(window.location.href);
    url.searchParams.set(PAYLOAD_PARAM, encodePayload(payload));
    // Debounce: keystrokes arrive faster than a round trip; render the latest.
    if (pending) clearTimeout(pending);
    pending = window.setTimeout(() => window.location.replace(url.toString()), 150);
  },
});
