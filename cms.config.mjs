// Go·Git CMS editor configuration, written by `gitcms-ide init`.

/**
 * The origin the preview iframe is loaded from.
 *
 * It must be the site's *canonical* host. The editor pins its postMessage
 * handshake to the origin of this URL in both directions — it only accepts
 * `cms:ready` from that origin, and only posts drafts to it. Vercel 308s the
 * apex (ourchurchhome.ca) to www, so a preview started on the apex lands on a
 * different origin than the one the editor is listening to: the handshake
 * never completes, `ready()` stays false, and every draft after the initial
 * page load is queued and dropped. The symptom is a preview that renders once
 * and then never updates.
 *
 * Normalized here rather than trusted from the environment, because that is
 * exactly how it broke: CMS_PREVIEW_BASE_URL was set to the apex.
 */
const previewBaseUrl = process.env.NODE_ENV === "production" ?
  "https://ourchurchhome.ca" :
  "http://localhost:4321"

export default {
  API_URL: "https://app.gogitcms.com",
  WORKSPACE_ID: "b64fbd72-5dc7-407f-9198-d15ec8b08dda",
  REPOSITORY_ID: "b6aee015-69a9-4b81-83bf-2a92dcfc997f",

  // Path this editor is served from. Use a subpath (e.g. "/cms/") when it
  // is mounted under one — assets and in-app URLs are both built from it.
  BASE_PATH: "/admin",
  plugins: [
    // Draft-mode preview (SSR): the site itself renders the draft. URLs go
    // through /api/preview, which verifies the payload, sets the Vercel ISR
    // bypass + preview cookies, and redirects to the page.
    [
      "@gogitcms/preview",
      {
        baseUrl: previewBaseUrl,
        collections: {
          articles: '/api/preview?redirect=/articles/{{{route path "src/content/articles"}}}',
          churches: '/api/preview?redirect=/churches/{{{route path "src/content/churches"}}}',
          homepage: '/api/preview?redirect=/',
          banner: '/api/preview?redirect=/',
        },
        label: "Preview",
      },
    ],
  ]
};
