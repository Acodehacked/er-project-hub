import { ROLE_LABELS } from '@/lib/auth/rbac';
import { profileHref } from '@/lib/format';
import type { CurrentUser } from '@/types';
import type { MenuUser } from './user-menu';

/** Serialisable subset of the current user for client menus. */
export function toMenuUser(user: CurrentUser): MenuUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleLabel: ROLE_LABELS[user.role],
    avatarKey: user.avatarKey,
    profileHref: profileHref(user),
    isAdmin: user.role === 'ADMIN',
  };
}
