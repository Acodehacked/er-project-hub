import { mysqlTable, varchar, json, index } from 'drizzle-orm/mysql-core';
import { id, uuidRef, createdAt } from './columns';
import { users } from './users';

/** Append-only security/audit trail for sensitive actions. */
export const auditLogs = mysqlTable(
  'audit_logs',
  {
    id: id(),
    userId: uuidRef('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 100 }).notNull(),
    targetEntity: varchar('target_entity', { length: 50 }).notNull(),
    targetId: varchar('target_id', { length: 36 }),
    details: json('details').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: createdAt(),
  },
  (t) => [
    index('audit_logs_created_idx').on(t.createdAt),
    index('audit_logs_target_idx').on(t.targetEntity, t.targetId),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
