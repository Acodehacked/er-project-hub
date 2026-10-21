'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/auth/guards';
import { runAction } from '@/lib/action';
import { idSchema } from '@/lib/validation/common';
import {
  academicYearSchema,
  departmentSchema,
  mergeTechnologiesSchema,
  resetPasswordSchema,
  technologySchema,
  updateUserSchema,
} from '@/lib/validation/admin';
import * as admin from '@/features/admin/service';
import { setFeatured } from '@/features/projects/service';
import { archiveProject, unarchiveProject } from '@/features/projects/workflow';

export async function updateUserAction(input: unknown) {
  return runAction(async () => {
    const user = await requirePermission('admin:users');
    await admin.updateUser(user, updateUserSchema.parse(input));
    revalidatePath('/admin/users');
  }, 'User updated');
}

export async function resetPasswordAction(input: unknown) {
  return runAction(async () => {
    const user = await requirePermission('admin:users');
    const { userId, newPassword } = resetPasswordSchema.parse(input);
    await admin.resetUserPassword(user, userId, newPassword);
  }, 'Password reset. Share the new password with the user securely.');
}

export async function saveDepartmentAction(input: unknown) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.saveDepartment(user, departmentSchema.parse(input));
    revalidatePath('/admin/departments');
  }, 'Department saved');
}

export async function deleteDepartmentAction(id: string) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.deleteDepartment(user, idSchema.parse(id));
    revalidatePath('/admin/departments');
  }, 'Department deleted');
}

export async function createAcademicYearAction(input: unknown) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.createAcademicYear(user, academicYearSchema.parse(input));
    revalidatePath('/admin/academic-years');
  }, 'Academic year added');
}

export async function setCurrentAcademicYearAction(id: string) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.setCurrentAcademicYear(user, idSchema.parse(id));
    revalidatePath('/admin/academic-years');
  }, 'Current year updated');
}

export async function deleteAcademicYearAction(id: string) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.deleteAcademicYear(user, idSchema.parse(id));
    revalidatePath('/admin/academic-years');
  }, 'Academic year deleted');
}

export async function saveTechnologyAction(input: unknown) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.saveTechnology(user, technologySchema.parse(input));
    revalidatePath('/admin/technologies');
  }, 'Technology saved');
}

export async function mergeTechnologiesAction(input: unknown) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    const { sourceId, targetId } = mergeTechnologiesSchema.parse(input);
    await admin.mergeTechnologies(user, sourceId, targetId);
    revalidatePath('/admin/technologies');
  }, 'Technologies merged');
}

export async function deleteTechnologyAction(id: string) {
  return runAction(async () => {
    const user = await requirePermission('admin:catalog');
    await admin.deleteTechnology(user, idSchema.parse(id));
    revalidatePath('/admin/technologies');
  }, 'Technology deleted');
}

export async function setFeaturedAction(projectId: string, featured: boolean) {
  return runAction(async () => {
    const user = await requirePermission('admin:projects');
    await setFeatured(user, idSchema.parse(projectId), z.boolean().parse(featured));
    revalidatePath('/admin/projects');
    revalidatePath('/', 'layout');
  }, featured ? 'Project featured' : 'Removed from featured');
}

export async function archiveProjectAction(projectId: string, comment?: string) {
  return runAction(async () => {
    const user = await requirePermission('admin:projects');
    await archiveProject(user, idSchema.parse(projectId), z.string().trim().max(500).optional().parse(comment));
    revalidatePath('/admin/projects');
    revalidatePath('/', 'layout');
  }, 'Project archived');
}

export async function unarchiveProjectAction(projectId: string) {
  return runAction(async () => {
    const user = await requirePermission('admin:projects');
    await unarchiveProject(user, idSchema.parse(projectId));
    revalidatePath('/admin/projects');
    revalidatePath('/', 'layout');
  }, 'Project restored');
}
