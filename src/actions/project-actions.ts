'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projectDocuments, projectImages } from '@/db/schema';
import { requireUser } from '@/lib/auth/guards';
import { runAction } from '@/lib/action';
import { idSchema } from '@/lib/validation/common';
import {
  addMemberSchema,
  projectBasicsSchema,
  projectGuideSchema,
  projectLinksSchema,
  projectTechnologiesSchema,
  revisionSchema,
  updateMemberSchema,
} from '@/lib/validation/project';
import { memberRoleSchema } from '@/lib/validation/project';
import * as service from '@/features/projects/service';
import * as workflow from '@/features/projects/workflow';
import * as revisions from '@/features/projects/revisions';
import { purgeProjectFiles } from '@/features/files/service';
import { isStorageConfigured } from '@/lib/storage';

/**
 * Project Server Actions. Pattern for every action:
 *   1. requireUser()          – authentication
 *   2. schema.parse(input)    – validation (never trust the client)
 *   3. service call           – authorization (policy) + business logic
 *   4. revalidatePath()       – refresh cached pages
 */

function refresh(projectId?: string) {
  revalidatePath('/dashboard', 'layout');
  if (projectId) revalidatePath(`/dashboard/projects/${projectId}`, 'layout');
  revalidatePath('/projects', 'layout');
}

export async function createDraftAction(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const result = await service.createDraft(user, projectBasicsSchema.parse(input));
    refresh();
    return result;
  }, 'Draft created');
}

export async function updateBasicsAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    await service.updateBasics(user, idSchema.parse(projectId), projectBasicsSchema.parse(input));
    refresh(projectId);
  }, 'Saved');
}

export async function updateLinksAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    await service.updateLinks(user, idSchema.parse(projectId), projectLinksSchema.parse(input));
    refresh(projectId);
  }, 'Links saved');
}

export async function setTechnologiesAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    await service.setTechnologies(user, idSchema.parse(projectId), projectTechnologiesSchema.parse(input));
    refresh(projectId);
  }, 'Technologies saved');
}

export async function lookupStudentAction(identifier: string) {
  return runAction(async () => {
    await requireUser();
    return service.lookupStudent(z.string().trim().min(3).max(255).parse(identifier));
  });
}

export async function addMemberAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const student = await service.addMember(user, idSchema.parse(projectId), addMemberSchema.parse(input));
    refresh(projectId);
    return { name: student.name };
  }, 'Member added');
}

export async function updateMemberAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    await service.updateMember(user, idSchema.parse(projectId), updateMemberSchema.parse(input));
    refresh(projectId);
  }, 'Role updated');
}

export async function removeMemberAction(projectId: string, memberId: string) {
  return runAction(async () => {
    const user = await requireUser();
    await service.removeMember(user, idSchema.parse(projectId), idSchema.parse(memberId));
    refresh(projectId);
  }, 'Member removed');
}

export async function setGuideAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const { guideId } = projectGuideSchema.parse(input);
    await service.setGuide(user, idSchema.parse(projectId), guideId);
    refresh(projectId);
  }, 'Guide updated');
}

export async function submitProjectAction(projectId: string) {
  return runAction(async () => {
    const user = await requireUser();
    await workflow.submitProject(user, idSchema.parse(projectId));
    refresh(projectId);
  }, 'Submitted for review');
}

export async function deleteProjectAction(projectId: string) {
  return runAction(async () => {
    const user = await requireUser();
    const id = idSchema.parse(projectId);
    const [images, documents] = await Promise.all([
      db.select({ storageKey: projectImages.storageKey }).from(projectImages).where(eq(projectImages.projectId, id)),
      db.select({ storageKey: projectDocuments.storageKey }).from(projectDocuments).where(eq(projectDocuments.projectId, id)),
    ]);
    await service.deleteProject(user, id);
    if (isStorageConfigured) {
      await purgeProjectFiles([...images, ...documents].map((f) => f.storageKey));
    }
    refresh();
    return { redirectTo: '/dashboard/projects' };
  }, 'Project deleted');
}

export async function proposeRevisionAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const result = await revisions.proposeContentRevision(user, idSchema.parse(projectId), revisionSchema.parse(input));
    refresh(projectId);
    return result;
  }, 'Revision submitted for review');
}

const teamRevisionSchema = z.object({
  members: z
    .array(z.object({ userId: idSchema, role: memberRoleSchema, roleTitle: z.string().trim().max(80).optional() }))
    .max(7),
  note: z.string().trim().max(1000).optional(),
});

export async function proposeTeamRevisionAction(projectId: string, input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const { members, note } = teamRevisionSchema.parse(input);
    const result = await revisions.proposeTeamRevision(user, idSchema.parse(projectId), members, note);
    refresh(projectId);
    return result;
  }, 'Team change submitted for review');
}

export async function cancelRevisionAction(revisionId: string) {
  return runAction(async () => {
    const user = await requireUser();
    await revisions.cancelRevision(user, idSchema.parse(revisionId));
    refresh();
  }, 'Revision cancelled');
}
