'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { runAction } from '@/lib/action';
import { AppError, RateLimitError } from '@/lib/errors';
import { getClientIp } from '@/lib/security/audit';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { loginSchema, registerSchema, usernameSchema } from '@/lib/validation/auth';
import { isUsernameAvailable, registerStudent } from '@/features/account/service';

/** Only allow redirects to paths on our own site (prevents open-redirect attacks). */
function safeCallback(url: unknown): string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/dashboard';
}

async function credentialsSignIn(email: string, password: string) {
  try {
    await signIn('credentials', { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      if ('code' in error && error.code === 'rate_limited') throw new RateLimitError();
      throw new AppError('Incorrect email or password.', 'UNAUTHENTICATED');
    }
    throw error;
  }
}

export async function loginAction(input: unknown, callbackUrl?: string) {
  return runAction(async () => {
    const { email, password } = loginSchema.parse(input);
    await credentialsSignIn(email, password);
    return { redirectTo: safeCallback(callbackUrl) };
  });
}

export async function registerAction(input: unknown) {
  return runAction(async () => {
    rateLimit(`register:${await getClientIp()}`, RATE_LIMITS.register);
    const data = registerSchema.parse(input);
    await registerStudent(data);
    await credentialsSignIn(data.email, data.password);
    return { redirectTo: '/dashboard' };
  });
}

export async function checkUsernameAction(username: string) {
  return runAction(async () => {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) return { available: false, reason: parsed.error.issues[0]?.message ?? 'Invalid' };
    return { available: await isUsernameAvailable(parsed.data), reason: null };
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/' });
}
