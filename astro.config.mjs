// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Hybrid mode: public pages stay prerendered (default).
  // CMS pages opt out individually with: export const prerender = false
  // The Vercel adapter deploys those pages as Node.js serverless functions.
  output: 'static',
  adapter: vercel(),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});