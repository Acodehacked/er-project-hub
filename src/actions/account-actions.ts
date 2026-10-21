'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireUser } from '@/lib/auth/guards';
import { runAction } from '@/lib/action';
import { changePasswordSchema } from '@/lib/validation/auth';
import { profileSchema } from '@/lib/validation/admin';
import { idSchema } from '@/lib/validation/common';
import { changePassword, updateProfile } from '@/features/account/service';
import { z } from 'zod';

export async function updateProfileAction(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    await updateProfile(user.id, profileSchema.parse(input));
    revalidatePath('/', 'layout');
  }, 'Profile updated');
}

export async function changePasswordAction(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    await changePassword(user.id, changePasswordSchema.parse(input));
  }, 'Password changed');
}

/** Mark some (or, with no ids, all) of MY notifications as read. */
export async function markNotificationsReadAction(ids?: string[]) {
  return runAction(async () => {
    const user = await requireUser();
    const list = ids ? z.array(idSchema).max(100).parse(ids) : null;
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        list
          ? and(eq(notifications.userId, user.id), inArray(notifications.id, list))
          : eq(notifications.userId, user.id), // userId filter = users can only touch their own rows
      );
    revalidatePath('/dashboard', 'layout');
  });
}
