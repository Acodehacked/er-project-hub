import 'server-only';
import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { departments, users } from '@/db/schema';
import { env } from '@/lib/env';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { logAudit } from '@/lib/security/audit';
import { emptyToNull } from '@/lib/validation/common';
import type { ProfileInput } from '@/lib/validation/admin';
import type { ChangePasswordInput, registerSchema } from '@/lib/validation/auth';
import type { z } from 'zod';

type RegisterData = z.output<typeof registerSchema>;

/** Self-registration always creates a STUDENT. Admins promote later. */
export async function registerStudent(input: RegisterData) {
  if (env.ALLOWED_EMAIL_DOMAIN && !input.email.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)) {
    throw new ValidationError('Use your institutional email address.', {
      email: [`Only @${env.ALLOWED_EMAIL_DOMAIN} addresses can sign up`],
    });
  }

  const [dept] = await db.select({ id: departments.id }).from(departments).where(eq(departments.id, input.departmentId)).limit(1);
  if (!dept) throw new ValidationError('Choose your department.', { departmentId: ['Unknown department'] });

  const [clash] = await db
    .select({ email: users.email, username: users.username, studentIdentifier: users.studentIdentifier })
    .from(users)
    .where(or(eq(users.email, input.email), eq(users.username, input.username), eq(users.studentIdentifier, input.studentIdentifier)))
    .limit(1);
  if (clash) {
    const fieldErrors: Record<string, string[]> = {};
    if (clash.email === input.email) fieldErrors.email = ['An account with this email already exists'];
    if (clash.username === input.username) fieldErrors.username = ['This username is taken'];
    if (clash.studentIdentifier === input.studentIdentifier) fieldErrors.studentIdentifier = ['This register number is already registered'];
    throw new ValidationError('Some details are already in use.', fieldErrors);
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name: input.name,
    email: input.email,
    username: input.username,
    passwordHash: await hashPassword(input.password),
    role: 'STUDENT',
    departmentId: input.departmentId,
    studentIdentifier: input.studentIdentifier,
    graduationYear: input.graduationYear,
  });
  await logAudit({ userId: id, action: 'user.register', targetEntity: 'user', targetId: id });
  return { id };
}

export async function isUsernameAvailable(username: string) {
  const [found] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  return !found;
}

export async function updateProfile(userId: string, input: ProfileInput) {
  await db
    .update(users)
    .set({
      name: input.name,
      bio: emptyToNull(input.bio),
      githubUrl: emptyToNull(input.githubUrl),
      linkedinUrl: emptyToNull(input.linkedinUrl),
    })
    .where(eq(users.id, userId));
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError();
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new ValidationError('Current password is incorrect.', { currentPassword: ['Incorrect password'] });
  }
  if (input.currentPassword === input.newPassword) throw new ConflictError('Choose a password you have not used just now.');
  await db.update(users).set({ passwordHash: await hashPassword(input.newPassword) }).where(eq(users.id, userId));
  await logAudit({ userId, action: 'user.password_change', targetEntity: 'user', targetId: userId });
}

export async function getAccount(userId: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      role: users.role,
      departmentId: users.departmentId,
      studentIdentifier: users.studentIdentifier,
      graduationYear: users.graduationYear,
      bio: users.bio,
      avatarKey: users.avatarKey,
      githubUrl: users.githubUrl,
      linkedinUrl: users.linkedinUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      department: {
        code: departments.code,
        name: departments.name,
      },
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return undefined;
  return {
    ...row,
    department: row.department.code ? row.department : null,
  };
}
