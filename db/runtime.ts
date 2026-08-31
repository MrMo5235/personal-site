import { env } from 'cloudflare:workers';
import { defaultContent } from '@/content/default-content';
import type { MediaAsset, Note, NoteSummary, SiteContent } from '@/content/types';

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
        placement TEXT NOT NULL DEFAULT 'gallery' CHECK (placement IN ('gallery', 'avatar', 'document')),
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
    db.prepare(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '[]',
        published INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      )
    `),
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_notes_published_updated
      ON notes(published, updated_at)
    `),
  ]);

  const mediaColumns = await db.prepare("PRAGMA table_info('media_assets')").all<{ name: string }>();
  if (!(mediaColumns.results || []).some((column) => column.name === 'placement')) {
    await db
      .prepare("ALTER TABLE media_assets ADD COLUMN placement TEXT NOT NULL DEFAULT 'gallery' CHECK (placement IN ('gallery', 'avatar', 'document'))")
      .run();
    await db
      .prepare("UPDATE media_assets SET placement = CASE WHEN category = 'document' THEN 'document' ELSE 'gallery' END")
      .run();
  }

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

  const noteCount = await db.prepare('SELECT COUNT(*) AS value FROM notes').first<{ value: number }>();
  if (Number(noteCount?.value || 0) === 0) {
    const now = new Date().toISOString();
    await db.batch(
      defaultContent.operations.map((operation, index) =>
        db
          .prepare(`
            INSERT INTO notes
              (id, slug, title, summary, content, tags, published, created_at, updated_at, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 'system')
          `)
          .bind(
            crypto.randomUUID(),
            `field-note-${index + 1}`,
            operation.name,
            operation.description,
            `# ${operation.name}\n\n${operation.description}\n\n## Stack\n\n${operation.stack.map((item) => `- ${item}`).join('\n')}`,
            JSON.stringify(operation.stack),
            now,
            now,
          ),
      ),
    );
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
    const parsed = JSON.parse(row.data) as SiteContent;
    const upgraded = upgradeLegacyBrand(parsed);
    if (upgraded !== parsed) {
      const now = new Date().toISOString();
      await db
        .prepare('UPDATE site_content SET data = ?, updated_at = ?, updated_by = ? WHERE id = ?')
        .bind(JSON.stringify(upgraded), now, 'system-brand-upgrade', 'primary')
        .run();
    }
    return upgraded;
  } catch {
    return defaultContent;
  }
}

function upgradeLegacyBrand(content: SiteContent): SiteContent {
  const brandName = content.brand?.name.trim().toUpperCase();
  const isPhantomBrand = brandName === 'PHANTOM X';
  const usesOldAnt1volveMark = brandName === 'ANT1VOLVE 5'
    && (content.brand.mark.toUpperCase() === 'AV5' || /^AV5-/i.test(content.player.id));

  if (!isPhantomBrand && !usesOldAnt1volveMark) return content;

  if (usesOldAnt1volveMark) {
    return {
      ...content,
      brand: { ...content.brand, mark: 'A5' },
      player: { ...content.player, id: content.player.id.replace(/^AV5-/i, 'A5-') },
    };
  }

  return {
    ...content,
    meta: {
      title: 'ANT1VOLVE 5 // True Evolution Profile',
      description: '拒绝无意义的竞争，选择真正的进化。',
    },
    brand: {
      name: 'ANT1VOLVE 5',
      mark: 'A5',
      division: 'ANTI-INVOLUTION // TRUE EVOLUTION',
    },
    gallery: {
      ...content.gallery,
      images: content.gallery.images.map((image) => ({
        ...image,
        src: image.src === '/og.jpg' ? '/og.png' : image.src,
        alt: image.alt.replace(/PHANTOM X/gi, 'ANT1VOLVE 5'),
      })),
    },
    player: {
      ...content.player,
      id: content.player.id.replace(/^PX-/i, 'A5-'),
      tagline: '拒绝无意义的竞争，选择真正的进化。',
      focus: 'ANTI-INVOLUTION // CONTINUOUS EVOLUTION',
      status: 'EVOLVING // ONLINE',
    },
    contact: {
      ...content.contact,
      message: '不追逐无意义的竞争，把时间留给真正的成长、创造与合作。如果你认同这种节奏，建立通信。',
    },
  };
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
  placement: 'gallery' | 'avatar' | 'document';
  alt: string;
  sort_order: number;
  created_at: string;
};

export async function listMedia(): Promise<MediaAsset[]> {
  await ensureDatabase();
  const { db } = getBindings();
  const result = await db
    .prepare(`
      SELECT id, name, content_type, size, category, placement, alt, sort_order, created_at
      FROM media_assets
      ORDER BY placement ASC, sort_order ASC, created_at DESC
    `)
    .all<MediaRow>();
  return (result.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    contentType: row.content_type,
    size: row.size,
    category: row.category,
    placement: row.placement,
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
      SELECT id, object_key, name, content_type, size, category, placement, alt, sort_order, created_at
      FROM media_assets WHERE id = ?
    `)
    .bind(id)
    .first<MediaRow & { object_key: string }>();
}

type NoteRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  tags: string;
  published: number;
  created_at: string;
  updated_at: string;
  updated_by: string;
};

function mapNote(row: NoteRow): Note {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.map(String);
  } catch {
    tags = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    tags,
    published: Boolean(row.published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export async function listNotes(includeDrafts = false): Promise<NoteSummary[]> {
  await ensureDatabase();
  const { db } = getBindings();
  const query = includeDrafts
    ? `SELECT id, slug, title, summary, '' AS content, tags, published, created_at, updated_at, updated_by
       FROM notes ORDER BY updated_at DESC`
    : `SELECT id, slug, title, summary, '' AS content, tags, published, created_at, updated_at, updated_by
       FROM notes WHERE published = 1 ORDER BY updated_at DESC`;
  const result = await db.prepare(query).all<NoteRow>();
  return (result.results || []).map((row) => {
    const { content: _ignoredContent, updatedBy: _ignoredBy, ...summary } = mapNote(row);
    return summary;
  });
}

export async function getNoteBySlug(slug: string, includeDraft = false): Promise<Note | null> {
  await ensureDatabase();
  const { db } = getBindings();
  const row = await db
    .prepare(`
      SELECT id, slug, title, summary, content, tags, published, created_at, updated_at, updated_by
      FROM notes WHERE slug = ? ${includeDraft ? '' : 'AND published = 1'}
    `)
    .bind(slug)
    .first<NoteRow>();
  return row ? mapNote(row) : null;
}

export type NoteInput = Pick<Note, 'slug' | 'title' | 'summary' | 'content' | 'tags' | 'published'>;

export async function createNote(input: NoteInput, userEmail: string): Promise<Note> {
  await ensureDatabase();
  const { db } = getBindings();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(`
      INSERT INTO notes
        (id, slug, title, summary, content, tags, published, created_at, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      input.slug,
      input.title,
      input.summary,
      input.content,
      JSON.stringify(input.tags),
      input.published ? 1 : 0,
      now,
      now,
      userEmail,
    )
    .run();
  return (await getNoteBySlug(input.slug, true))!;
}

export async function updateNote(id: string, input: NoteInput, userEmail: string): Promise<Note | null> {
  await ensureDatabase();
  const { db } = getBindings();
  const now = new Date().toISOString();
  const result = await db
    .prepare(`
      UPDATE notes SET
        slug = ?, title = ?, summary = ?, content = ?, tags = ?, published = ?,
        updated_at = ?, updated_by = ?
      WHERE id = ?
    `)
    .bind(
      input.slug,
      input.title,
      input.summary,
      input.content,
      JSON.stringify(input.tags),
      input.published ? 1 : 0,
      now,
      userEmail,
      id,
    )
    .run();
  if (!result.meta.changes) return null;
  return getNoteBySlug(input.slug, true);
}

export async function deleteNote(id: string): Promise<boolean> {
  await ensureDatabase();
  const { db } = getBindings();
  const result = await db.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
  return Boolean(result.meta.changes);
}
