import 'server-only';
import { and, asc, count, desc, eq, inArray, isNull, notExists, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import { academicYears, approvals, departments, projectMembers, projectRevisions, projects, users } from '@/db/schema';
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

async function fetchQueueProjects(
  where: SQL | undefined,
  orderBy: (SQL | SQL.Aliased)[],
) {
  const leader = alias(users, 'leader');
  const guide = alias(users, 'guide');

  const rows = await db
    .select({
      project: projects,
      department: {
        code: departments.code,
        name: departments.name,
      },
      academicYear: {
        label: academicYears.label,
      },
      leader: {
        id: leader.id,
        name: leader.name,
        username: leader.username,
        role: leader.role,
        graduationYear: leader.graduationYear,
        avatarKey: leader.avatarKey,
      },
      guide: {
        id: guide.id,
        name: guide.name,
        username: guide.username,
        role: guide.role,
        graduationYear: guide.graduationYear,
        avatarKey: guide.avatarKey,
      },
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .innerJoin(academicYears, eq(projects.academicYearId, academicYears.id))
    .innerJoin(leader, eq(projects.leaderId, leader.id))
    .leftJoin(guide, eq(projects.guideId, guide.id))
    .where(where)
    .orderBy(...orderBy);

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.project.id);
  const membersRows = await db
    .select({ id: projectMembers.id, projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(inArray(projectMembers.projectId, ids));

  const membersByProject = new Map<string, { id: string }[]>();
  for (const m of membersRows) {
    const list = membersByProject.get(m.projectId) ?? [];
    list.push({ id: m.id });
    membersByProject.set(m.projectId, list);
  }

  return rows.map((r) => ({
    ...r.project,
    department: r.department,
    academicYear: r.academicYear,
    leader: r.leader,
    guide: r.guide?.id ? r.guide : null,
    members: membersByProject.get(r.project.id) ?? [],
  }));
}

export function getScreeningQueue(user: CurrentUser) {
  return fetchQueueProjects(
    and(eq(projects.status, 'SUBMITTED'), screeningScope(user)),
    [asc(projects.submittedAt)],
  );
}

export function getFinalQueue(user: CurrentUser) {
  return fetchQueueProjects(
    and(eq(projects.status, 'UNDER_REVIEW'), finalScope(user)),
    [desc(sql`${projects.guideId} = ${user.id}`), asc(projects.submittedAt)],
  );
}

export async function getRevisionQueue(user: CurrentUser) {
  const stages: SQL[] = [];
  const screen = screeningScope(user);
  const final = finalScope(user);
  if (hasPermission(user, 'review:screen')) stages.push(and(eq(projectRevisions.status, 'SUBMITTED'), screen ?? sql`true`)!);
  if (hasPermission(user, 'review:final')) stages.push(and(eq(projectRevisions.status, 'UNDER_REVIEW'), final ?? sql`true`)!);
  if (stages.length === 0) return [];

  const rows = await db
    .select({
      revision: projectRevisions,
      proposedBy: {
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        graduationYear: users.graduationYear,
        avatarKey: users.avatarKey,
      },
      project: {
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
      },
      department: {
        code: departments.code,
      },
    })
    .from(projectRevisions)
    .innerJoin(projects, eq(projects.id, projectRevisions.projectId))
    .innerJoin(users, eq(projectRevisions.proposedById, users.id))
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .where(or(...stages))
    .orderBy(asc(projectRevisions.createdAt));

  return rows.map((r) => ({
    ...r.revision,
    proposedBy: r.proposedBy,
    project: {
      ...r.project,
      department: r.department,
    },
  }));
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
export async function getRecentDecisions(userId: string, limit = 8) {
  const rows = await db
    .select({
      approval: approvals,
      project: {
        id: projects.id,
        title: projects.title,
        slug: projects.slug,
        status: projects.status,
      },
    })
    .from(approvals)
    .innerJoin(projects, eq(approvals.projectId, projects.id))
    .where(
      and(
        eq(approvals.actorId, userId),
        or(eq(approvals.action, 'APPROVE'), eq(approvals.action, 'REJECT'), eq(approvals.action, 'FORWARD')),
      ),
    )
    .orderBy(desc(approvals.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r.approval,
    project: r.project,
  }));
}

export async function getRevisionById(id: string) {
  const [row] = await db
    .select({
      revision: projectRevisions,
      proposedBy: {
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        graduationYear: users.graduationYear,
        avatarKey: users.avatarKey,
      },
    })
    .from(projectRevisions)
    .innerJoin(users, eq(projectRevisions.proposedById, users.id))
    .where(eq(projectRevisions.id, id))
    .limit(1);

  if (!row) return undefined;

  const approvalsRows = await db
    .select({
      approval: approvals,
      actor: {
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        graduationYear: users.graduationYear,
        avatarKey: users.avatarKey,
      },
    })
    .from(approvals)
    .innerJoin(users, eq(approvals.actorId, users.id))
    .where(eq(approvals.revisionId, id))
    .orderBy(asc(approvals.createdAt));

  return {
    ...row.revision,
    proposedBy: row.proposedBy,
    approvals: approvalsRows.map((a) => ({
      ...a.approval,
      actor: a.actor,
    })),
  };
}

