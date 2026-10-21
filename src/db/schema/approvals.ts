import { mysqlTable, text, mysqlEnum, varchar, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { projects } from './projects';
import { users } from './users';
import { projectRevisions } from './revisions';
import { APPROVAL_ACTIONS } from './enums';

/**
 * Immutable history of every workflow step (the project "timeline").
 * When `revisionId` is set, the step belongs to a revision review and
 * from/to are revision statuses.
 */
export const approvals = mysqlTable(
  'approvals',
  {
    id: id(),
    projectId: uuidRef('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    revisionId: uuidRef('revision_id').references(() => projectRevisions.id, { onDelete: 'cascade' }),
    actorId: uuidRef('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    action: mysqlEnum('action', APPROVAL_ACTIONS).notNull(),
    fromStatus: varchar('from_status', { length: 20 }).notNull(),
    toStatus: varchar('to_status', { length: 20 }).notNull(),
    comment: text('comment'),
    createdAt: createdAt(),
  },
  (t) => [
    index('approvals_project_idx').on(t.projectId, t.createdAt),
    index('approvals_actor_idx').on(t.actorId),
  ],
);

export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
