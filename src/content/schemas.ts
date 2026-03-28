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
 * Kitchen-sink schema — development-only collection that exercises every
 * available CMS field type and control. Registered in cms.config.ts with
 * `development: true` so it is hidden in production.
 */
export const kitchenSinkSchema = z.object({
  // ── Scalar field types ───────────────────────────────────────────────────
  /** TextInput — plain string */
  title: z.string(),
  /** TextInput — optional string */
  subtitle: z.string().optional(),
  /** TextArea — multiline hint key ("description") */
  description: z.string().optional(),
  /** NumberInput */
  order: z.number().optional(),
  /** Toggle */
  active: z.boolean().default(false),
  /** DatePicker */
  publishedAt: z.coerce.date().optional(),
  /** UrlInput — z.string().url() */
  website: z.string().url().optional(),
  /** EmailInput — z.string().email() */
  contactEmail: z.string().email().optional(),
  /** Select — z.enum([...]) */
  status: z.enum(['draft', 'review', 'published']).default('draft'),
  /** TagInput — array of strings */
  tags: z.array(z.string()).optional(),
  // ── Complex field types ──────────────────────────────────────────────────
  /** Group — nested object; auto-selects Group control */
  author: z.object({
    name: z.string(),
    /** TextArea — multiline hint key ("bio") */
    bio: z.string().optional(),
  }).optional(),
  /** Table — array of all-scalar objects; auto-selects Table control */
  tableDemo: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  /** Repeater — array of objects; overridden to Repeater in cms.config.ts */
  sections: z.array(z.object({
    heading: z.string(),
    /** TextArea — multiline hint key ("content") */
    content: z.string().optional(),
    featured: z.boolean().optional(),
  })).optional(),
  /**
   * Widgets — discriminated union array; requires component: 'Widgets' override.
   * Two variants: 'callout' (text alert box) and 'image' (image with caption).
   */
  widgets: z.array(z.discriminatedUnion('type', [
    z.object({
      type: z.literal('callout'),
      heading: z.string(),
      body: z.string().optional(),
      tone: z.enum(['info', 'warning', 'success']).default('info'),
    }),
    z.object({
      type: z.literal('image'),
      url: z.string().url(),
      caption: z.string().optional(),
      fullWidth: z.boolean().default(false),
    }),
  ])).optional(),
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
  'kitchen-sink': kitchenSinkSchema,
} as const;

export type CollectionName = keyof typeof collectionSchemas;

