import { mysqlTable, mysqlEnum, json, timestamp, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { projects } from './projects';
import { users } from './users';
import { REVISION_STATUSES, type ProjectMemberRole } from './enums';

/** The fields a revision may change ("major edits"). Validated by Zod before insert. */
export type RevisionChanges = {
  title?: string;
  abstract?: string;
  description?: string | null;
  departmentId?: string;
  academicYearId?: string;
  members?: { userId: string; role: ProjectMemberRole; roleTitle?: string | null }[];
};

/**
 * A pending "major edit" to an APPROVED project. The live project stays
 * public while the revision goes through the same two-stage review.
 */
export const projectRevisions = mysqlTable(
  'project_revisions',
  {
    id: id(),
    projectId: uuidRef('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    proposedById: uuidRef('proposed_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: mysqlEnum('status', REVISION_STATUSES).notNull().default('SUBMITTED'),
    changes: json('changes').$type<RevisionChanges>().notNull(),
    decidedAt: timestamp('decided_at'),
    createdAt: createdAt(),
  },
  (t) => [index('project_revisions_project_status_idx').on(t.projectId, t.status)],
);

export type ProjectRevision = typeof projectRevisions.$inferSelect;
export type NewProjectRevision = typeof projectRevisions.$inferInsert;
