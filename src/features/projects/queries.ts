import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq, inArray, ne, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import {
  academicYears,
  approvals,
  departments,
  projectDocuments,
  projectImages,
  projectMembers,
  projectRevisions,
  projectTechnologies,
  projects,
  technologies,
  users,
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
  const [project] = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      status: projects.status,
      departmentId: projects.departmentId,
      leaderId: projects.leaderId,
      guideId: projects.guideId,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) throw new NotFoundError('Project not found.');

  const members = await db
    .select({ userId: projectMembers.userId, role: projectMembers.role })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));

  return { ...project, members };
}

/** Everything the project detail / manage pages show. */
async function findFullProject(where: SQL) {
  const leader = alias(users, 'leader');
  const guide = alias(users, 'guide');

  const [row] = await db
    .select({
      project: projects,
      department: departments,
      academicYear: academicYears,
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
    .limit(1);

  if (!row) return undefined;

  const [membersRows, techRows, images, documents] = await Promise.all([
    db
      .select({
        member: projectMembers,
        user: {
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
          graduationYear: users.graduationYear,
          avatarKey: users.avatarKey,
          studentIdentifier: users.studentIdentifier,
        },
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, row.project.id))
      .orderBy(asc(projectMembers.createdAt)),

    db
      .select({
        projectTechnology: projectTechnologies,
        technology: technologies,
      })
      .from(projectTechnologies)
      .innerJoin(technologies, eq(projectTechnologies.technologyId, technologies.id))
      .where(eq(projectTechnologies.projectId, row.project.id)),

    db
      .select()
      .from(projectImages)
      .where(eq(projectImages.projectId, row.project.id))
      .orderBy(desc(projectImages.isCover), asc(projectImages.displayOrder), asc(projectImages.createdAt)),

    db
      .select()
      .from(projectDocuments)
      .where(eq(projectDocuments.projectId, row.project.id))
      .orderBy(asc(projectDocuments.createdAt)),
  ]);

  return {
    ...row.project,
    department: row.department,
    academicYear: row.academicYear,
    leader: row.leader,
    guide: row.guide?.id ? row.guide : null,
    members: membersRows.map((m) => ({ ...m.member, user: m.user })),
    technologies: techRows.map((t) => ({ ...t.projectTechnology, technology: t.technology })),
    images,
    documents,
  };
}

export const getProjectBySlug = cache(async (slug: string) => findFullProject(eq(projects.slug, slug)));

export const getProjectById = cache(async (id: string) => findFullProject(eq(projects.id, id)));

export type ProjectDetail = NonNullable<Awaited<ReturnType<typeof getProjectById>>>;

/** The workflow timeline: every approval step, oldest first. */
export async function getProjectTimeline(projectId: string) {
  const rows = await db
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
    .where(eq(approvals.projectId, projectId))
    .orderBy(asc(approvals.createdAt));

  return rows.map((r) => ({
    ...r.approval,
    actor: r.actor,
  }));
}

export async function getOpenRevision(projectId: string) {
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
    .where(
      and(
        eq(projectRevisions.projectId, projectId),
        inArray(projectRevisions.status, ['SUBMITTED', 'UNDER_REVIEW']),
      ),
    )
    .limit(1);

  if (!row) return undefined;
  return {
    ...row.revision,
    proposedBy: row.proposedBy,
  };
}

export async function getRevisionHistory(projectId: string) {
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
    })
    .from(projectRevisions)
    .innerJoin(users, eq(projectRevisions.proposedById, users.id))
    .where(eq(projectRevisions.projectId, projectId))
    .orderBy(desc(projectRevisions.createdAt));

  return rows.map((r) => ({
    ...r.revision,
    proposedBy: r.proposedBy,
  }));
}

/** Projects the user is a member of (any role), newest activity first. */
export async function listMyProjects(userId: string) {
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));
  const ids = memberships.map((m) => m.projectId);
  if (ids.length === 0) return [];

  const projectRows = await db
    .select({
      project: projects,
      department: { code: departments.code, name: departments.name },
      academicYear: { label: academicYears.label },
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .innerJoin(academicYears, eq(projects.academicYearId, academicYears.id))
    .where(inArray(projects.id, ids))
    .orderBy(desc(projects.updatedAt));

  const [membersRows, imagesRows, revisionsRows] = await Promise.all([
    db
      .select({ projectId: projectMembers.projectId, userId: projectMembers.userId, role: projectMembers.role })
      .from(projectMembers)
      .where(inArray(projectMembers.projectId, ids)),
    db
      .select({ projectId: projectImages.projectId, id: projectImages.id, isCover: projectImages.isCover })
      .from(projectImages)
      .where(inArray(projectImages.projectId, ids)),
    db
      .select({ projectId: projectRevisions.projectId, id: projectRevisions.id, status: projectRevisions.status })
      .from(projectRevisions)
      .where(inArray(projectRevisions.projectId, ids)),
  ]);

  const membersByProject = new Map<string, { userId: string; role: typeof projectMembers.$inferSelect.role }[]>();
  for (const m of membersRows) {
    const list = membersByProject.get(m.projectId) ?? [];
    list.push({ userId: m.userId, role: m.role });
    membersByProject.set(m.projectId, list);
  }

  const imagesByProject = new Map<string, { id: string; isCover: boolean }[]>();
  for (const img of imagesRows) {
    const list = imagesByProject.get(img.projectId) ?? [];
    list.push({ id: img.id, isCover: img.isCover });
    imagesByProject.set(img.projectId, list);
  }

  const revisionsByProject = new Map<string, { id: string; status: typeof projectRevisions.$inferSelect.status }[]>();
  for (const rev of revisionsRows) {
    const list = revisionsByProject.get(rev.projectId) ?? [];
    list.push({ id: rev.id, status: rev.status });
    revisionsByProject.set(rev.projectId, list);
  }

  return projectRows.map((r) => ({
    ...r.project,
    department: r.department,
    academicYear: r.academicYear,
    members: membersByProject.get(r.project.id) ?? [],
    images: imagesByProject.get(r.project.id) ?? [],
    revisions: revisionsByProject.get(r.project.id) ?? [],
  }));
}

/** Projects a faculty member is guiding (excluding drafts they cannot act on yet). */
export async function listGuidedProjects(guideId: string) {
  const rows = await db
    .select({
      project: projects,
      department: { code: departments.code },
      leader: {
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        graduationYear: users.graduationYear,
        avatarKey: users.avatarKey,
      },
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .innerJoin(users, eq(projects.leaderId, users.id))
    .where(and(eq(projects.guideId, guideId), ne(projects.status, 'ARCHIVED')))
    .orderBy(desc(projects.updatedAt));

  return rows.map((r) => ({
    ...r.project,
    department: r.department,
    leader: r.leader,
  }));
}

