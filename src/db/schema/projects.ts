import { mysqlTable, varchar, text, mysqlEnum, boolean, int, timestamp, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt, updatedAt } from './columns';
import { users } from './users';
import { departments } from './departments';
import { academicYears } from './academic-years';
import { PROJECT_STATUSES } from './enums';

/**
 * Note: a FULLTEXT index on (title, abstract) is added by a custom SQL
 * migration because Drizzle cannot declare FULLTEXT indexes for MySQL.
 */
export const projects = mysqlTable(
  'projects',
  {
    id: id(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull().unique(),
    abstract: text('abstract').notNull(),
    description: text('description'),
    academicYearId: uuidRef('academic_year_id')
      .notNull()
      .references(() => academicYears.id, { onDelete: 'restrict' }),
    departmentId: uuidRef('department_id')
      .notNull()
      .references(() => departments.id, { onDelete: 'restrict' }),
    status: mysqlEnum('status', PROJECT_STATUSES).notNull().default('DRAFT'),
    /** The student who leads the project; also stored as a LEADER member. */
    leaderId: uuidRef('leader_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Optional faculty guide. When set, only they make the final decision. */
    guideId: uuidRef('guide_id').references(() => users.id, { onDelete: 'set null' }),
    githubUrl: varchar('github_url', { length: 512 }),
    demoUrl: varchar('demo_url', { length: 512 }),
    viewsCount: int('views_count').notNull().default(0),
    isFeatured: boolean('is_featured').notNull().default(false),
    submittedAt: timestamp('submitted_at'),
    approvedAt: timestamp('approved_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('projects_status_idx').on(t.status),
    index('projects_department_status_idx').on(t.departmentId, t.status),
    index('projects_academic_year_idx').on(t.academicYearId),
    index('projects_leader_idx').on(t.leaderId),
    index('projects_guide_idx').on(t.guideId),
    index('projects_approved_at_idx').on(t.approvedAt),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
