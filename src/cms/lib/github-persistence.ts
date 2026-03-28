/**
 * src/cms/lib/github-persistence.ts
 *
 * GitHub-backed persistence service.
 * All reads and writes go through the GitHub Contents REST API; every mutation
 * is recorded as a commit on GITHUB_REPO_BRANCH.
 */

import { createHash } from 'node:crypto';
import { getFile, putFile, deleteFile, listFiles, putBinaryFile } from './github-api';
import type { IPersistenceService, PersistenceItem, PersistenceEntry, ImageEntry } from './persistence';
import { IMAGE_EXTENSIONS } from './persistence';

function cfg() {
  return {
    owner: import.meta.env.GITHUB_REPO_OWNER ?? '',
    repo: import.meta.env.GITHUB_REPO_NAME ?? '',
    branch: import.meta.env.GITHUB_REPO_BRANCH ?? 'main',
    imageDir: import.meta.env.IMAGE_DIR ?? 'public/images',
  };
}

function sha12FromBuffer(data: ArrayBuffer): string {
  return createHash('sha256').update(Buffer.from(data)).digest('hex').slice(0, 12);
}

function normaliseExt(filename: string): string {
  const raw = filename.split('.').pop()?.toLowerCase() ?? '';
  // jpeg → jpg
  return raw === 'jpeg' ? 'jpg' : raw;
}

function rawUrl(owner: string, repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

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

  /** List all recognised image files in the configured IMAGE_DIR. */
  async listImages(): Promise<ImageEntry[]> {
    const { owner, repo, branch, imageDir } = cfg();
    let entries;
    try {
      entries = await listFiles(this.token, imageDir);
    } catch {
      // Directory may not exist yet
      return [];
    }
    const images: ImageEntry[] = [];
    for (const entry of entries) {
      if (entry.type !== 'file') continue;
      const ext = normaliseExt(entry.name);
      if (!IMAGE_EXTENSIONS.includes(ext as any)) continue;
      images.push({
        filename: entry.name,
        path: entry.path,
        sha: entry.sha,
        url: rawUrl(owner, repo, branch, entry.path),
        ext,
        sizeBytes: entry.size,
      });
    }
    return images;
  }

  /** Upload a new image using content-addressed naming (image_{sha12}.{ext}). */
  async uploadImage(originalFilename: string, data: ArrayBuffer, message: string): Promise<ImageEntry> {
    const { owner, repo, branch, imageDir } = cfg();
    const ext = normaliseExt(originalFilename);
    const hash = sha12FromBuffer(data);
    const filename = `image_${hash}.${ext}`;
    const filePath = `${imageDir}/${filename}`;

    // Check whether the file already exists (deduplication)
    let existingSha: string | undefined;
    try {
      const entries = await listFiles(this.token, imageDir);
      existingSha = entries.find((e) => e.name === filename)?.sha;
    } catch {
      // imageDir may not exist yet — that's fine, putBinaryFile will create it
    }

    const result = await putBinaryFile(this.token, filePath, data, message, existingSha);
    return {
      filename,
      path: filePath,
      sha: result.sha,
      url: rawUrl(owner, repo, branch, filePath),
      ext,
      sizeBytes: data.byteLength,
    };
  }

  /** Delete an image by its repo-relative path and current blob SHA. */
  async deleteImage(path: string, sha: string, message: string): Promise<void> {
    return deleteFile(this.token, path, sha, message);
  }
}

