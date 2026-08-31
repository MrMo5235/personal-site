import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const siteContent = sqliteTable('site_content', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by').notNull(),
});

export const mediaAssets = sqliteTable(
  'media_assets',
  {
    id: text('id').primaryKey(),
    objectKey: text('object_key').notNull().unique(),
    name: text('name').notNull(),
    contentType: text('content_type').notNull(),
    size: integer('size').notNull(),
    category: text('category', { enum: ['image', 'document'] }).notNull(),
    placement: text('placement', { enum: ['gallery', 'avatar', 'document'] }).notNull().default('gallery'),
    alt: text('alt').notNull().default(''),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull(),
    createdBy: text('created_by').notNull(),
  },
  (table) => [
    index('idx_media_category_sort').on(table.category, table.sortOrder, table.createdAt),
    check('media_assets_category_check', sql`${table.category} IN ('image', 'document')`),
    check('media_assets_placement_check', sql`${table.placement} IN ('gallery', 'avatar', 'document')`),
  ],
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary').notNull().default(''),
    content: text('content').notNull().default(''),
    tags: text('tags').notNull().default('[]'),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => [
    index('idx_notes_published_updated').on(table.published, table.updatedAt),
  ],
);
