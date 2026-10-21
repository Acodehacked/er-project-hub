import 'server-only';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  academicYears,
  departments,
  projectMembers,
  projectTechnologies,
  projects,
  technologies,
  users,
} from '@/db/schema';
import { hasPermission } from '@/lib/auth/rbac';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { logAudit } from '@/lib/security/audit';
import { slugify } from '@/lib/security/sanitization';
import { emptyToNull } from '@/lib/validation/common';
import type {
  AddMemberInput,
  ProjectBasicsInput,
  ProjectLinksInput,
  ProjectTechnologiesInput,
  UpdateMemberInput,
} from '@/lib/validation/project';
import type { CurrentUser } from '@/types';
import { notify } from '@/features/notifications/service';
import { getPolicyProject } from './queries';
import {
  canDeleteProject,
  canEditContent,
  canEditLight,
  canManageTeam,
  isLeader,
  isMember,
} from './policy';

function randomSuffix(length = 6) {
  return crypto.randomUUID().replace(/-/g, '').slice(0, length);
}

export function makeProjectSlug(title: string) {
  return `${slugify(title, 80) || 'project'}-${randomSuffix()}`;
}

async function assertCatalogRefs(departmentId: string, academicYearId: string) {
  const [dept, year] = await Promise.all([
    db.query.departments.findFirst({ where: eq(departments.id, departmentId), columns: { id: true } }),
    db.query.academicYears.findFirst({ where: eq(academicYears.id, academicYearId), columns: { id: true } }),
  ]);
  if (!dept) throw new ValidationError('Choose a valid department.', { departmentId: ['Unknown department'] });
  if (!year) throw new ValidationError('Choose a valid academic year.', { academicYearId: ['Unknown year'] });
}

/** Step 1 of the wizard: creates a DRAFT and makes the creator its LEADER. */
export async function createDraft(user: CurrentUser, input: ProjectBasicsInput) {
  if (!hasPermission(user, 'project:create')) throw new ForbiddenError('Only students can create projects.');
  await assertCatalogRefs(input.departmentId, input.academicYearId);

  const id = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(projects).values({
      id,
      title: input.title,
      slug: makeProjectSlug(input.title),
      abstract: input.abstract,
      description: emptyToNull(input.description),
      departmentId: input.departmentId,
      academicYearId: input.academicYearId,
      leaderId: user.id,
    });
    await tx.insert(projectMembers).values({ projectId: id, userId: user.id, role: 'LEADER', roleTitle: 'Team lead' });
  });
  return { id };
}

export async function updateBasics(user: CurrentUser, projectId: string, input: ProjectBasicsInput) {
  const project = await getPolicyProject(projectId);
  if (!canEditContent(user, project)) {
    if (!isMember(user, project)) throw new ForbiddenError();
    throw new ForbiddenError(
      project.status === 'APPROVED'
        ? 'This project is approved. Propose a revision to change these fields.'
        : 'This project is locked while it is being reviewed.',
    );
  }
  await assertCatalogRefs(input.departmentId, input.academicYearId);

  await db
    .update(projects)
    .set({
      title: input.title,
      abstract: input.abstract,
      description: emptyToNull(input.description),
      departmentId: input.departmentId,
      academicYearId: input.academicYearId,
    })
    .where(eq(projects.id, projectId));
}

/** Records light edits made to a live (approved) project in the audit log. */
async function auditLiveEdit(user: CurrentUser, projectId: string, status: string, what: string, details?: object) {
  if (status === 'APPROVED') {
    await logAudit({
      userId: user.id,
      action: `project.live_edit.${what}`,
      targetEntity: 'project',
      targetId: projectId,
      details: details as Record<string, unknown>,
    });
  }
}

export async function updateLinks(user: CurrentUser, projectId: string, input: ProjectLinksInput) {
  const project = await getPolicyProject(projectId);
  if (!canEditLight(user, project)) throw new ForbiddenError();

  const values = { githubUrl: emptyToNull(input.githubUrl), demoUrl: emptyToNull(input.demoUrl) };
  await db.update(projects).set(values).where(eq(projects.id, projectId));
  await auditLiveEdit(user, projectId, project.status, 'links', values);
}

export async function setTechnologies(user: CurrentUser, projectId: string, input: ProjectTechnologiesInput) {
  const project = await getPolicyProject(projectId);
  if (!canEditLight(user, project)) throw new ForbiddenError();

  const newNames = [...new Set((input.newTechnologies ?? []).map((n) => n.trim()).filter(Boolean))];

  await db.transaction(async (tx) => {
    // Create any technologies the student typed that do not exist yet.
    if (newNames.length > 0) {
      await tx
        .insert(technologies)
        .values(newNames.map((name) => ({ name, slug: `${slugify(name, 70) || 'tech'}-${randomSuffix(4)}` })))
        .onDuplicateKeyUpdate({ set: { name: sql`name` } }); // existing names are kept as-is
    }
    const created = newNames.length
      ? await tx.select({ id: technologies.id }).from(technologies).where(inArray(technologies.name, newNames))
      : [];

    const ids = [...new Set([...input.technologyIds, ...created.map((t) => t.id)])].slice(0, 20);
    const valid = ids.length
      ? await tx.select({ id: technologies.id }).from(technologies).where(inArray(technologies.id, ids))
      : [];

    await tx.delete(projectTechnologies).where(eq(projectTechnologies.projectId, projectId));
    if (valid.length) {
      await tx.insert(projectTechnologies).values(valid.map((t) => ({ projectId, technologyId: t.id })));
    }
  });
  await auditLiveEdit(user, projectId, project.status, 'technologies', { count: input.technologyIds.length });
}

/** Finds an active student/representative by email, username or register number. */
export async function lookupStudent(identifier: string) {
  const value = identifier.trim();
  const found = await db.query.users.findFirst({
    where: and(
      or(eq(users.email, value.toLowerCase()), eq(users.username, value.toLowerCase()), eq(users.studentIdentifier, value)),
      eq(users.isActive, true),
      inArray(users.role, ['STUDENT', 'REPRESENTATIVE']),
    ),
    columns: { id: true, name: true, username: true, graduationYear: true, avatarKey: true, studentIdentifier: true },
  });
  if (!found) throw new NotFoundError('No active student found with that email, username or register number.');
  return found;
}

export async function addMember(user: CurrentUser, projectId: string, input: AddMemberInput) {
  const project = await getPolicyProject(projectId);
  if (!canManageTeam(user, project)) throw new ForbiddenError('Only the team leader can manage the team.');
  if (project.members.length >= 8) throw new ValidationError('A team can have at most 8 members.');

  const student = await lookupStudent(input.identifier);
  if (project.members.some((m) => m.userId === student.id)) throw new ConflictError(`${student.name} is already in the team.`);

  await db.insert(projectMembers).values({
    projectId,
    userId: student.id,
    role: input.role,
    roleTitle: emptyToNull(input.roleTitle),
  });
  await notify({
    userIds: [student.id],
    type: 'team.added',
    title: 'You were added to a project',
    message: `${user.name} added you to "${project.title}".`,
    link: `/dashboard/projects/${projectId}`,
  });
  return student;
}

export async function updateMember(user: CurrentUser, projectId: string, input: UpdateMemberInput) {
  const project = await getPolicyProject(projectId);
  if (!canManageTeam(user, project)) throw new ForbiddenError('Only the team leader can assign roles.');

  const member = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.id, input.memberId), eq(projectMembers.projectId, projectId)),
  });
  if (!member) throw new NotFoundError('Member not found.');
  if (member.role === 'LEADER') throw new ValidationError("The leader's role cannot be changed.");

  await db
    .update(projectMembers)
    .set({ role: input.role, roleTitle: emptyToNull(input.roleTitle) })
    .where(eq(projectMembers.id, member.id));
}

export async function removeMember(user: CurrentUser, projectId: string, memberId: string) {
  const project = await getPolicyProject(projectId);
  if (!canManageTeam(user, project)) throw new ForbiddenError('Only the team leader can remove members.');

  const member = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.id, memberId), eq(projectMembers.projectId, projectId)),
  });
  if (!member) throw new NotFoundError('Member not found.');
  if (member.role === 'LEADER') throw new ValidationError('The leader cannot be removed.');

  await db.delete(projectMembers).where(eq(projectMembers.id, member.id));
  await notify({
    userIds: [member.userId],
    type: 'team.removed',
    title: 'Removed from a project',
    message: `You were removed from "${project.title}".`,
  });
}

export async function setGuide(user: CurrentUser, projectId: string, guideId: string | null) {
  const project = await getPolicyProject(projectId);
  if (!canManageTeam(user, project)) throw new ForbiddenError('Only the team leader can choose the guide.');

  if (guideId) {
    const guide = await db.query.users.findFirst({
      where: and(eq(users.id, guideId), eq(users.isActive, true), eq(users.role, 'FACULTY')),
      columns: { id: true },
    });
    if (!guide) throw new ValidationError('Choose an active faculty member as guide.');
  }

  await db.update(projects).set({ guideId }).where(eq(projects.id, projectId));
  if (guideId && guideId !== project.guideId) {
    await notify({
      userIds: [guideId],
      type: 'guide.assigned',
      title: 'You were chosen as a project guide',
      message: `${user.name} chose you as the guide for "${project.title}".`,
      link: `/dashboard/guiding`,
    });
  }
}

export async function deleteProject(user: CurrentUser, projectId: string) {
  const project = await getPolicyProject(projectId);
  if (!canDeleteProject(user, project)) {
    throw new ForbiddenError('Only the leader can delete a project, and only while it is a draft.');
  }
  // Files in storage are cleaned up by the caller (see actions) after the DB row is gone.
  await db.delete(projects).where(eq(projects.id, projectId));
  await logAudit({
    userId: user.id,
    action: 'project.delete',
    targetEntity: 'project',
    targetId: projectId,
    details: { title: project.title, byLeader: isLeader(user, project) },
  });
}

/** Admin: toggle the "featured" flag on an approved project. */
export async function setFeatured(user: CurrentUser, projectId: string, featured: boolean) {
  if (!hasPermission(user, 'admin:projects')) throw new ForbiddenError();
  const project = await getPolicyProject(projectId);
  if (featured && project.status !== 'APPROVED') throw new ValidationError('Only approved projects can be featured.');
  await db.update(projects).set({ isFeatured: featured }).where(eq(projects.id, projectId));
  await logAudit({ userId: user.id, action: featured ? 'project.feature' : 'project.unfeature', targetEntity: 'project', targetId: projectId });
}
