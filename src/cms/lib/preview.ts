// Helpers for rendering CMS draft previews on SSR pages.
//
// The middleware (src/middleware.ts) puts the verified preview payload on
// Astro.locals.preview. A payload carries overrides — the in-flight values of
// the documents being edited, keyed by repo-relative file path. These helpers
// match an override to a content collection entry and compose the draft on top
// of the published values.

import type { PreviewOverride, PreviewPayload } from '@go-git-cms/preview-core';
import { createMarkdownProcessor, type MarkdownRenderer } from '@astrojs/markdown-remark';
import type { z } from 'zod';

type ContentEntry = {
  id: string;
  data: Record<string, unknown>;
  /** Project-root-relative path, set by the glob loader. */
  filePath?: string;
};

const normalize = (p: string) => p.replace(/^\.\//, '').replace(/^\//, '');

/** The override targeting this collection entry, matched by file path. */
export function overrideForEntry(
  preview: PreviewPayload | null | undefined,
  entry: ContentEntry | undefined
): PreviewOverride | null {
  if (!preview || !entry?.filePath) return null;
  const fp = normalize(entry.filePath);
  return (
    preview.overrides.find((o) => {
      const p = normalize(o.path);
      return p === fp || fp.endsWith(`/${p}`) || p.endsWith(`/${fp}`);
    }) ?? null
  );
}

/**
 * The override for a document the draft *creates* — one that exists in no
 * commit yet, so there is no collection entry to match. Matched by the route
 * segment its path would produce: `base` is the collection's content directory
 * and `route` the URL param (e.g. "my-new-article").
 */
export function createdOverrideFor(
  preview: PreviewPayload | null | undefined,
  base: string,
  route: string | undefined
): PreviewOverride | null {
  if (!preview || !route) return null;
  const prefix = `${normalize(base)}/`;
  return (
    preview.overrides.find((o) => {
      if (!o.created) return false;
      const p = normalize(o.path);
      if (!p.startsWith(prefix)) return false;
      return p.slice(prefix.length).replace(/\.(md|mdx|markdown|json)$/, '') === route;
    }) ?? null
  );
}

/**
 * Compose an override's fields over an entry's published data and re-validate.
 *
 * Draft values arrive raw (dates as strings, half-typed URLs), so the merged
 * object goes back through the collection schema — which is why the schemas
 * use z.coerce.date(). An invalid draft falls back to the published data:
 * mid-keystroke states should degrade, not crash the preview.
 */
export function mergeDraftData<S extends z.ZodTypeAny>(
  schema: S,
  published: z.infer<S>,
  ov: PreviewOverride
): z.infer<S> {
  const parsed = schema.safeParse({ ...(published as Record<string, unknown>), ...ov.fields });
  return parsed.success ? parsed.data : published;
}

let processor: Promise<MarkdownRenderer> | undefined;

/** Render a draft markdown body at request time (drafts bypass the build). */
export async function renderDraftMarkdown(md: string): Promise<string> {
  processor ??= createMarkdownProcessor();
  const { code } = await (await processor).render(md);
  return code;
}
