import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db, type Transaction } from '@/db';
import { notifications, users } from '@/db/schema';
import { emailChannel } from './email';

export type NotificationType =
  | 'project.submitted'
  | 'project.forwarded'
  | 'project.approved'
  | 'project.rejected'
  | 'project.archived'
  | 'revision.submitted'
  | 'revision.forwarded'
  | 'revision.approved'
  | 'revision.rejected'
  | 'team.added'
  | 'team.removed'
  | 'guide.assigned'
  | 'account.updated';

export type NotifyInput = {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

/**
 * The ONE way to notify users. Today it writes in-app notifications; later
 * the email channel (currently a no-op stub) will send emails too — callers
 * do not change.
 *
 * Pass `tx` to create notifications inside the same transaction as the
 * change that caused them.
 */
export async function notify(input: NotifyInput, tx?: Transaction) {
  const userIds = [...new Set(input.userIds)].filter(Boolean);
  if (userIds.length === 0) return;

  await (tx ?? db).insert(notifications).values(
    userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
    })),
  );

  // Email delivery must never break the request.
  emailChannel.send(input).catch((error) => console.error('[notify] email channel failed:', error));
}

/** Ids of active reviewers who should hear about a project in a given stage. */
export async function findReviewers(params: {
  departmentId: string;
  stage: 'screen' | 'final';
  guideId?: string | null;
}): Promise<string[]> {
  if (params.stage === 'final' && params.guideId) return [params.guideId];

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.departmentId, params.departmentId),
        eq(users.isActive, true),
        inArray(users.role, params.stage === 'screen' ? ['REPRESENTATIVE'] : ['FACULTY']),
      ),
    );
  return rows.map((r) => r.id);
}
