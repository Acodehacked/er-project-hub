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

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      departmentId: true,
      graduationYear: true,
      avatarKey: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  const { isActive: _isActive, ...current } = user;
  return current;
});
