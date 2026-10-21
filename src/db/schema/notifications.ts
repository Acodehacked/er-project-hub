import { mysqlTable, varchar, text, boolean, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { users } from './users';

export const notifications = mysqlTable(
  'notifications',
  {
    id: id(),
    userId: uuidRef('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Machine-readable type, e.g. "project.approved" — drives the icon. */
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    message: text('message').notNull(),
    link: varchar('link', { length: 512 }),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('notifications_user_read_idx').on(t.userId, t.isRead, t.createdAt)],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
