// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // SSR (Vercel draft mode): every page renders per request so the CMS preview
  // middleware can apply drafts. Public traffic is still served from Vercel's
  // ISR cache (configured below); only preview visitors bypass it.
  output: 'server',
  adapter: vercel({
    isr: {
      bypassToken: process.env.ISR_SECRET || import.meta.env.ISR_SECRET,
      // Draft-mode routes must always run: /api/preview sets the bypass +
      // preview cookies and redirects; a cached copy would strip the draft.
      exclude: ['/api/preview', '/api/preview/exit'],
    },
  }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // The @go-git-cms preview packages ship ESM with extensionless relative
      // imports, which Node can't resolve when they're externalized — bundle
      // them so Vite resolves the imports instead.
      noExternal: [/^@go-git-cms\/preview-/],
    },
  },
});