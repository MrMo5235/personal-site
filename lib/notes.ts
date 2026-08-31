import type { NoteInput } from '@/db/runtime';

export function normalizeNoteSlug(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function parseNoteInput(value: unknown): NoteInput | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const slug = normalizeNoteSlug(stringValue(candidate.slug));
  const title = stringValue(candidate.title).trim().slice(0, 160);
  const summary = stringValue(candidate.summary).trim().slice(0, 500);
  const content = stringValue(candidate.content).slice(0, 500_000);
  const tags = Array.isArray(candidate.tags)
    ? [...new Set(candidate.tags.map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 20)
    : [];
  if (!slug || !title) return null;
  return {
    slug,
    title,
    summary,
    content,
    tags,
    published: candidate.published !== false,
  };
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}
