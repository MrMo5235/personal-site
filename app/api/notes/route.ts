import { createNote, listNotes } from '@/db/runtime';
import { requireAdminApi } from '@/lib/admin-auth';
import { parseNoteInput } from '@/lib/notes';

export async function GET(request: Request) {
  const includeDrafts = new URL(request.url).searchParams.get('all') === '1';
  if (includeDrafts) {
    const auth = await requireAdminApi();
    if (auth.response) return auth.response;
  }
  return Response.json(await listNotes(includeDrafts), {
    headers: { 'Cache-Control': includeDrafts ? 'no-store' : 'public, max-age=20, stale-while-revalidate=60' },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const input = parseNoteInput(await request.json().catch(() => null));
  if (!input) return Response.json({ error: '标题和有效的英文 URL 标识不能为空。' }, { status: 400 });
  try {
    return Response.json(await createNote(input, auth.user.email), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/unique|constraint/i.test(message)) {
      return Response.json({ error: '这个 URL 标识已被其他笔记使用。' }, { status: 409 });
    }
    throw error;
  }
}
