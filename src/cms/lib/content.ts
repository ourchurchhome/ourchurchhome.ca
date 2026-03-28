/**
 * src/cms/lib/content.ts
 *
 * Frontmatter parsing/serialization and collection path helpers.
 * Uses gray-matter for robust YAML frontmatter handling.
 */

import matter from 'gray-matter';

export interface ParsedContent {
  frontmatter: Record<string, unknown>;
  body: string;
  /** The GitHub blob SHA of the source file — required when calling putFile to update */
  sha: string;
}

/** Parse a raw markdown string (with YAML frontmatter) into structured data. */
export function parseMarkdown(raw: string, sha: string): ParsedContent {
  const { data, content } = matter(raw);
  return { frontmatter: data, body: content.trim(), sha };
}

/** Serialize frontmatter + markdown body back to a complete .md file string. */
export function serializeMarkdown(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  return matter.stringify(body, frontmatter);
}

/** Parse a raw JSON file into structured data. */
export function parseJson(raw: string, sha: string): ParsedContent {
  return { frontmatter: JSON.parse(raw) as Record<string, unknown>, body: '', sha };
}

/** Serialize structured data back to a formatted JSON string. */
export function serializeJson(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2) + '\n';
}

// ---------------------------------------------------------------------------
// Collection registry — maps collection slug → filesystem info
// Keep in sync with src/content.config.ts
// ---------------------------------------------------------------------------

/** Path (from repo root) to the directory containing collection files. */
export const COLLECTION_PATHS: Record<string, string> = {
  churches: 'src/content/churches',
  articles: 'src/content/articles',
  schedules: 'src/content/schedules',
  banner: 'src/content',
  homepage: 'src/content',
  'kitchen-sink': 'src/content',
};

/** File extension used by each collection. */
export const COLLECTION_EXTENSIONS: Record<string, 'md' | 'json'> = {
  churches: 'md',
  articles: 'md',
  schedules: 'json',
  banner: 'md',
  homepage: 'json',
  'kitchen-sink': 'md',
};

/** Human-readable label for a collection slug. Handles kebab-case and camelCase. */
export function collectionLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Build the repo-relative file path for a collection item.
 * e.g. itemPath('articles', 'my-post') → 'src/content/articles/my-post.md'
 */
export function itemPath(collection: string, slug: string): string {
  const dir = COLLECTION_PATHS[collection] ?? `src/content/${collection}`;
  const ext = COLLECTION_EXTENSIONS[collection] ?? 'md';
  return `${dir}/${slug}.${ext}`;
}

/**
 * Extract the slug from a filename.
 * e.g. 'my-post.md' → 'my-post'
 */
export function slugFromFilename(filename: string): string {
  return filename.replace(/\.(md|mdx|json)$/, '');
}

