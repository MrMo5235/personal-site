import { env } from 'cloudflare:workers';
import { ensureDatabase, getMediaRecord } from '@/db/runtime';
import { requireAdminApi } from '@/lib/admin-auth';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const record = await getMediaRecord(id);
  if (!record) return new Response('Not found', { status: 404 });

  const object = await env.FILES.get(record.object_key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=3600');
  const download = new URL(request.url).searchParams.get('download') === '1';
  headers.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(record.name)}`);
  return new Response(object.body, { headers });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  await ensureDatabase();

  const { id } = await context.params;
  const body = (await request.json()) as { alt?: unknown; sortOrder?: unknown };
  const alt = typeof body.alt === 'string' ? body.alt.slice(0, 240) : null;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : null;
  if (alt === null && sortOrder === null) {
    return Response.json({ error: 'No supported changes provided.' }, { status: 400 });
  }

  await env.DB
    .prepare(`
      UPDATE media_assets
      SET alt = COALESCE(?, alt), sort_order = COALESCE(?, sort_order)
      WHERE id = ?
    `)
    .bind(alt, sortOrder, id)
    .run();
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  await ensureDatabase();

  const { id } = await context.params;
  const record = await getMediaRecord(id);
  if (!record) return Response.json({ error: 'File not found.' }, { status: 404 });
  await env.FILES.delete(record.object_key);
  await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  return Response.json({ ok: true });
}
