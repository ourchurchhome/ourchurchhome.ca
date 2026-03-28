/**
 * src/cms/lib/local-persistence.ts
 *
 * Local-filesystem persistence service.
 * Reads and writes files directly on the local working tree — no GitHub
 * credentials required. Useful for offline development.
 *
 * Set CMS_PERSISTENCE=local in your .env to activate this backend.
 *
 * The "sha" field used by the interface is a SHA-1 hex digest of the file's
 * UTF-8 content. It serves the same conflict-detection purpose as the GitHub
 * blob SHA but is computed locally.
 */

import { readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import type { IPersistenceService, PersistenceItem, PersistenceEntry } from './persistence';

/** Absolute path to the repository root (where the Astro project lives). */
const REPO_ROOT = resolve('.');

function sha1(content: string): string {
  return createHash('sha1').update(content, 'utf8').digest('hex');
}

function absPath(repoRelative: string): string {
  return join(REPO_ROOT, repoRelative);
}

export class LocalPersistence implements IPersistenceService {
  /** Read a single file from the local working tree. */
  async readItem(filePath: string): Promise<PersistenceItem> {
    const abs = absPath(filePath);
    const content = await readFile(abs, 'utf8');
    return { content, sha: sha1(content) };
  }

  /**
   * Write (create or overwrite) a file on the local working tree.
   * The `message` and `sha` parameters are accepted for interface compatibility
   * but are not used — the local backend does not perform conflict detection.
   */
  async writeItem(
    filePath: string,
    content: string,
    _message: string,
    _sha?: string,
  ): Promise<{ sha: string }> {
    const abs = absPath(filePath);
    await writeFile(abs, content, 'utf8');
    return { sha: sha1(content) };
  }

  /** Delete a file from the local working tree. */
  async deleteItem(filePath: string, _sha: string, _message: string): Promise<void> {
    const abs = absPath(filePath);
    await unlink(abs);
  }

  /** List the entries inside a directory on the local working tree. */
  async listItems(dir: string): Promise<PersistenceEntry[]> {
    const abs = absPath(dir);
    if (!existsSync(abs)) return [];

    const names = await readdir(abs);
    const entries: PersistenceEntry[] = [];

    for (const name of names) {
      const entryAbs = join(abs, name);
      const entryPath = `${dir}/${name}`;
      const info = await stat(entryAbs);

      if (info.isDirectory()) {
        entries.push({ name, path: entryPath, sha: '', type: 'dir' });
      } else {
        const content = await readFile(entryAbs, 'utf8');
        entries.push({ name, path: entryPath, sha: sha1(content), type: 'file' });
      }
    }

    return entries;
  }
}

