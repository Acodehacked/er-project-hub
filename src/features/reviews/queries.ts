import 'server-only';
import { and, asc, count, desc, eq, isNull, notExists, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { approvals, projectMembers, projectRevisions, projects } from '@/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import type { CurrentUser } from '@/types';
import { publicUserColumns } from '@/features/projects/queries';

/**
 * Review queues mirror the policy rules in features/projects/policy.ts:
 *  - screening: SUBMITTED, same department, not my own project
 *  - final:     UNDER_REVIEW, my guided projects OR (no guide AND my department)
 * Admins see everything.
 */

const notMyProject = (userId: string) =>
  notExists(
    db
      .select({ one: sql`1` })
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projects.id), eq(projectMembers.userId, userId))),
  );

function screeningScope(user: CurrentUser): SQL | undefined {
  if (!hasPermission(user, 'review:screen')) return sql`false`;
  if (user.role === 'ADMIN') return undefined;
  return and(eq(projects.departmentId, user.departmentId ?? '__none__'), notMyProject(user.id));
}

function finalScope(user: CurrentUser): SQL | undefined {
  if (!hasPermission(user, 'review:final')) return sql`false`;
  if (user.role === 'ADMIN') return undefined;
  return and(
    or(eq(projects.guideId, user.id), and(isNull(projects.guideId), eq(projects.departmentId, user.departmentId ?? '__none__'))),
    notMyProject(user.id),
  );
}

const queueWith = {
  department: { columns: { code: true, name: true } },
  academicYear: { columns: { label: true } },
  leader: { columns: publicUserColumns },
  guide: { columns: publicUserColumns },
  members: { columns: { id: true } },
} as const;

export function getScreeningQueue(user: CurrentUser) {
  return db.query.projects.findMany({
    where: and(eq(projects.status, 'SUBMITTED'), screeningScope(user)),
    orderBy: [asc(projects.submittedAt)],
    with: queueWith,
  });
}

export function getFinalQueue(user: CurrentUser) {
  return db.query.projects.findMany({
    where: and(eq(projects.status, 'UNDER_REVIEW'), finalScope(user)),
    // Projects I personally guide first, then oldest first.
    orderBy: [desc(sql`${projects.guideId} = ${user.id}`), asc(projects.submittedAt)],
    with: queueWith,
  });
}

export async function getRevisionQueue(user: CurrentUser) {
  const stages: SQL[] = [];
  const screen = screeningScope(user);
  const final = finalScope(user);
  if (hasPermission(user, 'review:screen')) stages.push(and(eq(projectRevisions.status, 'SUBMITTED'), screen ?? sql`true`)!);
  if (hasPermission(user, 'review:final')) stages.push(and(eq(projectRevisions.status, 'UNDER_REVIEW'), final ?? sql`true`)!);
  if (stages.length === 0) return [];

  const rows = await db
    .select({ id: projectRevisions.id })
    .from(projectRevisions)
    .innerJoin(projects, eq(projects.id, projectRevisions.projectId))
    .where(or(...stages))
    .orderBy(asc(projectRevisions.createdAt));
  if (rows.length === 0) return [];

  return db.query.projectRevisions.findMany({
    where: (r, { inArray }) => inArray(r.id, rows.map((x) => x.id)),
    orderBy: [asc(projectRevisions.createdAt)],
    with: {
      proposedBy: { columns: publicUserColumns },
      project: { columns: { id: true, title: true, slug: true }, with: { department: { columns: { code: true } } } },
    },
  });
}

/** Badge counts for the sidebar. */
export async function getReviewCounts(user: CurrentUser) {
  const [screen, final, revisions] = await Promise.all([
    hasPermission(user, 'review:screen')
      ? db.select({ value: count() }).from(projects).where(and(eq(projects.status, 'SUBMITTED'), screeningScope(user)))
      : Promise.resolve([{ value: 0 }]),
    hasPermission(user, 'review:final')
      ? db.select({ value: count() }).from(projects).where(and(eq(projects.status, 'UNDER_REVIEW'), finalScope(user)))
      : Promise.resolve([{ value: 0 }]),
    getRevisionQueue(user).then((r) => [{ value: r.length }]),
  ]);
  const s = screen[0]?.value ?? 0;
  const f = final[0]?.value ?? 0;
  const r = revisions[0]?.value ?? 0;
  return { screening: s, final: f, revisions: r, total: s + f + r };
}

/** Decisions this reviewer made recently. */
export function getRecentDecisions(userId: string, limit = 8) {
  return db.query.approvals.findMany({
    where: and(eq(approvals.actorId, userId), or(eq(approvals.action, 'APPROVE'), eq(approvals.action, 'REJECT'), eq(approvals.action, 'FORWARD'))),
    orderBy: [desc(approvals.createdAt)],
    limit,
    with: { project: { columns: { id: true, title: true, slug: true, status: true } } },
  });
}

export function getRevisionById(id: string) {
  return db.query.projectRevisions.findFirst({
    where: eq(projectRevisions.id, id),
    with: {
      proposedBy: { columns: publicUserColumns },
      approvals: { orderBy: [asc(approvals.createdAt)], with: { actor: { columns: publicUserColumns } } },
    },
  });
}
