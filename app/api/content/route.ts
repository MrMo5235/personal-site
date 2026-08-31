import { isSiteContent } from '@/content/default-content';
import { readSiteContent, writeSiteContent } from '@/db/runtime';
import { requireAdminApi } from '@/lib/admin-auth';

export async function GET() {
  return Response.json(await readSiteContent(), {
    headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
  });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (auth.response) return auth.response;

  const raw = await request.text();
  if (raw.length > 1_000_000) {
    return Response.json({ error: 'Configuration is too large.' }, { status: 413 });
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Configuration must be valid JSON.' }, { status: 400 });
  }
  if (!isSiteContent(value)) {
    return Response.json({ error: 'Configuration is missing required sections.' }, { status: 400 });
  }

  await writeSiteContent(value, auth.user.email);
  return Response.json({ ok: true, content: value });
}
