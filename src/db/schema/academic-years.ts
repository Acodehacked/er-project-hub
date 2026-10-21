import { mysqlTable, varchar, boolean, int, index } from 'drizzle-orm/mysql-core';
import { id, createdAt } from './columns';

export const academicYears = mysqlTable(
  'academic_years',
  {
    id: id(),
    /** Human label, e.g. "2025-26". */
    label: varchar('label', { length: 20 }).notNull().unique(),
    /** First calendar year of the academic year — used for sorting. */
    startYear: int('start_year').notNull().unique(),
    /** Exactly one row should be current; enforced in the admin service. */
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('academic_years_is_current_idx').on(t.isCurrent)],
);

export type AcademicYear = typeof academicYears.$inferSelect;
export type NewAcademicYear = typeof academicYears.$inferInsert;
