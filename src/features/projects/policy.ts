import { hasPermission } from '@/lib/auth/rbac';
import type { ProjectMemberRole, ProjectStatus, RevisionStatus, UserRole } from '@/types';

/**
 * Object-level authorization for projects ("may THIS user touch THIS project?").
 *
 * These are pure functions — no database access — so the same rules are used
 * by pages (to show/hide buttons) and by Server Actions (to enforce). The UI
 * hiding a button is a convenience; the action calling the same function is
 * the security check. This is our defence against IDOR: changing an id in the
 * URL never bypasses ownership checks.
 */

export type PolicyUser = { id: string; role: UserRole; departmentId: string | null } | null;

export type PolicyProject = {
  status: ProjectStatus;
  departmentId: string;
  leaderId: string;
  guideId: string | null;
  members: { userId: string; role: ProjectMemberRole }[];
};

const EDITABLE: ProjectStatus[] = ['DRAFT', 'REJECTED'];

const isAdmin = (u: PolicyUser) => u?.role === 'ADMIN';

export function isMember(user: PolicyUser, p: PolicyProject): boolean {
  return !!user && p.members.some((m) => m.userId === user.id);
}

export function isLeader(user: PolicyUser, p: PolicyProject): boolean {
  return !!user && p.leaderId === user.id;
}

function isDepartmentReviewer(user: PolicyUser, p: PolicyProject): boolean {
  if (!user) return false;
  const reviewer = hasPermission(user, 'review:screen') || hasPermission(user, 'review:final');
  return reviewer && user.departmentId === p.departmentId;
}

/** Approved projects are public; everything else is visible to the team, its reviewers and admins. */
export function canViewProject(user: PolicyUser, p: PolicyProject): boolean {
  if (p.status === 'APPROVED') return true;
  if (!user) return false;
  if (isAdmin(user) || isMember(user, p) || p.guideId === user.id) return true;
  // Reviewers never see drafts — only what has been submitted to them.
  return p.status !== 'DRAFT' && p.status !== 'ARCHIVED' && isDepartmentReviewer(user, p);
}

/** Documents of approved projects require sign-in (images do not). */
export function canDownloadDocuments(user: PolicyUser, p: PolicyProject): boolean {
  return !!user && canViewProject(user, p);
}

/** Full content editing — only while DRAFT/REJECTED; locked during review. */
export function canEditContent(user: PolicyUser, p: PolicyProject): boolean {
  if (isAdmin(user)) return p.status !== 'ARCHIVED';
  return isMember(user, p) && EDITABLE.includes(p.status);
}

/** "Light" edits (links, technologies, files) — also allowed live on APPROVED projects. */
export function canEditLight(user: PolicyUser, p: PolicyProject): boolean {
  if (canEditContent(user, p)) return true;
  return p.status === 'APPROVED' && isMember(user, p);
}

/** Add/remove members, assign roles, pick the guide. */
export function canManageTeam(user: PolicyUser, p: PolicyProject): boolean {
  if (isAdmin(user)) return p.status !== 'ARCHIVED';
  return isLeader(user, p) && EDITABLE.includes(p.status);
}

export function canSubmit(user: PolicyUser, p: PolicyProject): boolean {
  return isLeader(user, p) && EDITABLE.includes(p.status);
}

export function canDeleteProject(user: PolicyUser, p: PolicyProject): boolean {
  if (isAdmin(user)) return true;
  return isLeader(user, p) && p.status === 'DRAFT';
}

/** Major edits to an approved project go through a revision. Team changes: leader only (checked in service). */
export function canProposeRevision(user: PolicyUser, p: PolicyProject): boolean {
  return p.status === 'APPROVED' && (isMember(user, p) || isAdmin(user));
}

// ─── Review workflow ────────────────────────────────────────────────────

/** Stage 1: a representative of the same department screens SUBMITTED work. */
function canScreenGeneric(user: PolicyUser, p: PolicyProject): boolean {
  if (!user || !hasPermission(user, 'review:screen')) return false;
  if (isMember(user, p)) return false; // nobody reviews their own project
  return isAdmin(user) || user.departmentId === p.departmentId;
}

/** Stage 2: the guide (if set) or any faculty of the department decides. */
function canFinalGeneric(user: PolicyUser, p: PolicyProject): boolean {
  if (!user || !hasPermission(user, 'review:final')) return false;
  if (isMember(user, p)) return false;
  if (isAdmin(user)) return true;
  return p.guideId ? p.guideId === user.id : user.departmentId === p.departmentId;
}

export function canScreen(user: PolicyUser, p: PolicyProject): boolean {
  return p.status === 'SUBMITTED' && canScreenGeneric(user, p);
}

export function canFinalReview(user: PolicyUser, p: PolicyProject): boolean {
  return p.status === 'UNDER_REVIEW' && canFinalGeneric(user, p);
}

export function canScreenRevision(user: PolicyUser, p: PolicyProject, revisionStatus: RevisionStatus): boolean {
  return revisionStatus === 'SUBMITTED' && canScreenGeneric(user, p);
}

export function canFinalReviewRevision(user: PolicyUser, p: PolicyProject, revisionStatus: RevisionStatus): boolean {
  return revisionStatus === 'UNDER_REVIEW' && canFinalGeneric(user, p);
}

export function canArchive(user: PolicyUser, p: PolicyProject): boolean {
  return isAdmin(user) && p.status !== 'ARCHIVED';
}
