import { env } from 'cloudflare:workers';
import { defaultContent } from '@/content/default-content';
import type { MediaAsset, SiteContent } from '@/content/types';

let schemaReady: Promise<void> | null = null;

export function getBindings() {
  if (!env.DB) throw new Error('Database binding DB is unavailable.');
  if (!env.FILES) throw new Error('Object storage binding FILES is unavailable.');
  return { db: env.DB, files: env.FILES };
}

export async function ensureDatabase() {
  if (schemaReady) return schemaReady;
  schemaReady = initializeDatabase().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function initializeDatabase() {
  const { db } = getBindings();
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS site_content (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        object_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('image', 'document')),
        alt TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        created_by TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_media_category_sort
      ON media_assets(category, sort_order, created_at)
    `),
  ]);

  const existing = await db
    .prepare('SELECT id FROM site_content WHERE id = ?')
    .bind('primary')
    .first();
  if (!existing) {
    const now = new Date().toISOString();
    await db
      .prepare(
        'INSERT INTO site_content (id, data, updated_at, updated_by) VALUES (?, ?, ?, ?)',
      )
      .bind('primary', JSON.stringify(defaultContent), now, 'system')
      .run();
  }
}

export async function readSiteContent(): Promise<SiteContent> {
  await ensureDatabase();
  const { db } = getBindings();
  const row = await db
    .prepare('SELECT data FROM site_content WHERE id = ?')
    .bind('primary')
    .first<{ data: string }>();
  if (!row) return defaultContent;
  try {
    return JSON.parse(row.data) as SiteContent;
  } catch {
    return defaultContent;
  }
}

export async function writeSiteContent(content: SiteContent, userEmail: string) {
  await ensureDatabase();
  const { db } = getBindings();
  const now = new Date().toISOString();
  await db
    .prepare(`
      INSERT INTO site_content (id, data, updated_at, updated_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `)
    .bind('primary', JSON.stringify(content), now, userEmail)
    .run();
}

type MediaRow = {
  id: string;
  name: string;
  content_type: string;
  size: number;
  category: 'image' | 'document';
  alt: string;
  sort_order: number;
  created_at: string;
};

export async function listMedia(): Promise<MediaAsset[]> {
  await ensureDatabase();
  const { db } = getBindings();
  const result = await db
    .prepare(`
      SELECT id, name, content_type, size, category, alt, sort_order, created_at
      FROM media_assets
      ORDER BY category ASC, sort_order ASC, created_at DESC
    `)
    .all<MediaRow>();
  return (result.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    contentType: row.content_type,
    size: row.size,
    category: row.category,
    alt: row.alt,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    url: `/api/media/${row.id}`,
  }));
}

export async function getMediaRecord(id: string) {
  await ensureDatabase();
  const { db } = getBindings();
  return db
    .prepare(`
      SELECT id, object_key, name, content_type, size, category, alt, sort_order, created_at
      FROM media_assets WHERE id = ?
    `)
    .bind(id)
    .first<MediaRow & { object_key: string }>();
}
