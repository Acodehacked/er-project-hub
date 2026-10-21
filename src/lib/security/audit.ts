import 'server-only';
import { headers } from 'next/headers';
import { db, type Transaction } from '@/db';
import { auditLogs } from '@/db/schema';

export type AuditEvent = {
  userId: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  details?: Record<string, unknown>;
};

/** Best-effort client IP from proxy headers. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

/**
 * Record a sensitive action. Pass `tx` to write inside an existing
 * transaction (so the log rolls back with the change). Audit failures never
 * break the user's request.
 */
export async function logAudit(event: AuditEvent, tx?: Transaction) {
  try {
    const ipAddress = await getClientIp().catch(() => null);
    await (tx ?? db).insert(auditLogs).values({
      userId: event.userId,
      action: event.action,
      targetEntity: event.targetEntity,
      targetId: event.targetId ?? null,
      details: event.details ?? null,
      ipAddress,
    });
  } catch (error) {
    console.error('[audit] Failed to write audit log:', error);
  }
}
