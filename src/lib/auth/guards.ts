import 'server-only';
import { redirect, forbidden } from 'next/navigation';
import { getCurrentUser } from './session';
import { hasPermission, type Permission } from './rbac';
import type { CurrentUser, UserRole } from '@/types';

/**
 * Centralised authorization guards. Use them at the top of every protected
 * page, layout, Server Action and Route Handler:
 *
 *   const user = await requireUser();                     // any signed-in user
 *   const user = await requirePermission('review:final'); // capability check
 *   const user = await requireRole('ADMIN');              // rarely needed
 *
 * Not signed in  -> redirect to /login (works in pages AND actions)
 * Not allowed    -> Next.js `forbidden()` renders app/forbidden.tsx (HTTP 403)
 *
 * The proxy (src/proxy.ts) only does a quick cookie check for nicer redirects;
 * THESE functions are the real security boundary.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) forbidden();
  return user;
}

export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasPermission(user, permission)) forbidden();
  return user;
}

/** Same as requirePermission but accepts any one of several permissions. */
export async function requireAnyPermission(...permissions: Permission[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!permissions.some((p) => hasPermission(user, p))) forbidden();
  return user;
}
