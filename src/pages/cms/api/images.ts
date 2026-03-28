/**
 * src/pages/cms/api/images.ts
 *
 * GET  /cms/api/images  — returns the image library as JSON (ImageEntry[])
 * POST /cms/api/images  — upload a new image; returns the new ImageEntry as JSON
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createPersistenceService } from '../../../cms/lib/persistence';

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const svc = createPersistenceService(session.accessToken);
    const images = await svc.listImages();
    return new Response(JSON.stringify(images), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await file.arrayBuffer();
    const svc = createPersistenceService(session.accessToken);
    const entry = await svc.uploadImage(file.name, data, `Upload image ${file.name}`);

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const session = locals.session;
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as { path?: string; sha?: string };
    if (!body.path || !body.sha) {
      return new Response(JSON.stringify({ error: 'path and sha are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const svc = createPersistenceService(session.accessToken);
    await svc.deleteImage(body.path, body.sha, `Delete image ${body.path}`);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

