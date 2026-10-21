import { mysqlTable, varchar, int, boolean, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { projects } from './projects';
import { users } from './users';

export const projectImages = mysqlTable(
  'project_images',
  {
    id: id(),
    projectId: uuidRef('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull().unique(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    fileSize: int('file_size').notNull(),
    caption: varchar('caption', { length: 200 }),
    /** The cover image shown on cards. At most one per project (service-enforced). */
    isCover: boolean('is_cover').notNull().default(false),
    displayOrder: int('display_order').notNull().default(0),
    uploadedById: uuidRef('uploaded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
  },
  (t) => [index('project_images_project_idx').on(t.projectId)],
);

export type ProjectImage = typeof projectImages.$inferSelect;
export type NewProjectImage = typeof projectImages.$inferInsert;
