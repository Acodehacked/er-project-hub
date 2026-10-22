import 'server-only';
import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import type { CurrentUser } from '@/types';

/**
 * The signed-in user, loaded FRESH from MySQL — never trusted from the cookie.
 *
 * Wrapped in React `cache()` so calling it from a layout, a page and three
 * components during one request costs a single database query.
 *
 * Returns null when signed out, or when the account was deactivated/deleted
 * after the session cookie was issued.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      role: users.role,
      departmentId: users.departmentId,
      graduationYear: users.graduationYear,
      avatarKey: users.avatarKey,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.isActive) return null;
  const { isActive: _isActive, ...current } = user;
  return current;
});
