import { mysqlTable, varchar, int, mysqlEnum, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { projects } from './projects';
import { users } from './users';
import { DOCUMENT_KINDS } from './enums';

/** Metadata only — the file itself lives in Cloudflare R2 under `storageKey`. */
export const projectDocuments = mysqlTable(
  'project_documents',
  {
    id: id(),
    projectId: uuidRef('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    kind: mysqlEnum('kind', DOCUMENT_KINDS).notNull().default('OTHER'),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    storageKey: varchar('storage_key', { length: 512 }).notNull().unique(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    fileSize: int('file_size').notNull(),
    uploadedById: uuidRef('uploaded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
  },
  (t) => [index('project_documents_project_idx').on(t.projectId)],
);

export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type NewProjectDocument = typeof projectDocuments.$inferInsert;
