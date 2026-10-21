import { mysqlTable, varchar, mysqlEnum, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { projects } from './projects';
import { users } from './users';
import { PROJECT_MEMBER_ROLES } from './enums';

/** Many-to-many between users and projects, carrying the member's team role. */
export const projectMembers = mysqlTable(
  'project_members',
  {
    id: id(),
    projectId: uuidRef('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuidRef('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: mysqlEnum('role', PROJECT_MEMBER_ROLES).notNull().default('DEVELOPER'),
    /** Free-text title, e.g. "Firmware lead". */
    roleTitle: varchar('role_title', { length: 80 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('project_members_project_user_uq').on(t.projectId, t.userId),
    index('project_members_user_idx').on(t.userId),
  ],
);

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;
