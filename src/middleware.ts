import { previewMiddleware } from '@go-git-cms/preview-astro';

// CMS draft mode (SSR). Verifies the signed preview payload from the editor,
// puts it on Astro.locals.preview, parks it in the __cms_preview cookie so
// in-site navigation keeps the draft, and sets the cache headers that keep a
// preview response out of every cache (including Vercel's CDN cache).
//
// CMS_PREVIEW_SECRET must match the value the CMS signs payloads with. When it
// is unset (local dev) unsigned payloads are accepted, with a console warning.
export const onRequest = previewMiddleware({
  secret: import.meta.env.CMS_PREVIEW_SECRET,
});
