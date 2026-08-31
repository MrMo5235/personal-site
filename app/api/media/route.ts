import { env } from 'cloudflare:workers';
import { ensureDatabase, listMedia } from '@/db/runtime';
import { requireAdminApi } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

export async function GET() {
  return Response.json(await listMedia(), {
    headers: { 'Cache-Control': 'public, max-age=20, stale-while-revalidate=60' },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  await ensureDatabase();

  const form = await request.formData();
  const file = form.get('file');
  const rawAlt = form.get('alt');
  const rawPlacement = form.get('placement');
  const alt = (typeof rawAlt === 'string' ? rawAlt : '').slice(0, 240);
  if (!(file instanceof File)) {
    return Response.json({ error: 'Please select a file.' }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'Files must be between 1 byte and 10 MB.' }, { status: 413 });
  }

  const category = IMAGE_TYPES.has(file.type)
    ? 'image'
    : DOCUMENT_TYPES.has(file.type)
      ? 'document'
      : null;
  if (!category) {
    return Response.json({ error: 'Unsupported file type.' }, { status: 415 });
  }

  const placement = category === 'document'
    ? 'document'
    : rawPlacement === 'avatar'
      ? 'avatar'
      : 'gallery';

  const id = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const objectKey = `uploads/${id}/${safeName}`;
  const now = new Date().toISOString();
  const currentMax = await env.DB
    .prepare('SELECT COALESCE(MAX(sort_order), -1) AS value FROM media_assets WHERE placement = ?')
    .bind(placement)
    .first<{ value: number }>();
  const sortOrder = Number(currentMax?.value ?? -1) + 1;

  await env.FILES.put(objectKey, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { originalName: safeName, uploadedBy: auth.user.email },
  });

  try {
    await env.DB
      .prepare(`
        INSERT INTO media_assets
          (id, object_key, name, content_type, size, category, placement, alt, sort_order, created_at, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        objectKey,
        safeName,
        file.type,
        file.size,
        category,
        placement,
        alt,
        sortOrder,
        now,
        auth.user.email,
      )
      .run();
  } catch (error) {
    await env.FILES.delete(objectKey);
    throw error;
  }

  return Response.json(
    {
      id,
      name: safeName,
      contentType: file.type,
      size: file.size,
      category,
      placement,
      alt,
      sortOrder,
      createdAt: now,
      url: `/api/media/${id}`,
    },
    { status: 201 },
  );
}

function sanitizeFilename(name: string) {
  const cleaned = name
    .normalize('NFKC')
    .split('')
    .map((character) => character.charCodeAt(0) < 32 || /[\\/:*?"<>|]/.test(character) ? '-' : character)
    .join('')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return cleaned || 'upload.bin';
}
