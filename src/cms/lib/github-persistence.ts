/**
 * src/cms/lib/github-persistence.ts
 *
 * GitHub-backed persistence service.
 * All reads and writes go through the GitHub Contents REST API; every mutation
 * is recorded as a commit on GITHUB_REPO_BRANCH.
 */

import { getFile, putFile, deleteFile, listFiles } from './github-api';
import type { IPersistenceService, PersistenceItem, PersistenceEntry } from './persistence';

export class GitHubPersistence implements IPersistenceService {
  constructor(private readonly token: string) {}

  /** Read a single file from the repository. */
  async readItem(filePath: string): Promise<PersistenceItem> {
    // getFile already decodes the base64 content and returns { content, sha }
    return getFile(this.token, filePath);
  }

  /**
   * Create or update a file and commit the change.
   * `sha` must be the current blob SHA when updating an existing file —
   * the GitHub API returns 409 Conflict if it is missing or stale.
   */
  async writeItem(
    filePath: string,
    content: string,
    message: string,
    sha?: string,
  ): Promise<{ sha: string }> {
    return putFile(this.token, filePath, content, message, sha);
  }

  /** Delete a file and commit the removal. */
  async deleteItem(filePath: string, sha: string, message: string): Promise<void> {
    return deleteFile(this.token, filePath, sha, message);
  }

  /** List the files inside a repository directory. */
  async listItems(dir: string): Promise<PersistenceEntry[]> {
    const entries = await listFiles(this.token, dir);
    return entries.map(({ name, path, sha, type }) => ({
      name,
      path,
      sha,
      // GitHub types: 'file' | 'dir' | 'symlink' | 'submodule'
      // Narrow to the two values the interface cares about.
      type: type === 'dir' ? 'dir' : 'file',
    }));
  }
}

