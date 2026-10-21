import { mysqlTable, varchar, mysqlEnum, boolean, int, text, timestamp, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt, updatedAt } from './columns';
import { departments } from './departments';
import { USER_ROLES } from './enums';

/**
 * Application users. Auth.js (Credentials provider + JWT sessions) reads this
 * table to verify passwords; it does NOT need its own accounts/sessions tables.
 */
export const users = mysqlTable(
  'users',
  {
    id: id(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    /** Public, permanent handle used in profile URLs: /2026/abinantony */
    username: varchar('username', { length: 30 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: mysqlEnum('role', USER_ROLES).notNull().default('STUDENT'),
    departmentId: uuidRef('department_id').references(() => departments.id, { onDelete: 'set null' }),
    /** College roll / register number. Unique when present (MySQL allows many NULLs). */
    studentIdentifier: varchar('student_identifier', { length: 50 }).unique(),
    /** Students & representatives only. Appears in the public profile URL. */
    graduationYear: int('graduation_year'),
    bio: text('bio'),
    avatarKey: varchar('avatar_key', { length: 512 }),
    githubUrl: varchar('github_url', { length: 512 }),
    linkedinUrl: varchar('linkedin_url', { length: 512 }),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('users_role_idx').on(t.role),
    index('users_department_idx').on(t.departmentId),
    index('users_graduation_year_idx').on(t.graduationYear),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
