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

  return known.map((name) => {
    const cc = config.collections[name] ?? {};
    const fields = getFieldsForCollection(name, cc.fields ?? {});

    return {
      name,
      label: collectionLabel(name),
      singleton: cc.singleton ?? false,
      allowCreate: cc.allowCreate ?? true,
      allowDelete: cc.allowDelete ?? true,
      fields,
      fileExtension: COLLECTION_EXTENSIONS[name] ?? 'md',
      basePath: COLLECTION_PATHS[name] ?? `src/content/${name}`,
    };
  });
}

