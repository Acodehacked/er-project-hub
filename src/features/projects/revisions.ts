import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { approvals, projectMembers, projectRevisions, projects, users } from '@/db/schema';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { emptyToNull } from '@/lib/validation/common';
import type { RevisionInput } from '@/lib/validation/project';
import type { ReviewDecisionInput } from '@/lib/validation/review';
import type { CurrentUser, ProjectMemberRole, RevisionChanges, RevisionStatus } from '@/types';
import { findReviewers, notify } from '@/features/notifications/service';
import { getPolicyProject } from './queries';
import { assertRejectionComment } from './workflow';
import { canFinalReviewRevision, canProposeRevision, canScreenRevision, isLeader } from './policy';

/**
 * Revisions = "major edits" to an APPROVED project.
 *
 * The approved version stays live in the repository. The proposed changes are
 * stored as JSON and go through the same two-stage review. Only when the
 * revision is approved are the changes copied onto the live project.
 */

export type TeamChange = { userId: string; role: ProjectMemberRole; roleTitle?: string | null };

async function assertNoOpenRevision(projectId: string) {
  const open = await db.query.projectRevisions.findFirst({
    where: and(eq(projectRevisions.projectId, projectId), inArray(projectRevisions.status, ['SUBMITTED', 'UNDER_REVIEW'])),
    columns: { id: true },
  });
  if (open) throw new ConflictError('There is already a revision waiting for review. Cancel it first to propose another.');
}

async function createRevision(user: CurrentUser, projectId: string, changes: RevisionChanges, note?: string) {
  const project = await getPolicyProject(projectId);
  if (!canProposeRevision(user, project)) throw new ForbiddenError('Revisions can only be proposed for approved projects by their team.');
  await assertNoOpenRevision(projectId);

  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(projectRevisions).values({ id, projectId, proposedById: user.id, changes });
    await tx.insert(approvals).values({
      projectId,
      revisionId: id,
      actorId: user.id,
      action: 'SUBMIT',
      fromStatus: 'NEW',
      toStatus: 'SUBMITTED',
      comment: note || null,
    });
  });

  const reviewers = await findReviewers({ departmentId: project.departmentId, stage: 'screen' });
  await notify({
    userIds: reviewers.filter((r) => !project.members.some((m) => m.userId === r)),
    type: 'revision.submitted',
    title: 'Revision to screen',
    message: `A change to the approved project "${project.title}" needs screening.`,
    link: `/dashboard/reviews/revisions/${id}`,
  });
  return { id };
}

/** Propose changes to title/abstract/description/department/year. Any team member may propose. */
export async function proposeContentRevision(user: CurrentUser, projectId: string, input: RevisionInput) {
  const changes: RevisionChanges = {};
  if (input.title) changes.title = input.title;
  if (input.abstract) changes.abstract = input.abstract;
  if (input.description !== undefined) changes.description = emptyToNull(input.description);
  if (input.departmentId) changes.departmentId = input.departmentId;
  if (input.academicYearId) changes.academicYearId = input.academicYearId;
  return createRevision(user, projectId, changes, input.note);
}

/** Propose a new team composition. Only the leader may change the team. */
export async function proposeTeamRevision(user: CurrentUser, projectId: string, members: TeamChange[], note?: string) {
  const project = await getPolicyProject(projectId);
  if (!isLeader(user, project) && user.role !== 'ADMIN') throw new ForbiddenError('Only the team leader can change the team.');

  const nonLeaders = members.filter((m) => m.userId !== project.leaderId && m.role !== 'LEADER');
  if (nonLeaders.length > 7) throw new ValidationError('A team can have at most 8 members.');
  const ids = [...new Set(nonLeaders.map((m) => m.userId))];
  if (ids.length) {
    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, ids), eq(users.isActive, true), inArray(users.role, ['STUDENT', 'REPRESENTATIVE'])));
    if (found.length !== ids.length) throw new ValidationError('Every member must be an active student.');
  }
  return createRevision(
    user,
    projectId,
    { members: nonLeaders.map((m) => ({ userId: m.userId, role: m.role, roleTitle: emptyToNull(m.roleTitle) })) },
    note,
  );
}

export async function cancelRevision(user: CurrentUser, revisionId: string) {
  const revision = await db.query.projectRevisions.findFirst({ where: eq(projectRevisions.id, revisionId) });
  if (!revision) throw new NotFoundError('Revision not found.');
  const project = await getPolicyProject(revision.projectId);
  if (revision.proposedById !== user.id && !isLeader(user, project) && user.role !== 'ADMIN') throw new ForbiddenError();
  if (revision.status !== 'SUBMITTED' && revision.status !== 'UNDER_REVIEW') throw new ValidationError('This revision is already closed.');

  await db.transaction(async (tx) => {
    await tx.update(projectRevisions).set({ status: 'CANCELLED', decidedAt: new Date() }).where(eq(projectRevisions.id, revisionId));
    await tx.insert(approvals).values({
      projectId: revision.projectId,
      revisionId,
      actorId: user.id,
      action: 'REJECT',
      fromStatus: revision.status,
      toStatus: 'CANCELLED',
      comment: 'Cancelled by the team',
    });
  });
}

async function moveRevision(
  revisionId: string,
  from: RevisionStatus,
  to: RevisionStatus,
  step: { projectId: string; actorId: string; action: 'FORWARD' | 'APPROVE' | 'REJECT'; comment?: string },
  apply?: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<void>,
) {
  await db.transaction(async (tx) => {
    const [res] = await tx
      .update(projectRevisions)
      .set({ status: to, decidedAt: to === 'APPROVED' || to === 'REJECTED' ? new Date() : null })
      .where(and(eq(projectRevisions.id, revisionId), eq(projectRevisions.status, from)));
    if (res.affectedRows === 0) throw new ValidationError('This revision was just updated by someone else. Refresh and try again.');
    await tx.insert(approvals).values({
      projectId: step.projectId,
      revisionId,
      actorId: step.actorId,
      action: step.action,
      fromStatus: from,
      toStatus: to,
      comment: step.comment || null,
    });
    if (apply) await apply(tx);
  });
}

export async function decideRevision(user: CurrentUser, input: ReviewDecisionInput) {
  assertRejectionComment(input);
  const revision = await db.query.projectRevisions.findFirst({ where: eq(projectRevisions.id, input.targetId) });
  if (!revision) throw new NotFoundError('Revision not found.');
  const project = await getPolicyProject(revision.projectId);
  const team = project.members.map((m) => m.userId);
  const link = `/dashboard/projects/${project.id}`;
  const step = { projectId: project.id, actorId: user.id, comment: input.comment };

  if (revision.status === 'SUBMITTED') {
    if (!canScreenRevision(user, project, revision.status)) throw new ForbiddenError('You cannot screen this revision.');
    if (input.decision === 'APPROVE') throw new ValidationError('Screening can only forward or reject.');
    if (input.decision === 'FORWARD') {
      await moveRevision(revision.id, 'SUBMITTED', 'UNDER_REVIEW', { ...step, action: 'FORWARD' });
      const faculty = await findReviewers({ departmentId: project.departmentId, stage: 'final', guideId: project.guideId });
      await notify({ userIds: faculty, type: 'revision.forwarded', title: 'Revision ready for final review', message: `A change to "${project.title}" passed screening.`, link: `/dashboard/reviews/revisions/${revision.id}` });
      return;
    }
  } else if (revision.status === 'UNDER_REVIEW') {
    if (!canFinalReviewRevision(user, project, revision.status)) throw new ForbiddenError('You cannot decide on this revision.');
    if (input.decision === 'FORWARD') throw new ValidationError('Final review can only approve or reject.');
    if (input.decision === 'APPROVE') {
      await moveRevision(revision.id, 'UNDER_REVIEW', 'APPROVED', { ...step, action: 'APPROVE' }, async (tx) => {
        const c = revision.changes;
        const fields: Partial<typeof projects.$inferInsert> = {};
        if (c.title) fields.title = c.title;
        if (c.abstract) fields.abstract = c.abstract;
        if (c.description !== undefined) fields.description = c.description;
        if (c.departmentId) fields.departmentId = c.departmentId;
        if (c.academicYearId) fields.academicYearId = c.academicYearId;
        if (Object.keys(fields).length) await tx.update(projects).set(fields).where(eq(projects.id, project.id));

        if (c.members) {
          // Replace every non-leader member with the approved list.
          await tx
            .delete(projectMembers)
            .where(and(eq(projectMembers.projectId, project.id), inArray(projectMembers.role, ['DEVELOPER', 'DESIGNER', 'RESEARCHER', 'DOCUMENTATION', 'OTHER'])));
          if (c.members.length) {
            await tx.insert(projectMembers).values(c.members.map((m) => ({ projectId: project.id, userId: m.userId, role: m.role, roleTitle: m.roleTitle ?? null })));
          }
        }
      });
      await notify({ userIds: team, type: 'revision.approved', title: 'Revision approved', message: `Your changes to "${project.title}" are now live.`, link: `/projects/${project.slug}` });
      return;
    }
  } else {
    throw new ValidationError('This revision is not waiting for review.');
  }

  await moveRevision(revision.id, revision.status, 'REJECTED', { ...step, action: 'REJECT' });
  await notify({ userIds: team, type: 'revision.rejected', title: 'Revision not accepted', message: `Changes to "${project.title}" were not accepted: ${input.comment ?? ''}`.slice(0, 500), link });
}
