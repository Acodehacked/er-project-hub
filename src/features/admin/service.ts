import 'server-only';
import { and, count, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { academicYears, departments, projectTechnologies, projects, technologies, users } from '@/db/schema';
import { hashPassword } from '@/lib/auth/password';
import { hasPermission } from '@/lib/auth/rbac';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { logAudit } from '@/lib/security/audit';
import { slugify } from '@/lib/security/sanitization';
import { emptyToNull } from '@/lib/validation/common';
import type { AcademicYearInput, DepartmentInput, TechnologyInput, UpdateUserInput } from '@/lib/validation/admin';
import type { CurrentUser } from '@/types';
import { notify } from '@/features/notifications/service';

function assert(user: CurrentUser, permission: Parameters<typeof hasPermission>[1]) {
  if (!hasPermission(user, permission)) throw new ForbiddenError();
}

// ─── Users ──────────────────────────────────────────────────────────────

export async function updateUser(admin: CurrentUser, input: UpdateUserInput) {
  assert(admin, 'admin:users');
  if (input.userId === admin.id && (input.role !== 'ADMIN' || !input.isActive)) {
    throw new ValidationError('You cannot demote or deactivate your own account.');
  }
  const [target] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!target) throw new NotFoundError('User not found.');

  if (input.departmentId) {
    const [dept] = await db.select({ id: departments.id }).from(departments).where(eq(departments.id, input.departmentId)).limit(1);
    if (!dept) throw new ValidationError('Unknown department.');
  }

  await db
    .update(users)
    .set({ role: input.role, departmentId: input.departmentId, isActive: input.isActive })
    .where(eq(users.id, input.userId));

  await logAudit({
    userId: admin.id,
    action: 'user.update',
    targetEntity: 'user',
    targetId: input.userId,
    details: {
      before: { role: target.role, departmentId: target.departmentId, isActive: target.isActive },
      after: { role: input.role, departmentId: input.departmentId, isActive: input.isActive },
    },
  });
  if (target.role !== input.role) {
    await notify({
      userIds: [input.userId],
      type: 'account.updated',
      title: 'Your role changed',
      message: `An administrator changed your role to ${input.role.toLowerCase()}.`,
      link: '/dashboard',
    });
  }
}

export async function resetUserPassword(admin: CurrentUser, userId: string, newPassword: string) {
  assert(admin, 'admin:users');
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new NotFoundError('User not found.');
  await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, userId));
  await logAudit({ userId: admin.id, action: 'user.password_reset', targetEntity: 'user', targetId: userId });
}

// ─── Departments ────────────────────────────────────────────────────────

export async function saveDepartment(admin: CurrentUser, input: DepartmentInput) {
  assert(admin, 'admin:catalog');
  const values = { name: input.name, code: input.code, description: emptyToNull(input.description) };
  if (input.id) {
    await db.update(departments).set(values).where(eq(departments.id, input.id));
  } else {
    await db.insert(departments).values(values);
  }
  await logAudit({ userId: admin.id, action: input.id ? 'department.update' : 'department.create', targetEntity: 'department', targetId: input.id ?? null, details: values });
}

export async function deleteDepartment(admin: CurrentUser, id: string) {
  assert(admin, 'admin:catalog');
  const [used] = await db.select({ value: count() }).from(projects).where(eq(projects.departmentId, id));
  if ((used?.value ?? 0) > 0) throw new ConflictError('This department has projects and cannot be deleted.');
  await db.delete(departments).where(eq(departments.id, id));
  await logAudit({ userId: admin.id, action: 'department.delete', targetEntity: 'department', targetId: id });
}

// ─── Academic years ─────────────────────────────────────────────────────

export async function createAcademicYear(admin: CurrentUser, input: AcademicYearInput) {
  assert(admin, 'admin:catalog');
  const startYear = Number(input.startYear);
  const label = `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
  await db.insert(academicYears).values({ label, startYear });
  await logAudit({ userId: admin.id, action: 'academic_year.create', targetEntity: 'academic_year', details: { label } });
}

export async function setCurrentAcademicYear(admin: CurrentUser, id: string) {
  assert(admin, 'admin:catalog');
  await db.transaction(async (tx) => {
    await tx.update(academicYears).set({ isCurrent: false }).where(ne(academicYears.id, id));
    await tx.update(academicYears).set({ isCurrent: true }).where(eq(academicYears.id, id));
  });
  await logAudit({ userId: admin.id, action: 'academic_year.set_current', targetEntity: 'academic_year', targetId: id });
}

export async function deleteAcademicYear(admin: CurrentUser, id: string) {
  assert(admin, 'admin:catalog');
  const [used] = await db.select({ value: count() }).from(projects).where(eq(projects.academicYearId, id));
  if ((used?.value ?? 0) > 0) throw new ConflictError('This academic year has projects and cannot be deleted.');
  await db.delete(academicYears).where(eq(academicYears.id, id));
}

// ─── Technologies ───────────────────────────────────────────────────────

export async function saveTechnology(admin: CurrentUser, input: TechnologyInput) {
  assert(admin, 'admin:catalog');
  if (input.id) {
    await db.update(technologies).set({ name: input.name, category: input.category }).where(eq(technologies.id, input.id));
  } else {
    await db.insert(technologies).values({ name: input.name, category: input.category, slug: slugify(input.name, 85) || crypto.randomUUID().slice(0, 8) });
  }
}

/**
 * Merge duplicate technologies (e.g. "ReactJS" into "React"): every project
 * tagged with the source gets the target instead, then the source is deleted.
 */
export async function mergeTechnologies(admin: CurrentUser, sourceId: string, targetId: string) {
  assert(admin, 'admin:catalog');
  const [[source], [target]] = await Promise.all([
    db.select().from(technologies).where(eq(technologies.id, sourceId)).limit(1),
    db.select().from(technologies).where(eq(technologies.id, targetId)).limit(1),
  ]);
  if (!source || !target) throw new NotFoundError('Technology not found.');

  await db.transaction(async (tx) => {
    const rows = await tx.select({ projectId: projectTechnologies.projectId }).from(projectTechnologies).where(eq(projectTechnologies.technologyId, sourceId));
    if (rows.length) {
      // INSERT IGNORE semantics: projects that already have the target keep a single row.
      await tx
        .insert(projectTechnologies)
        .values(rows.map((r) => ({ projectId: r.projectId, technologyId: targetId })))
        .onDuplicateKeyUpdate({ set: { technologyId: targetId } });
    }
    await tx.delete(projectTechnologies).where(eq(projectTechnologies.technologyId, sourceId));
    await tx.delete(technologies).where(eq(technologies.id, sourceId));
  });
  await logAudit({ userId: admin.id, action: 'technology.merge', targetEntity: 'technology', targetId, details: { from: source.name, into: target.name } });
}

export async function deleteTechnology(admin: CurrentUser, id: string) {
  assert(admin, 'admin:catalog');
  const [used] = await db.select({ value: count() }).from(projectTechnologies).where(and(eq(projectTechnologies.technologyId, id)));
  if ((used?.value ?? 0) > 0) throw new ConflictError('This technology is used by projects. Merge it instead.');
  await db.delete(technologies).where(eq(technologies.id, id));
}
