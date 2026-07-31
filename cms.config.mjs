// Go·Git CMS editor configuration, written by `gitcms-ide init`.
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
      "@go-git-cms/preview",
      {
        baseUrl: process.env.CMS_PREVIEW_BASE_URL || "http://localhost:4321",
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
