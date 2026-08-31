PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`name` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`category` text NOT NULL,
	`placement` text DEFAULT 'gallery' NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	CONSTRAINT "media_assets_category_check" CHECK("__new_media_assets"."category" IN ('image', 'document')),
	CONSTRAINT "media_assets_placement_check" CHECK("__new_media_assets"."placement" IN ('gallery', 'avatar', 'document'))
);
--> statement-breakpoint
INSERT INTO `__new_media_assets`("id", "object_key", "name", "content_type", "size", "category", "placement", "alt", "sort_order", "created_at", "created_by") SELECT "id", "object_key", "name", "content_type", "size", "category", CASE WHEN "category" = 'document' THEN 'document' ELSE 'gallery' END, "alt", "sort_order", "created_at", "created_by" FROM `media_assets`;--> statement-breakpoint
DROP TABLE `media_assets`;--> statement-breakpoint
ALTER TABLE `__new_media_assets` RENAME TO `media_assets`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_object_key_unique` ON `media_assets` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_media_category_sort` ON `media_assets` (`category`,`sort_order`,`created_at`);
