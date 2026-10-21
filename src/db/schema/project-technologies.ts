import { mysqlTable, primaryKey, index } from 'drizzle-orm/mysql-core';
import { uuidRef } from './columns';
import { projects } from './projects';
import { technologies } from './technologies';

/** Pure join table: the composite primary key prevents duplicate tags. */
export const projectTechnologies = mysqlTable(
  'project_technologies',
  {
    projectId: uuidRef('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    technologyId: uuidRef('technology_id')
      .notNull()
      .references(() => technologies.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.technologyId] }),
    index('project_technologies_technology_idx').on(t.technologyId),
  ],
);

export type ProjectTechnology = typeof projectTechnologies.$inferSelect;
