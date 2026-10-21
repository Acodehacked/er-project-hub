import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { idSchema } from '@/lib/validation/common';
import type { CurrentUser } from '@/types';
import { getProjectById } from './queries';
import { canViewProject, isMember } from './policy';

/**
 * Loads a project for the team's management pages. Non-members who may
 * view it (reviewers, guides) are sent to the review page instead; anyone
 * else gets a 404 so private project ids are not revealed.
 */
export async function loadManagedProject(rawId: string, user: CurrentUser) {
  const id = idSchema.safeParse(rawId);
  if (!id.success) notFound();
  const project = await getProjectById(id.data);
  if (!project || !canViewProject(user, project)) notFound();
  if (!isMember(user, project) && user.role !== 'ADMIN') redirect(`/dashboard/reviews/${project.id}`);
  return project;
}
