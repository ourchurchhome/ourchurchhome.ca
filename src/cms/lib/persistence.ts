/**
 * src/cms/lib/persistence.ts
 *
 * Persistence abstraction for CMS content storage.
 *
 * The interface decouples CMS pages from any specific backend so the
 * implementation (GitHub API or local filesystem) can be swapped via the
 * CMS_PERSISTENCE environment variable without touching page logic.
 *
 *   CMS_PERSISTENCE=github  (default) — commits changes to the GitHub repo
 *   CMS_PERSISTENCE=local             — reads/writes the local working tree
 */

import { GitHubPersistence } from './github-persistence';
import { LocalPersistence } from './local-persistence';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** A single content file read from the persistence backend. */
export interface PersistenceItem {
  /** Decoded file content (UTF-8 string). */
  content: string;
  /**
   * Version identifier.
   * GitHub backend: the blob SHA (required for PUT to avoid 409 conflicts).
   * Local backend:  SHA-1 hash of the file content.
   */
  sha: string;
}

/** A directory entry returned by listItems. */
export interface PersistenceEntry {
  /** Bare filename, e.g. "my-post.md" */
  name: string;
  /** Repo-relative path, e.g. "src/content/articles/my-post.md" */
  path: string;
  /** Version identifier (same semantics as PersistenceItem.sha). */
  sha: string;
  /** Entry kind — implementations only surface 'file' or 'dir'. */
  type: 'file' | 'dir';
}

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

/**
 * All persistence operations the CMS requires.
 * Both GitHubPersistence and LocalPersistence must implement this contract.
 */
export interface IPersistenceService {
  /**
   * Read a single file.
   * @param filePath  Repo-relative path, e.g. "src/content/articles/hello.md"
   */
  readItem(filePath: string): Promise<PersistenceItem>;

  /**
   * Create or update a file and record the change.
   * @param filePath  Repo-relative path.
   * @param content   Full UTF-8 file content to write.
   * @param message   Commit / change message (used by GitHub backend).
   * @param sha       Current version identifier. Required when updating an
   *                  existing file on the GitHub backend to prevent conflicts.
   *                  Omit when creating a brand-new file.
   * @returns         The new version identifier of the written file.
   */
  writeItem(
    filePath: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<{ sha: string }>;

  /**
   * Delete a file and record the removal.
   * @param filePath  Repo-relative path.
   * @param sha       Current version identifier.
   * @param message   Commit / change message.
   */
  deleteItem(filePath: string, sha: string, message: string): Promise<void>;

  /**
   * List the entries inside a directory.
   * @param dir  Repo-relative directory path, e.g. "src/content/articles"
   */
  listItems(dir: string): Promise<PersistenceEntry[]>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Construct the appropriate persistence service for the current environment.
 *
 * Set `CMS_PERSISTENCE=local` in your .env to use the local filesystem
 * backend (no GitHub credentials required — useful for offline development).
 * Any other value, or the absence of the variable, selects the GitHub backend.
 *
 * @param token  The authenticated user's GitHub OAuth access token.
 *               Ignored by LocalPersistence but always required by the
 *               call-site so the signature is uniform.
 */
export function createPersistenceService(token: string): IPersistenceService {
  const backend = import.meta.env.CMS_PERSISTENCE ?? 'github';
  if (backend === 'local') return new LocalPersistence();
  return new GitHubPersistence(token);
}

