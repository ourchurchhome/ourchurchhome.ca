/**
 * src/cms/lib/resolve-config.ts
 *
 * Merges the user-facing cms.config.ts with Zod-introspected field data to
 * produce an array of ResolvedCollection objects consumed by all CMS pages.
 */

import type { CmsConfig, ResolvedCollection } from '../config';
import { getFieldsForCollection } from './schema-fields';
import { COLLECTION_PATHS, COLLECTION_EXTENSIONS, collectionLabel } from './content';
import { collectionSchemas, type CollectionName } from '../../content/schemas';

export function resolveCollections(config: CmsConfig): ResolvedCollection[] {
  const known = Object.keys(collectionSchemas) as CollectionName[];
  const isDev = import.meta.env.DEV;

  return known.flatMap((name) => {
    const cc = config.collections[name] ?? {};

    // Hide development-only collections when not in dev mode.
    if (cc.development && !isDev) return [];

    const fields = getFieldsForCollection(name, cc.fields ?? {});

    const singleton = cc.singleton ?? false;
    return {
      name,
      label: collectionLabel(name),
      singleton,
      allowCreate: cc.allowCreate ?? true,
      allowDelete: cc.allowDelete ?? true,
      // Singletons can never be renamed (their slug is the collection name).
      // For regular collections, default to true unless explicitly disabled.
      allowRename: singleton ? false : (cc.allowRename ?? true),
      icon: cc.icon ?? (singleton ? '📄' : '📂'),
      previewUrl: cc.previewUrl,
      fields,
      fileExtension: COLLECTION_EXTENSIONS[name] ?? 'md',
      basePath: COLLECTION_PATHS[name] ?? `src/content/${name}`,
    };
  });
}


