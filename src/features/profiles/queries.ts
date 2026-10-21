import 'server-only';
import { cache } from 'react';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { projectMembers, projects, users } from '@/db/schema';
import { getProjectCards } from '@/features/repository/queries';

/** Public profile data. Never includes email, register number or password. */
export const getPublicProfile = cache(async (username: string) => {
  return db.query.users.findFirst({
    where: and(eq(users.username, username.toLowerCase()), eq(users.isActive, true)),
    columns: {
      id: true,
      name: true,
      username: true,
      role: true,
      graduationYear: true,
      bio: true,
      avatarKey: true,
      githubUrl: true,
      linkedinUrl: true,
      createdAt: true,
    },
    with: { department: { columns: { code: true, name: true } } },
  });
});

/** Approved projects a student worked on (as any team member). */
export async function getStudentApprovedProjects(userId: string) {
  const rows = await db
    .select({ id: projects.id, role: projectMembers.role, roleTitle: projectMembers.roleTitle })
    .from(projectMembers)
    .innerJoin(projects, eq(projects.id, projectMembers.projectId))
    .where(and(eq(projectMembers.userId, userId), eq(projects.status, 'APPROVED')))
    .orderBy(desc(projects.approvedAt));
  const cards = await getProjectCards(rows.map((r) => r.id));
  const roles = new Map(rows.map((r) => [r.id, r]));
  return cards.map((c) => ({ ...c, memberRole: roles.get(c.id)!.role, memberRoleTitle: roles.get(c.id)!.roleTitle }));
}

/** Approved projects a faculty member guided. */
export async function getGuidedApprovedProjects(userId: string) {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.guideId, userId), inArray(projects.status, ['APPROVED'])))
    .orderBy(desc(projects.approvedAt));
  return getProjectCards(rows.map((r) => r.id));
}
