# CMS — Content Management System

**Goal**: Build a server-side and client-side rendered CMS interface layered on top of the Astro site, allowing authenticated users to manage Astro content collections through a visual editor without touching code or markdown files directly.

## Architecture Overview

- **Backend / CMS UI**: Astro server-side rendered pages under a `/cms` route prefix, served via Astro's Node.js adapter in SSR mode
- **Frontend / Public site**: Existing Astro static pages, hydrated with React islands where needed
- **Authentication**: GitHub OAuth — users log in with their GitHub account; access is restricted by GitHub organization membership or repository collaborator status
- **Content Storage**: Astro content collections (markdown + frontmatter, or JSON documents) stored in the repository; the CMS reads and writes these files via the GitHub API (no direct filesystem writes in production)
- **Visual Editor**: React component powered by `react-prosemirror` for editing markdown body content inline

## Technical Decisions

- **Framework**: Astro with `@astrojs/vercel` adapter
- **Rendering**: `output: 'static'` (hybrid) — public pages are prerendered at build time; every CMS page under `/cms/*` opts out with `export const prerender = false` and is deployed as a Vercel Node.js serverless function
- **UI Components**: React (via Astro's React integration)
- **Authentication**: GitHub OAuth (server-side flow), sessions stored in HTTP-only signed cookies
- **Authorization**: GitHub API — validate user is a collaborator or member of the configured org/repo
- **Content API**: GitHub REST API (read tree, get file, create/update/delete blobs, commit)
- **Visual Editor**: `@handlewithcare/react-prosemirror` (https://github.com/nytimes/react-prosemirror)
- **Field Generation**: Zod schemas exported from `src/content/schemas.ts` are the single source of truth for field types and structure; the CMS introspects them at runtime to auto-generate all form fields
- **Field Overrides**: `cms.config.ts` may override only the _presentation_ of auto-generated fields (custom component, label, hidden); it never re-declares field types
- **Styling**: Tailwind CSS (consistent with the main site)

> **Why `@astrojs/vercel` and not `@astrojs/node`?** The Node.js adapter produces a self-hosted standalone server. The Vercel adapter produces Vercel-native serverless function output that slots into the existing Vercel deployment pipeline. Both run full Node.js (not edge), so `crypto`, `fs`, and all Node built-ins work identically in SSR route handlers.

## Schema Architecture

All Zod schemas that define content collection shapes live in **`src/content/schemas.ts`** as plain named exports. This file is imported by two consumers:

1. **`src/content.config.ts`** — passes schemas into `defineCollection` so Astro can validate content at build time (existing behaviour, unchanged)
2. **`src/cms/lib/schema-fields.ts`** — imports schemas directly and introspects them at runtime to produce `ResolvedField[]` arrays that drive the CMS editor UI

This separation is essential: `astro:content` is a virtual module only available inside Astro's pipeline, so `getCollection` cannot be used to learn about field types — but the raw Zod objects can be imported anywhere, including SSR route handlers and React components.

```
src/
  content/
    schemas.ts          ← single source of truth for all collection Zod schemas
  content.config.ts     ← imports schemas, calls defineCollection (unchanged shape)
  cms/
    lib/
      schema-fields.ts  ← imports schemas, walks Zod shape, returns ResolvedField[]
```

## CMS Config File

A file at `cms.config.ts` (repo root) controls CMS behaviour per content type. It **never describes field types** — those come from the Zod schemas. It only configures collection-level behaviour and optional presentation overrides for individual fields:

```ts
// cms.config.ts
import { defineConfig } from './src/cms/config'

export default defineConfig({
  collections: {
    articles: {
      allowCreate: true,
      allowDelete: true,
      fields: {
        // Override the auto-inferred TextArea for 'description' to be a
        // single-line TextInput instead, and give it a friendlier label.
        description: { component: 'TextInput', label: 'Short Summary' },
        // Hide 'draft' from the editor — managed programmatically.
        draft: { hidden: true },
      },
    },
    banner: {
      // One-off singleton — no list page; appears directly in the sidebar.
      singleton: true,
      allowCreate: false,
      allowDelete: false,
    },
    schedules: {
      // Schedules are JSON-only; disable creation and deletion from the UI.
      allowCreate: false,
      allowDelete: false,
    },
  },
})
```

### What `cms.config.ts` controls

**Collection options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `singleton` | `boolean` | `false` | The collection is a single document. Shown directly in the sidebar; no list page. |
| `allowCreate` | `boolean` | `true` | Show the "New item" action on the list page. |
| `allowDelete` | `boolean` | `true` | Show the "Delete" action on the list and editor pages. |
| `fields` | `Record<string, FieldOverride>` | `{}` | Presentation overrides for specific fields. |

**`FieldOverride` — overrides only, never re-declares types:**

| Option | Type | Description |
|---|---|---|
| `component` | `BuiltInControl \| React.ComponentType` | Swap the auto-inferred control for a different built-in or a custom React component. Custom components receive `{ value, onChange, field }`. |
| `label` | `string` | Human-readable label. Default: field key converted to Title Case. |
| `hidden` | `boolean` | Exclude this field from the editor entirely. |

A `FieldOverride` without a `component` key is valid — it can just set a `label` or `hidden` flag without changing the rendered control.

### What `cms.config.ts` must NOT do

- Re-declare field types (e.g. `{ type: 'string' }`) — those come from the Zod schema
- List fields that don't exist in the Zod schema — the system ignores unknown keys and may warn in dev
- Override the `body` field — the markdown body is always handled by the Visual Editor pane

## CMS Routes

All routes live under `/cms` and are Astro SSR pages.

| Route | Description |
|---|---|
| `/cms/login` | Initiates GitHub OAuth flow |
| `/cms/auth/callback` | OAuth callback; validates token, writes session cookie, redirects |
| `/cms/logout` | Clears session cookie |
| `/cms` | Dashboard / redirect to first collection |
| `/cms/[collection]` | List page for a group collection |
| `/cms/[collection]/new` | New item editor |
| `/cms/[collection]/[slug]` | Item editor for an existing entry |

Singleton collections skip the list page and link directly to `/cms/[collection]/[slug]` where `slug` is the fixed filename (e.g. `index`).

## Authentication & Authorization

1. Unauthenticated requests to any `/cms/*` route (except `/cms/login` and `/cms/auth/callback`) redirect to `/cms/login`.
2. The GitHub OAuth app is registered against the repository's owner account.
3. On callback, the server exchanges the code for a user access token and calls `GET /repos/{owner}/{repo}/collaborators/{username}` (or org membership check). If the user is not a collaborator, they receive a 403 page.
4. The user access token is stored encrypted in a signed HTTP-only session cookie (not in localStorage).
5. The token is used for all subsequent GitHub API calls made on behalf of the user so that commits are attributed correctly.

Required environment variables:

```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REPO_OWNER=        # e.g. chrisdmacrae
GITHUB_REPO_NAME=         # e.g. ourchurchhome
SESSION_SECRET=           # random 32-byte hex string
```

## Sidebar

The sidebar is rendered as a persistent left-hand navigation panel on all `/cms/*` pages.

**Singleton collections** (where `singleton: true` in config) are listed individually in the root sidebar with a direct link to their editor page, e.g.:

```
📄 Banner
📄 About Page
```

**Group collections** (where `singleton` is absent or `false`) are listed by their collection name and link to their list page, e.g.:

```
📂 Articles
📂 Schedules
```

Collections are sorted alphabetically. The currently active collection (and item) is visually highlighted.

## List Page (`/cms/[collection]`)

Displayed for non-singleton collections. Shows a table or card grid of all items in the collection.

- **Columns**: derived from the content collection schema — at minimum `title` (or `name`), `slug`, and any date field
- **Create button**: "New [Collection singular]" — visible only when `allowCreate: true`
- **Row actions**:
  - "Edit" — navigates to `/cms/[collection]/[slug]`
  - "Delete" — visible only when `allowDelete: true`; triggers a confirmation dialog before calling the GitHub API to delete the file and commit the change

## Item Editor (`/cms/[collection]/[slug]` and `/cms/[collection]/new`)

The editor is split into two panes:

### Fields Pane (left / top on mobile)

Fields are **auto-generated by walking the Zod schema** exported from `src/content/schemas.ts` for that collection. The CMS never requires the user to declare field types — it reads the schema to determine them. The resolution pipeline is:

```
src/content/schemas.ts          (Zod schema, source of truth)
        ↓  imported by
src/cms/lib/schema-fields.ts    (introspects Zod shape → ResolvedField[])
        ↓  merged with
cms.config.ts fields overrides  (component / label / hidden overrides only)
        ↓  passed as props to
FieldsPane React component      (renders each ResolvedField as a form control)
```

**Default Zod → control mapping** (applied before any overrides):

| Zod type | Inferred `FieldType` | Default control |
|---|---|---|
| `z.string()` | `string` | `TextInput` |
| `z.string()` with `.min` / multiline hint | `text` | `TextArea` |
| `z.string().url()` | `url` | `UrlInput` |
| `z.string().email()` | `email` | `EmailInput` |
| `z.number()` | `number` | `NumberInput` |
| `z.coerce.date()` / `z.date()` | `date` | `DatePicker` |
| `z.boolean()` | `boolean` | `Toggle` |
| `z.enum([…])` | `enum` | `Select` (options populated from enum values) |
| `z.array(z.string())` | `array` | `TagInput` |
| `z.array(z.object({…}))` | `array` | `TextArea` (JSON editing — object arrays are not tag-friendly) |
| `z.object({…})` | `object` | Nested `FieldsPane` (recursive) |

> **Zod v4 note**: `_def.entries` on `z.enum()` is a plain record object `{ value: value, … }`, not an array. The introspection layer calls `Object.values(entries)` to extract option strings. `_def.shape` on `z.object()` is a plain object (not a function).

**Override application** — after generating `ResolvedField[]` from the Zod schema, `schema-fields.ts` looks up each field key in `cms.config.ts`'s `fields` map. If an override exists:
- `component` replaces the default control
- `label` replaces the auto-generated title-cased label
- `hidden: true` removes the field from the rendered list entirely

The `body` key is always excluded from this pane — the markdown body is managed exclusively in the Visual Editor pane.

### Visual Editor Pane (right / bottom on mobile)

A rich-text editor powered by `react-prosemirror` that represents the markdown body of the file.

- Serialises ProseMirror document → CommonMark markdown on save
- Parses existing markdown → ProseMirror document on load
- Toolbar: Bold, Italic, Heading (H1–H3), Blockquote, Code, Bullet list, Ordered list, Link, Image (by URL), Horizontal rule
- Shown only for markdown content types (`.md` / `.mdx`); hidden for pure JSON collections

### Save Behaviour

On save the editor:

1. Serialises frontmatter fields back to YAML
2. Serialises the visual editor document to CommonMark markdown
3. Concatenates them into the final `.md` file content
4. Calls the GitHub API (`PUT /repos/{owner}/{repo}/contents/{path}`) to create or update the file, committing as the authenticated user
5. Displays a success toast with a link to the commit on GitHub

## Implementation Checklist

The following tasks were completed to build the CMS:

- [x] **Infrastructure setup** — installed `@astrojs/vercel`, `@handlewithcare/react-prosemirror`, `prosemirror-*`, `arctic`, `gray-matter`; switched `astro.config.mjs` to hybrid SSR output; added `.env.example`
- [x] **CMS config system** — `cms.config.ts` (user-facing) + `src/cms/config.ts` (`defineConfig` helper, TypeScript types for `CollectionConfig`, `FieldOverride`, `ResolvedField`, `BuiltInControl`)
- [x] **Session & auth library** — `src/cms/lib/session.ts`: HMAC-SHA256 signed HTTP-only cookie helpers (`signSession`, `verifySession`, `clearSession`) using `import.meta.env` for the secret
- [x] **GitHub OAuth flow** — `src/pages/cms/login.astro`, `auth/callback.astro`, `logout.astro`; OAuth code exchange via `arctic`; collaborator check via `GET /repos/{owner}/{repo}/collaborators/{username}`
- [x] **Auth middleware** — `src/middleware.ts`: intercepts all `/cms/*` requests (except login/callback), verifies session cookie, injects `Astro.locals.session`
- [x] **GitHub API client** — `src/cms/lib/github-api.ts`: `getFile`, `putFile`, `deleteFile`, `listFiles` using the GitHub REST API with the user's OAuth token for attributed commits
- [x] **Content & schema utilities** — `src/cms/lib/content.ts` (`parseMarkdown`, `parseJson`, `serializeMarkdown`, `serializeJson`, `itemPath`); `src/cms/lib/schema-fields.ts` (Zod v4 introspection → `ResolvedField[]`)
- [x] **Schema-fields resolve config** — `src/cms/lib/resolve-config.ts`: merges introspected fields with `cms.config.ts` overrides; populates `collection.fields` with final `ResolvedField[]`
- [x] **CMS shell layout & sidebar** — `src/cms/layouts/CmsShell.astro`; `src/cms/components/CmsSidebar.tsx`: singletons at root, group collections as folder links, active route highlight
- [x] **CMS dashboard index** — `src/pages/cms/index.astro`: redirects to first collection or shows welcome prompt
- [x] **Collection list page** — `src/pages/cms/[collection]/index.astro`: table of items from GitHub tree, Create button (gated by `allowCreate`), Delete button (gated by `allowDelete`) with `confirm()` dialog
- [x] **Fields pane component** — `src/cms/components/FieldsPane.tsx`: renders `ResolvedField[]` as typed form controls (`TextInput`, `TextArea`, `NumberInput`, `DatePicker`, `Toggle`, `Select`, `TagInput`, `UrlInput`, `EmailInput`); JSON-stringifies array/object values for `TextArea`
- [x] **Visual editor component** — `src/cms/components/VisualEditor.tsx`: `@handlewithcare/react-prosemirror` with `prosemirror-markdown` schema; toolbar (Bold, Italic, H1–H3, Blockquote, Code, Bullet list, Ordered list, Link, HR); serialises to CommonMark on save via hidden `<input>`
- [x] **Item editor page** — `src/pages/cms/[collection]/[slug].astro`: loads file from GitHub, renders `FieldsPane` + `VisualEditor`, POST handler reconstructs frontmatter (with type coercion) + body and commits via `putFile` with SHA-based concurrency control
- [x] **New item page** — `src/pages/cms/[collection]/new.astro`: slug input + same field/editor panes, POST handler creates file and redirects to editor

## Acceptance Criteria

- [ ] Unauthenticated users are redirected to `/cms/login`
- [ ] Only GitHub repository collaborators can access the CMS
- [ ] GitHub OAuth flow completes and session cookie is set correctly
- [ ] Sidebar renders singleton collections at root level and group collections as links
- [ ] List page shows all items for a group collection
- [ ] "New item" button is absent when `allowCreate: false`
- [ ] "Delete" action is absent when `allowDelete: false`
- [ ] Item editor renders all frontmatter fields from the Zod schema
- [ ] Field overrides from `cms.config.ts` replace the default control
- [ ] Visual editor loads existing markdown body and serialises back correctly
- [ ] Saving creates or updates the file via the GitHub API and commits as the logged-in user
- [ ] Deleting removes the file via the GitHub API with a confirmation dialog
- [ ] CMS is fully responsive on mobile, tablet, and desktop

## Non-goals

- Direct filesystem writes (all writes go through the GitHub API)
- Real-time collaborative editing
- Media/asset upload (images are referenced by URL)
- Custom page builder / drag-and-drop layout editing
- Role-based permissions beyond collaborator vs. non-collaborator
- Support for non-GitHub repository hosting (GitLab, Bitbucket, etc.)

## Assumptions

- The site is deployed to Vercel using `@astrojs/vercel`; public pages are statically prerendered, CMS pages run as Node.js serverless functions
- All content collection Zod schemas live in `src/content/schemas.ts` as named exports; `src/content.config.ts` imports them from there
- Adding a new collection requires: (1) adding its schema to `schemas.ts`, (2) registering it in `content.config.ts`, and optionally (3) adding a `cms.config.ts` entry for non-default behaviour
- The GitHub OAuth app is registered and its credentials are available as environment variables
- Commits made through the CMS appear in the repository's default branch directly (no pull-request workflow)

## Verification Plan

1. **Auth flow**: log in via GitHub, confirm redirect to `/cms`, confirm cookie is set; log out, confirm redirect to `/cms/login`
2. **Authorization**: attempt access with a non-collaborator account, confirm 403 response
3. **Sidebar**: verify singletons appear at root, group collections appear as links
4. **List page**: verify all items load; verify create/delete buttons respect config flags
5. **Editor — fields**: create a new item, fill all fields, save; verify frontmatter is correct in the committed file
6. **Editor — visual editor**: open an existing markdown item, edit body, save; verify markdown body is correct in the committed file
7. **Delete**: delete an item via the CMS; verify the file is removed in the repository
8. **Responsive**: test CMS UI at 375px, 768px, and 1280px viewports

## Rollback Plan

- All content changes are GitHub commits; reverting a bad edit is a `git revert` or file restore via the GitHub UI
- The CMS itself is deployed as part of the Astro site; rolling back the deployment also rolls back the CMS code


