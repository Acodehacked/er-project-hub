import 'server-only';
import { and, count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { approvals, projectTechnologies, projects } from '@/db/schema';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import type { ReviewDecisionInput } from '@/lib/validation/review';
import type { ApprovalAction, CurrentUser, ProjectStatus } from '@/types';
import { findReviewers, notify } from '@/features/notifications/service';
import { getPolicyProject } from './queries';
import { canArchive, canFinalReview, canScreen, canSubmit } from './policy';

/**
 * The project lifecycle as an explicit state machine.
 *
 *   DRAFT ──submit──▶ SUBMITTED ──forward (rep)──▶ UNDER_REVIEW ──approve (faculty)──▶ APPROVED
 *     ▲                   │                            │
 *     │                reject (rep)              reject (faculty)
 *     │                   ▼                            ▼
 *     └──(edit)──── REJECTED ◀─────────────────────────┘   (student fixes, then resubmits)
 *
 *   Admin: any ──archive──▶ ARCHIVED ──unarchive──▶ APPROVED (or DRAFT if never approved)
 *
 * Every transition writes an `approvals` row, so the full history is kept.
 */
export const TRANSITIONS: Record<ApprovalAction, { from: ProjectStatus[]; to: ProjectStatus | null }> = {
  SUBMIT: { from: ['DRAFT', 'REJECTED'], to: 'SUBMITTED' },
  FORWARD: { from: ['SUBMITTED'], to: 'UNDER_REVIEW' },
  APPROVE: { from: ['UNDER_REVIEW'], to: 'APPROVED' },
  REJECT: { from: ['SUBMITTED', 'UNDER_REVIEW'], to: 'REJECTED' },
  ARCHIVE: { from: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'], to: 'ARCHIVED' },
  UNARCHIVE: { from: ['ARCHIVED'], to: null }, // computed
};

async function recordTransition(params: {
  projectId: string;
  actorId: string;
  action: ApprovalAction;
  from: ProjectStatus;
  to: ProjectStatus;
  comment?: string | null;
  extra?: Partial<typeof projects.$inferInsert>;
}) {
  await db.transaction(async (tx) => {
    // The WHERE on the current status makes this an optimistic lock: if two
    // reviewers click at the same time, only the first update matches.
    const [result] = await tx
      .update(projects)
      .set({ status: params.to, ...params.extra })
      .where(and(eq(projects.id, params.projectId), eq(projects.status, params.from)));
    if (result.affectedRows === 0) {
      throw new ValidationError('This project was just updated by someone else. Refresh and try again.');
    }
    await tx.insert(approvals).values({
      projectId: params.projectId,
      actorId: params.actorId,
      action: params.action,
      fromStatus: params.from,
      toStatus: params.to,
      comment: params.comment || null,
    });
  });
}

/** Teams must be told what to fix — enforced here as well as in the Zod schema. */
export function assertRejectionComment(input: ReviewDecisionInput) {
  if (input.decision === 'REJECT' && (input.comment?.trim().length ?? 0) < 10) {
    throw new ValidationError('Explain what needs to change (at least 10 characters).', { comment: ['Required when requesting changes'] });
  }
}

/** Leader submits a DRAFT/REJECTED project for review. */
export async function submitProject(user: CurrentUser, projectId: string) {
  const project = await getPolicyProject(projectId);
  if (!canSubmit(user, project)) throw new ForbiddenError('Only the team leader can submit, and only drafts or rejected projects.');

  const [tech] = await db
    .select({ value: count() })
    .from(projectTechnologies)
    .where(eq(projectTechnologies.projectId, projectId));
  if (!tech || tech.value === 0) throw new ValidationError('Add at least one technology before submitting.');

  const resubmission = project.status === 'REJECTED';
  await recordTransition({
    projectId,
    actorId: user.id,
    action: 'SUBMIT',
    from: project.status,
    to: 'SUBMITTED',
    extra: { submittedAt: new Date() },
  });

  const reviewers = await findReviewers({ departmentId: project.departmentId, stage: 'screen' });
  await notify({
    userIds: reviewers.filter((id) => !project.members.some((m) => m.userId === id)),
    type: 'project.submitted',
    title: resubmission ? 'Project resubmitted for screening' : 'New project to screen',
    message: `"${project.title}" is waiting for screening.`,
    link: `/dashboard/reviews/${projectId}`,
  });
}

/** A reviewer forwards, approves or rejects a project. */
export async function decideProject(user: CurrentUser, input: ReviewDecisionInput) {
  assertRejectionComment(input);
  const project = await getPolicyProject(input.targetId);
  const team = project.members.map((m) => m.userId);
  const link = `/dashboard/projects/${project.id}`;

  if (project.status === 'SUBMITTED') {
    if (!canScreen(user, project)) throw new ForbiddenError('You cannot screen this project.');
    if (input.decision === 'APPROVE') throw new ValidationError('Screening can only forward or reject.');

    if (input.decision === 'FORWARD') {
      await recordTransition({ projectId: project.id, actorId: user.id, action: 'FORWARD', from: 'SUBMITTED', to: 'UNDER_REVIEW', comment: input.comment });
      const faculty = await findReviewers({ departmentId: project.departmentId, stage: 'final', guideId: project.guideId });
      await notify({ userIds: faculty, type: 'project.forwarded', title: 'Project ready for final review', message: `"${project.title}" passed screening.`, link: `/dashboard/reviews/${project.id}` });
      await notify({ userIds: team, type: 'project.forwarded', title: 'Your project passed screening', message: `"${project.title}" is now with faculty for the final review.`, link });
      return;
    }
  } else if (project.status === 'UNDER_REVIEW') {
    if (!canFinalReview(user, project)) throw new ForbiddenError('You cannot make the final decision on this project.');
    if (input.decision === 'FORWARD') throw new ValidationError('Final review can only approve or reject.');

    if (input.decision === 'APPROVE') {
      await recordTransition({ projectId: project.id, actorId: user.id, action: 'APPROVE', from: 'UNDER_REVIEW', to: 'APPROVED', comment: input.comment, extra: { approvedAt: new Date() } });
      await notify({ userIds: team, type: 'project.approved', title: 'Project approved 🎉', message: `"${project.title}" is now published in the repository.`, link: `/projects/${project.slug}` });
      return;
    }
  } else {
    throw new ValidationError('This project is not waiting for review.');
  }

  // REJECT (either stage)
  await recordTransition({ projectId: project.id, actorId: user.id, action: 'REJECT', from: project.status, to: 'REJECTED', comment: input.comment });
  await notify({ userIds: team, type: 'project.rejected', title: 'Changes requested', message: `"${project.title}" needs changes: ${input.comment ?? ''}`.slice(0, 500), link });
}

export async function archiveProject(user: CurrentUser, projectId: string, comment?: string) {
  const project = await getPolicyProject(projectId);
  if (!canArchive(user, project)) throw new ForbiddenError();
  await recordTransition({ projectId, actorId: user.id, action: 'ARCHIVE', from: project.status, to: 'ARCHIVED', comment, extra: { isFeatured: false } });
  await notify({ userIds: project.members.map((m) => m.userId), type: 'project.archived', title: 'Project archived', message: `"${project.title}" was archived by an administrator.` });
}

export async function unarchiveProject(user: CurrentUser, projectId: string) {
  if (user.role !== 'ADMIN') throw new ForbiddenError();
  const project = await getPolicyProject(projectId);
  if (project.status !== 'ARCHIVED') throw new ValidationError('Project is not archived.');
  const [row] = await db.select({ approvedAt: projects.approvedAt }).from(projects).where(eq(projects.id, projectId)).limit(1);
  const to: ProjectStatus = row?.approvedAt ? 'APPROVED' : 'DRAFT';
  await recordTransition({ projectId, actorId: user.id, action: 'UNARCHIVE', from: 'ARCHIVED', to });
}
