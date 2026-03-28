# CMS — Image Management

**Goal**: Enable authenticated CMS users to upload, browse, select, and delete image assets stored within the repository. Images are referenced from content fields (the `Image` field control) and from the visual editor body (a custom ProseMirror Image node). Both the GitHub and Local persistence backends support all image operations.

## Architecture Overview

- **Asset storage**: Images live in a single flat directory within the repository, configured via the `IMAGE_DIR` environment variable (repo-relative path, e.g. `public/images`).
- **File naming**: Every uploaded image is stored as `image_{sha12}.{ext}`, where `sha12` is the first 12 hex characters of the SHA-256 digest of the file's binary content. Identical files deduplicate automatically.
- **Delivery (GitHub backend)**: Images are served directly from GitHub's raw content CDN at `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`. No build step or CDN configuration is required.
- **Delivery (Local backend)**: Images are read from and written to the local filesystem under the repo root. If `IMAGE_DIR` is under `public/`, Astro's built-in static file serving makes them available at `/{IMAGE_DIR}/{filename}` during development.
- **UI surfaces**: Two surfaces can reference images — the `Image` field control in the Fields Pane, and the Image Node in the Visual Editor. Both open the same shared Image Library modal.

## Technical Decisions

- **Content-addressed naming** (`image_{sha12}.{ext}`) — eliminates duplicate uploads without a database; a re-upload of the same file is a no-op (same path, same content, GitHub API returns the existing SHA).
- **Flat directory** — all images share a single `IMAGE_DIR`; sub-folders are not supported. Keeps listing and URL construction simple.
- **Binary persistence** — image upload requires binary-safe I/O. A dedicated `uploadImage` / `deleteImage` / `listImages` surface is added to `IPersistenceService` rather than overloading the text-oriented `writeItem`.
- **Valid extensions** — the accepted set is defined as a constant: `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`, `avif`. Files with other extensions present in `IMAGE_DIR` are silently ignored by the listing.
- **`Image` field type** — stored in frontmatter as a plain URL string (compatible with `z.string().url()`). The `Image` control is opt-in: set `component: 'Image'` in `cms.config.ts`, or the CMS auto-detects fields whose key ends with `image`, `photo`, `thumbnail`, `avatar`, `logo`, or `banner`.
- **No separate image schema** — images are not an Astro content collection; they are plain binary files managed entirely through the persistence layer.

## Configuration

```
# .env
IMAGE_DIR=public/images          # repo-relative path to the image store
GITHUB_REPO_OWNER=               # used to build raw.githubusercontent.com URLs
GITHUB_REPO_NAME=                # used to build raw.githubusercontent.com URLs
GITHUB_REPO_BRANCH=main          # used to build raw.githubusercontent.com URLs
```

`IMAGE_DIR` is the only new required variable. The GitHub repo variables are already required by the CMS and are reused here for URL generation.

## Persistence Interface Extensions

Three new methods are added to `IPersistenceService` in `src/cms/lib/persistence.ts`:

```ts
/** A single image file entry returned by listImages. */
export interface ImageEntry {
  filename: string;   // e.g. "image_a1b2c3d4e5f6.jpg"
  path: string;       // repo-relative path, e.g. "public/images/image_a1b2c3d4e5f6.jpg"
  sha: string;        // version identifier (blob SHA or content hash)
  url: string;        // absolute URL ready for use in <img src>
  ext: string;        // file extension without dot, e.g. "jpg"
  sizeBytes: number;  // file size in bytes (0 if unavailable)
}

interface IPersistenceService {
  // …existing methods…

  /** List all recognised image files in the configured IMAGE_DIR. */
  listImages(): Promise<ImageEntry[]>;

  /**
   * Upload a new image. Content is raw binary (ArrayBuffer).
   * Returns the ImageEntry for the stored file (path and URL may differ
   * from the input filename once content-addressed naming is applied).
   */
  uploadImage(filename: string, data: ArrayBuffer, message: string): Promise<ImageEntry>;

  /** Delete an image by its repo-relative path and current version SHA. */
  deleteImage(path: string, sha: string, message: string): Promise<void>;
}
```

### GitHubPersistence implementation

- **`listImages`**: calls `listFiles(token, IMAGE_DIR)`, filters by valid extension, maps each entry to an `ImageEntry` where `url = https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`.
- **`uploadImage`**: computes SHA-256 of the `ArrayBuffer`, builds the content-addressed filename, base64-encodes the binary, calls `PUT /repos/{owner}/{repo}/contents/{IMAGE_DIR}/{filename}` (GitHub Contents API). Returns the resulting `ImageEntry`.
- **`deleteImage`**: calls `DELETE /repos/{owner}/{repo}/contents/{path}` with the current blob `sha` and a commit message.

### LocalPersistence implementation

- **`listImages`**: reads `IMAGE_DIR` with `fs.readdir`, filters by extension, stats each file for size, computes SHA-256 of content for the `sha` field. `url` is a root-relative path (`/{path}`) suitable for use in `<img src>` during local development.
- **`uploadImage`**: computes SHA-256, writes the `ArrayBuffer` to disk with `fs.writeFile`. Returns the `ImageEntry` with local URL.
- **`deleteImage`**: calls `fs.unlink` on the absolute path.



## CMS Routes

| Route | Method | Description |
|---|---|---|
| `/cms/images` | `GET` | Image library page — lists all images in `IMAGE_DIR` with upload form and delete actions |
| `/cms/images` | `POST` | Upload a new image (multipart form, field name `file`) |
| `/cms/images/delete` | `POST` | Delete an image (form fields: `path`, `sha`) |
| `/cms/api/images` | `GET` | JSON endpoint — returns `ImageEntry[]`; consumed by the Image Library modal on the client |

`/cms/images` and `/cms/api/images` are gated by the existing session middleware like all other `/cms/*` routes.

The `/cms/api/images` endpoint is used by the client-side Image Library modal (React) to fetch the image list without a full page reload.

## Image Library Page (`/cms/images`)

A standalone CMS page (uses `CmsShell`) that provides full image management outside of the content editor.

- **Toolbar**: page title "Images" + "Upload image" button (triggers the file input)
- **Grid**: responsive thumbnail grid; each card shows:
  - Image thumbnail (using the delivery URL)
  - Filename (truncated with ellipsis if long)
  - File extension badge
  - File size
  - "Delete" button — shows a `confirm()` dialog, then POSTs to `/cms/images/delete`
- **Upload form**: `<input type="file" accept="image/*" multiple>` — selecting files immediately POSTs via fetch (no page reload); newly uploaded images appear in the grid without navigating away
- **Empty state**: friendly prompt with an upload call-to-action

## Image Library Modal

A shared React component (`ImageLibrary`) used from within both the `Image` field control and the Visual Editor Image toolbar action. It is an overlay modal (not a page navigation).

- **Trigger**: "Select image" button on the `Image` field control; "Insert image" button on the Visual Editor toolbar
- **Content**: fetches `GET /cms/api/images` on open; renders the same thumbnail grid as the library page
- **Actions inside modal**:
  - Click a thumbnail → selects that image (calls `onSelect(imageEntry)` prop) and closes the modal
  - "Upload new" button → shows a file input; uploads immediately via `POST /cms/images`; refreshes the grid; auto-selects the uploaded image
  - "Cancel" → closes without selecting
- **Props**:
  ```ts
  interface ImageLibraryProps {
    open: boolean;
    onSelect: (entry: ImageEntry) => void;
    onClose: () => void;
  }
  ```

## `Image` Field Control

A CMS field control that stores a URL string and provides an image picker rather than a plain text input.

- **Rendered as**: thumbnail preview (if a value exists) + "Select image" button + optional "Clear" button
- **Inferred from**: `z.string().url()` when the field key ends with `image`, `photo`, `thumbnail`, `avatar`, `logo`, or `banner` — **or** explicitly configured via `cms.config.ts` (`component: 'Image'`)
- **Emits**: `string` — the full delivery URL of the selected image (`raw.githubusercontent.com` URL in production, root-relative path in local dev)
- **Interaction**:
  1. User clicks "Select image" → `ImageLibrary` modal opens
  2. User selects or uploads an image → modal calls `onSelect` with the `ImageEntry`
  3. The field value is set to `entry.url`; the thumbnail preview updates immediately
  4. User clicks "Clear" → field value is set to `''`
- **Addition to the field–control map** (`cms-ui-fields.md`):

  | Field control | Zod type(s) | Emitted value type |
  |---|---|---|
  | `Image` | `z.string().url()` (key-heuristic or `component: 'Image'` override) | `string` (absolute URL) |

## Visual Editor Image Node

A custom ProseMirror node type added to the Visual Editor's schema that represents an embedded image in the markdown body.

- **Node type name**: `image` (standard ProseMirror image node, extended with library-picker support)
- **Toolbar button**: camera icon in the Visual Editor toolbar; clicking it opens the `ImageLibrary` modal
- **On select**: inserts an `image` node at the current cursor position with `src` set to the selected `ImageEntry.url` and `alt` set to the filename (user-editable after insertion)
- **Rendering in editor**: rendered as `<img src="…" alt="…">` inside the ProseMirror view using a node view; images display at a maximum width of 100% within the editor pane
- **Serialisation**: `image` nodes serialise to standard CommonMark image syntax: `![alt](url)`
- **Existing markdown images**: images already in the markdown body (from pasted markdown or prior raw URL entry) continue to parse and render correctly — the library picker is additive
- **Existing toolbar "Image by URL"**: retained as-is; the library picker is an additional affordance alongside it

## File Naming Details

When an image is uploaded:

1. Read the file binary as an `ArrayBuffer`
2. Compute `SHA-256(binary)` → take the first 12 hex characters → `sha12`
3. Normalise the original file extension to lowercase (`.JPG` → `.jpg`; `.jpeg` → `.jpg`)
4. Final filename: `image_{sha12}.{ext}` (e.g. `image_a1b2c3d4e5f6.jpg`)
5. Full repo-relative path: `{IMAGE_DIR}/image_{sha12}.{ext}` (e.g. `public/images/image_a1b2c3d4e5f6.jpg`)

If the content-addressed path already exists (detected before write on Local backend; detected by GitHub returning the existing SHA on GitHub backend), the upload is treated as a no-op and the existing `ImageEntry` is returned.

## Delivery URL Construction

| Backend | URL format |
|---|---|
| GitHub | `https://raw.githubusercontent.com/{GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}/{GITHUB_REPO_BRANCH}/{path}` |
| Local | `/{path}` (root-relative; works when `IMAGE_DIR` is under `public/`) |

The delivery URL is stored in frontmatter and in ProseMirror image nodes unchanged — no URL transformation is needed at build time. The public site uses the same URL directly in `<img src>`.

## Implementation Checklist

- [ ] **Extend `IPersistenceService`** — add `ImageEntry` type and `listImages`, `uploadImage`, `deleteImage` methods to `src/cms/lib/persistence.ts`
- [ ] **`GitHubPersistence` image methods** — implement in `src/cms/lib/github-persistence.ts` using the GitHub Contents API
- [ ] **`LocalPersistence` image methods** — implement in `src/cms/lib/local-persistence.ts` using Node.js `fs`
- [ ] **`/cms/images` page** — `src/pages/cms/images/index.astro`: GET (thumbnail grid) + POST (upload handler)
- [ ] **`/cms/images/delete` route** — `src/pages/cms/images/delete.astro`: POST handler calls `deleteImage`, redirects back to `/cms/images`
- [ ] **`/cms/api/images` endpoint** — `src/pages/cms/api/images.ts`: GET handler returns JSON `ImageEntry[]`
- [ ] **`ImageLibrary` modal component** — `src/cms/components/ImageLibrary.tsx`: thumbnail grid, upload, select
- [ ] **`Image` field control** — add to `src/cms/components/FieldsPane.tsx`: thumbnail preview + "Select image" button wired to `ImageLibrary`
- [ ] **Auto-detection heuristic** — update `src/cms/lib/schema-fields.ts` to infer `component: 'Image'` for `z.string().url()` fields whose key matches the image key list
- [ ] **Visual Editor Image node** — extend `src/cms/components/VisualEditor.tsx`: add library-picker toolbar button wired to `ImageLibrary`; `onSelect` inserts a ProseMirror image node
- [ ] **Add `IMAGE_DIR` to `.env.example`** — document the new required variable
- [ ] **Update CMS sidebar** — add "Images" link to the sidebar below collections

## Acceptance Criteria

- [ ] `IMAGE_DIR` is the only new required environment variable
- [ ] `/cms/images` lists all files in `IMAGE_DIR` with recognised extensions as thumbnails
- [ ] Uploading a file stores it as `image_{sha12}.{ext}` in `IMAGE_DIR`; re-uploading the same file is a no-op
- [ ] Deleting an image removes the file via the active persistence backend and removes it from the grid
- [ ] The `Image` field control auto-infers for `z.string().url()` fields whose key ends with `image`, `photo`, `thumbnail`, `avatar`, `logo`, or `banner`
- [ ] The `Image` field control shows a thumbnail when a value is set; "Select image" opens `ImageLibrary`
- [ ] Selecting an image from `ImageLibrary` sets the field value to the delivery URL and closes the modal
- [ ] "Upload new" inside `ImageLibrary` uploads the file, auto-selects it, and keeps the modal open with the grid refreshed
- [ ] The Visual Editor "Insert image" toolbar button opens `ImageLibrary` and inserts a ProseMirror image node at the cursor
- [ ] Inserted images serialise to standard CommonMark `![alt](url)` syntax
- [ ] Images display in the Visual Editor via the delivery URL (`raw.githubusercontent.com` in production; root-relative path in local dev)
- [ ] Files with unrecognised extensions in `IMAGE_DIR` are silently excluded from listing
- [ ] Both GitHub and Local persistence backends satisfy all the above criteria

## Non-goals

- Sub-folder organisation within `IMAGE_DIR`
- Image cropping, resizing, or any server-side image transformation
- Drag-and-drop upload to the image library page (file input is sufficient)
- Alt-text management at the library level (alt text is set per-use in the editor)
- SVG sanitisation (SVGs are accepted as-is)
- Image CDN integration (delivery is raw GitHub CDN or Astro static serving)
- Multi-image field control (the `Image` control stores a single URL; use a `Repeater` of image fields for galleries)

## Assumptions

- `IMAGE_DIR` is a repo-relative path. For local dev, it should be under `public/` (e.g. `public/images`) so Astro's static file serving makes images available without a proxy route.
- In production, images are delivered via `raw.githubusercontent.com`. `GITHUB_REPO_BRANCH` must match the branch the CMS commits to.
- The GitHub OAuth token already carries `repo` scope (required for content writes), which also covers binary file writes.
- Image files are committed directly to the default branch — no pull-request workflow — consistent with all other CMS content writes.

## Verification Plan

1. **Upload (GitHub backend)**: upload a JPEG via `/cms/images`; confirm the file appears in the repository at `{IMAGE_DIR}/image_{sha12}.jpg`; confirm the `raw.githubusercontent.com` URL resolves to the image
2. **Upload (Local backend)**: set `CMS_PERSISTENCE=local`, upload a PNG; confirm the file appears on disk at the correct path and the root-relative URL loads in the browser
3. **Deduplication**: upload the same file twice; confirm only one file exists and no error is shown
4. **Delete**: delete an image from the library page; confirm the file is removed from the repository / filesystem
5. **`Image` field — auto-inference**: open an item whose Zod schema has a `z.string().url()` field keyed `heroImage`; confirm the `Image` control renders (thumbnail + picker) with no `cms.config.ts` override
6. **`Image` field — picker**: click "Select image", select an image from the modal; confirm the field value updates to the delivery URL and the thumbnail renders in the field
7. **`Image` field — upload within picker**: click "Upload new" inside the modal, upload a file; confirm it is auto-selected and the field value is set to its delivery URL
8. **Visual Editor — insert image**: click the image toolbar button, select an image; confirm an image node is inserted at the cursor and renders as a thumbnail in the editor
9. **Visual Editor — serialisation**: save a document with an inserted image; confirm the committed file contains `![filename](url)` CommonMark syntax
10. **Responsive**: verify the image library grid and picker modal are usable at 375px, 768px, and 1280px viewports

## Rollback Plan

- Uploaded images are committed to the repository; any accidental upload can be reverted with `git revert` or by deleting the file via the CMS image library
- Deleted images are removed as a commit; the file can be restored from git history
- The CMS is deployed as part of the Astro site; rolling back the deployment also rolls back the image management UI
