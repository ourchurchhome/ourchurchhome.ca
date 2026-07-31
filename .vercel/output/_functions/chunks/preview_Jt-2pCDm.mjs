import { z } from 'zod';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

const churchesSchema = z.object({
  title: z.string(),
  address: z.string(),
  serviceTime: z.string(),
  description: z.string().optional(),
  image: z.string().optional()
});
const articlesSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.enum(["announcement", "news", "reflection", "general"]),
  church: z.enum(["morell", "mount-stewart", "st-peters-bay", "all"]).default("all"),
  description: z.string().optional(),
  draft: z.boolean().default(false)
});
const bannerSchema = z.object({
  enabled: z.boolean().default(false),
  link: z.string().url().optional()
});
z.object({
  church: z.enum(["morell", "mount-stewart", "st-peters-bay"]),
  type: z.enum(["greeter", "reader", "cleaner"]),
  entries: z.array(
    z.object({
      date: z.string(),
      // ISO date string YYYY-MM-DD
      name: z.string()
    })
  )
});
z.object({
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
  status: z.enum(["draft", "review", "published"]).default("draft"),
  /** TagInput — array of strings */
  tags: z.array(z.string()).optional(),
  // ── Complex field types ──────────────────────────────────────────────────
  /** Group — nested object; auto-selects Group control */
  author: z.object({
    name: z.string(),
    /** TextArea — multiline hint key ("bio") */
    bio: z.string().optional()
  }).optional(),
  /** Table — array of all-scalar objects; auto-selects Table control */
  tableDemo: z.array(z.object({
    label: z.string(),
    value: z.string()
  })).optional(),
  /** Repeater — array of objects; overridden to Repeater in cms.config.ts */
  sections: z.array(z.object({
    heading: z.string(),
    /** TextArea — multiline hint key ("content") */
    content: z.string().optional(),
    featured: z.boolean().optional()
  })).optional(),
  /**
   * Widgets — discriminated union array; requires component: 'Widgets' override.
   * Two variants: 'callout' (text alert box) and 'image' (image with caption).
   */
  widgets: z.array(z.discriminatedUnion("type", [
    z.object({
      type: z.literal("callout"),
      heading: z.string(),
      body: z.string().optional(),
      tone: z.enum(["info", "warning", "success"]).default("info")
    }),
    z.object({
      type: z.literal("image"),
      url: z.string().url(),
      caption: z.string().optional(),
      fullWidth: z.boolean().default(false)
    })
  ])).optional()
});
const homepageSchema = z.object({
  widgets: z.array(z.discriminatedUnion("type", [
    // ── Hero ─────────────────────────────────────────────────────────────────
    z.object({
      type: z.literal("hero"),
      title: z.string(),
      subtitle: z.string().optional(),
      image: z.string().optional(),
      buttons: z.array(z.object({
        primary: z.boolean().default(false),
        copy: z.string(),
        url: z.string()
      })).optional()
    }),
    // ── News & Updates ───────────────────────────────────────────────────────
    z.object({
      type: z.literal("news"),
      title: z.string(),
      subtitle: z.string().optional()
    }),
    // ── Our Shared Vision ────────────────────────────────────────────────────
    z.object({
      type: z.literal("vision"),
      title: z.string(),
      body: z.string().optional(),
      quote: z.string().optional(),
      communityCount: z.number().optional(),
      yearsOfGrace: z.string().optional(),
      ctaTitle: z.string().optional(),
      ctaDescription: z.string().optional()
    }),
    // ── Churches ─────────────────────────────────────────────────────────────
    z.object({
      type: z.literal("churches"),
      title: z.string(),
      subtitle: z.string().optional()
    })
  ])).optional()
});

const normalize = (p) => p.replace(/^\.\//, "").replace(/^\//, "");
function overrideForEntry(preview, entry) {
  if (!preview || !entry?.filePath) return null;
  const fp = normalize(entry.filePath);
  return preview.overrides.find((o) => {
    const p = normalize(o.path);
    return p === fp || fp.endsWith(`/${p}`) || p.endsWith(`/${fp}`);
  }) ?? null;
}
function createdOverrideFor(preview, base, route) {
  if (!preview || !route) return null;
  const prefix = `${normalize(base)}/`;
  return preview.overrides.find((o) => {
    if (!o.created) return false;
    const p = normalize(o.path);
    if (!p.startsWith(prefix)) return false;
    return p.slice(prefix.length).replace(/\.(md|mdx|markdown|json)$/, "") === route;
  }) ?? null;
}
function mergeDraftData(schema, published, ov) {
  const parsed = schema.safeParse({ ...published, ...ov.fields });
  return parsed.success ? parsed.data : published;
}
let processor;
async function renderDraftMarkdown(md) {
  processor ??= createMarkdownProcessor();
  const { code } = await (await processor).render(md);
  return code;
}

export { articlesSchema as a, churchesSchema as b, createdOverrideFor as c, bannerSchema as d, homepageSchema as h, mergeDraftData as m, overrideForEntry as o, renderDraftMarkdown as r };
