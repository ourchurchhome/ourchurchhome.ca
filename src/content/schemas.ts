/**
 * src/content/schemas.ts
 *
 * Single source of truth for all Astro content collection Zod schemas.
 *
 * Imported by two consumers:
 *   1. src/content.config.ts  — passes schemas into defineCollection so Astro
 *      can validate content at build time (unchanged external behaviour).
 *   2. src/cms/lib/schema-fields.ts — introspects schemas at runtime to
 *      auto-generate the CMS editor field configuration.
 *
 * NEVER import from 'astro:content' here — this file must be importable
 * outside of Astro's build pipeline (e.g. in SSR route handlers and React
 * components running in the browser).
 */

import { z } from 'zod';

export const churchesSchema = z.object({
  title: z.string(),
  address: z.string(),
  serviceTime: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const articlesSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.enum(['announcement', 'news', 'reflection', 'general']),
  church: z.enum(['morell', 'mount-stewart', 'st-peters-bay', 'all']).default('all'),
  description: z.string().optional(),
  draft: z.boolean().default(false),
});

export const bannerSchema = z.object({
  enabled: z.boolean().default(false),
  link: z.string().url().optional(),
});

export const schedulesSchema = z.object({
  church: z.enum(['morell', 'mount-stewart', 'st-peters-bay']),
  type: z.enum(['greeter', 'reader', 'cleaner']),
  entries: z.array(
    z.object({
      date: z.string(), // ISO date string YYYY-MM-DD
      name: z.string(),
    })
  ),
});

/**
 * Registry mapping each collection name to its Zod schema.
 * The CMS uses this to look up the right schema by collection slug.
 * Keep this in sync with the `collections` export in src/content.config.ts.
 */
export const collectionSchemas = {
  churches: churchesSchema,
  articles: articlesSchema,
  banner: bannerSchema,
  schedules: schedulesSchema,
} as const;

export type CollectionName = keyof typeof collectionSchemas;

