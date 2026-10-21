import { mysqlTable, varchar, mysqlEnum } from 'drizzle-orm/mysql-core';
import { id, createdAt } from './columns';
import { TECHNOLOGY_CATEGORIES } from './enums';

export const technologies = mysqlTable('technologies', {
  id: id(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  slug: varchar('slug', { length: 90 }).notNull().unique(),
  category: mysqlEnum('category', TECHNOLOGY_CATEGORIES).notNull().default('OTHER'),
  createdAt: createdAt(),
});

export type Technology = typeof technologies.$inferSelect;
export type NewTechnology = typeof technologies.$inferInsert;
