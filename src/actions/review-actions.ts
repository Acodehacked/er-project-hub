'use server';

import { revalidatePath } from 'next/cache';
import { requireAnyPermission } from '@/lib/auth/guards';
import { runAction } from '@/lib/action';
import { reviewDecisionSchema } from '@/lib/validation/review';
import { decideProject } from '@/features/projects/workflow';
import { decideRevision } from '@/features/projects/revisions';

const MESSAGES = { FORWARD: 'Forwarded to faculty', APPROVE: 'Approved and published', REJECT: 'Sent back with your comments' } as const;

export async function decideProjectAction(input: unknown) {
  const parsed = reviewDecisionSchema.safeParse(input);
  return runAction(async () => {
    const user = await requireAnyPermission('review:screen', 'review:final');
    const data = reviewDecisionSchema.parse(input);
    await decideProject(user, data);
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/projects', 'layout');
  }, parsed.success ? MESSAGES[parsed.data.decision] : undefined);
}

export async function decideRevisionAction(input: unknown) {
  const parsed = reviewDecisionSchema.safeParse(input);
  return runAction(async () => {
    const user = await requireAnyPermission('review:screen', 'review:final');
    await decideRevision(user, reviewDecisionSchema.parse(input));
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/projects', 'layout');
  }, parsed.success ? MESSAGES[parsed.data.decision] : undefined);
}
