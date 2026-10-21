import { mysqlTable, varchar, text } from 'drizzle-orm/mysql-core';
import { id, createdAt, updatedAt } from './columns';

export const departments = mysqlTable('departments', {
  id: id(),
  name: varchar('name', { length: 150 }).notNull().unique(),
  /** Short code shown in badges, e.g. "CSE". */
  code: varchar('code', { length: 20 }).notNull().unique(),
  description: text('description'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
