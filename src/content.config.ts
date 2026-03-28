import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const churches = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/churches' }),
  schema: z.object({
    title: z.string(),
    address: z.string(),
    serviceTime: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.enum(['announcement', 'news', 'reflection', 'general']),
    church: z.enum(['morell', 'mount-stewart', 'st-peters-bay', 'all']).default('all'),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const banner = defineCollection({
  loader: glob({ pattern: 'banner.md', base: './src/content' }),
  schema: z.object({
    enabled: z.boolean().default(false),
    link: z.string().url().optional(),
  }),
});

const schedules = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/schedules' }),
  schema: z.object({
    church: z.enum(['morell', 'mount-stewart', 'st-peters-bay']),
    type: z.enum(['greeter', 'reader', 'cleaner']),
    entries: z.array(
      z.object({
        date: z.string(), // ISO date string YYYY-MM-DD
        name: z.string(),
      })
    ),
  }),
});

export const collections = { churches, articles, schedules, banner };

