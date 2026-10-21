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

  const dept = await db.query.departments.findFirst({ where: eq(departments.id, input.departmentId), columns: { id: true } });
  if (!dept) throw new ValidationError('Choose your department.', { departmentId: ['Unknown department'] });

  const clash = await db.query.users.findFirst({
    where: or(eq(users.email, input.email), eq(users.username, input.username), eq(users.studentIdentifier, input.studentIdentifier)),
    columns: { email: true, username: true, studentIdentifier: true },
  });
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
  const found = await db.query.users.findFirst({ where: eq(users.username, username), columns: { id: true } });
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
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { passwordHash: true } });
  if (!user) throw new NotFoundError();
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new ValidationError('Current password is incorrect.', { currentPassword: ['Incorrect password'] });
  }
  if (input.currentPassword === input.newPassword) throw new ConflictError('Choose a password you have not used just now.');
  await db.update(users).set({ passwordHash: await hashPassword(input.newPassword) }).where(eq(users.id, userId));
  await logAudit({ userId, action: 'user.password_change', targetEntity: 'user', targetId: userId });
}

export function getAccount(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { passwordHash: false },
    with: { department: { columns: { code: true, name: true } } },
  });
}
