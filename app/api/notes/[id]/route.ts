import { deleteNote, updateNote } from '@/db/runtime';
import { requireAdminApi } from '@/lib/admin-auth';
import { parseNoteInput } from '@/lib/notes';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const input = parseNoteInput(await request.json().catch(() => null));
  if (!input) return Response.json({ error: '标题和有效的英文 URL 标识不能为空。' }, { status: 400 });
  const { id } = await context.params;
  try {
    const note = await updateNote(id, input, auth.user.email);
    return note
      ? Response.json(note)
      : Response.json({ error: 'Note not found.' }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/unique|constraint/i.test(message)) {
      return Response.json({ error: '这个 URL 标识已被其他笔记使用。' }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  return (await deleteNote(id))
    ? Response.json({ deleted: true })
    : Response.json({ error: 'Note not found.' }, { status: 404 });
}
