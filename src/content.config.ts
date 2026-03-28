import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  churchesSchema,
  articlesSchema,
  bannerSchema,
  schedulesSchema,
  homepageSchema,
} from './content/schemas';

// Schemas live in src/content/schemas.ts so they can be imported by both
// Astro's build pipeline (here) and the CMS's schema introspection utilities
// (src/cms/lib/schema-fields.ts) without pulling in astro:content.

const churches = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/churches' }),
  schema: churchesSchema,
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: articlesSchema,
});

const banner = defineCollection({
  loader: glob({ pattern: 'banner.md', base: './src/content' }),
  schema: bannerSchema,
});

const schedules = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/schedules' }),
  schema: schedulesSchema,
});

const homepage = defineCollection({
  loader: glob({ pattern: 'homepage.json', base: './src/content' }),
  schema: homepageSchema,
});

export const collections = { churches, articles, schedules, banner, homepage };

