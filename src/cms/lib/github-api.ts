/**
 * src/cms/lib/github-api.ts
 *
 * Thin fetch wrappers around the GitHub REST API.
 * All mutations are committed to GITHUB_REPO_BRANCH (default: main).
 */

function cfg() {
  return {
    owner: import.meta.env.GITHUB_REPO_OWNER ?? '',
    repo: import.meta.env.GITHUB_REPO_NAME ?? '',
    branch: import.meta.env.GITHUB_REPO_BRANCH ?? 'main',
  };
}

async function ghFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  });
}

export interface GHEntry {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size: number;
}

/** List the contents of a directory in the repository. */
export async function listFiles(token: string, dir: string): Promise<GHEntry[]> {
  const { owner, repo, branch } = cfg();
  const res = await ghFetch(token, `/repos/${owner}/${repo}/contents/${dir}?ref=${branch}`);
  if (!res.ok) throw new Error(`GitHub listFiles ${res.status}: ${await res.text()}`);
  return res.json() as Promise<GHEntry[]>;
}

/** Read the raw content and SHA of a single file. */
export async function getFile(
  token: string,
  filePath: string
): Promise<{ content: string; sha: string }> {
  const { owner, repo, branch } = cfg();
  const res = await ghFetch(
    token,
    `/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`
  );
  if (!res.ok) throw new Error(`GitHub getFile ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: string; sha: string };
  // GitHub returns base64-encoded content with embedded newlines
  const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return { content, sha: data.sha };
}

/**
 * Create or update a file in the repository and commit the change.
 * Pass `sha` when updating an existing file (required by the API).
 */
export async function putFile(
  token: string,
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const { owner, repo, branch } = cfg();
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(token, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub putFile ${res.status}: ${await res.text()}`);
}

/** Delete a file from the repository and commit the deletion. */
export async function deleteFile(
  token: string,
  filePath: string,
  sha: string,
  message: string
): Promise<void> {
  const { owner, repo, branch } = cfg();
  const res = await ghFetch(token, `/repos/${owner}/${repo}/contents/${filePath}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch }),
  });
  if (!res.ok) throw new Error(`GitHub deleteFile ${res.status}: ${await res.text()}`);
}

