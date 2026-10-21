import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq, inArray, ne, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import {
  approvals,
  projectDocuments,
  projectImages,
  projectMembers,
  projectRevisions,
  projects,
} from '@/db/schema';
import { NotFoundError } from '@/lib/errors';
import type { PolicyProject } from './policy';

/** Public-safe user columns (never select password hashes or emails into pages by accident). */
export const publicUserColumns = {
  id: true,
  name: true,
  username: true,
  role: true,
  graduationYear: true,
  avatarKey: true,
} as const;

/** Minimal data needed for policy checks. Throws NotFoundError if missing. */
export async function getPolicyProject(projectId: string): Promise<PolicyProject & { id: string; title: string; slug: string }> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { id: true, title: true, slug: true, status: true, departmentId: true, leaderId: true, guideId: true },
    with: { members: { columns: { userId: true, role: true } } },
  });
  if (!project) throw new NotFoundError('Project not found.');
  return project;
}

/** Everything the project detail / manage pages show. */
function findFullProject(where: SQL) {
  return db.query.projects.findFirst({
    where,
    with: {
      department: true,
      academicYear: true,
      leader: { columns: publicUserColumns },
      guide: { columns: publicUserColumns },
      members: {
        with: { user: { columns: { ...publicUserColumns, studentIdentifier: true } } },
        orderBy: [asc(projectMembers.createdAt)],
      },
      technologies: { with: { technology: true } },
      images: { orderBy: [desc(projectImages.isCover), asc(projectImages.displayOrder), asc(projectImages.createdAt)] },
      documents: { orderBy: [asc(projectDocuments.createdAt)] },
    },
  });
}

export const getProjectBySlug = cache(async (slug: string) => findFullProject(eq(projects.slug, slug)));

export const getProjectById = cache(async (id: string) => findFullProject(eq(projects.id, id)));

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectById>>>;

/** The workflow timeline: every approval step, oldest first. */
export function getProjectTimeline(projectId: string) {
  return db.query.approvals.findMany({
    where: eq(approvals.projectId, projectId),
    orderBy: [asc(approvals.createdAt)],
    with: { actor: { columns: publicUserColumns } },
  });
}

export function getOpenRevision(projectId: string) {
  return db.query.projectRevisions.findFirst({
    where: and(
      eq(projectRevisions.projectId, projectId),
      inArray(projectRevisions.status, ['SUBMITTED', 'UNDER_REVIEW']),
    ),
    with: { proposedBy: { columns: publicUserColumns } },
  });
}

export function getRevisionHistory(projectId: string) {
  return db.query.projectRevisions.findMany({
    where: eq(projectRevisions.projectId, projectId),
    orderBy: [desc(projectRevisions.createdAt)],
    with: { proposedBy: { columns: publicUserColumns } },
  });
}

/** Projects the user is a member of (any role), newest activity first. */
export async function listMyProjects(userId: string) {
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  const ids = memberships.map((m) => m.projectId);
  if (ids.length === 0) return [];

  return db.query.projects.findMany({
    where: inArray(projects.id, ids),
    orderBy: [desc(projects.updatedAt)],
    with: {
      department: { columns: { code: true, name: true } },
      academicYear: { columns: { label: true } },
      members: { columns: { userId: true, role: true } },
      images: { columns: { id: true, isCover: true } },
      revisions: { columns: { id: true, status: true } },
    },
  });
}

/** Projects a faculty member is guiding (excluding drafts they cannot act on yet). */
export function listGuidedProjects(guideId: string) {
  return db.query.projects.findMany({
    where: and(eq(projects.guideId, guideId), ne(projects.status, 'ARCHIVED')),
    orderBy: [desc(projects.updatedAt)],
    with: {
      department: { columns: { code: true } },
      leader: { columns: publicUserColumns },
    },
  });
}
