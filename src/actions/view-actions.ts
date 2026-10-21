'use server';

import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { idSchema } from '@/lib/validation/common';
import { getPolicyProject } from '@/features/projects/queries';
import { isMember } from '@/features/projects/policy';
import { incrementViews } from '@/features/repository/queries';

const COOKIE = 'erhub_views';

/**
 * Count a project view at most once per visitor per project per day.
 * Team members, guides, reviewers and admins are not counted, so "most
 * viewed" reflects real interest rather than the team refreshing its page.
 */
export async function trackViewAction(projectId: string) {
  const parsed = idSchema.safeParse(projectId);
  if (!parsed.success) return;

  const today = new Date().toISOString().slice(0, 10);
  const store = await cookies();
  let seen: Record<string, string> = {};
  try {
    seen = JSON.parse(store.get(COOKIE)?.value ?? '{}');
  } catch {
    seen = {};
  }
  if (seen[parsed.data] === today) return;

  const project = await getPolicyProject(parsed.data).catch(() => null);
  if (!project || project.status !== 'APPROVED') return;

  const user = await getCurrentUser();
  const insider =
    user &&
    (isMember(user, project) ||
      project.guideId === user.id ||
      hasPermission(user, 'review:screen') ||
      hasPermission(user, 'review:final'));

  // Keep only today's entries so the cookie stays small.
  const fresh = Object.fromEntries(Object.entries(seen).filter(([, d]) => d === today));
  fresh[parsed.data] = today;
  store.set(COOKIE, JSON.stringify(fresh), { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24, path: '/' });

  if (!insider) await incrementViews(parsed.data);
}
