import { z } from 'zod';
import { idSchema } from './common';

/**
 * A reviewer's decision. Which decisions are allowed depends on the stage
 * (screening vs final) and is enforced by the workflow, not by this schema.
 */
export const reviewDecisionSchema = z
  .object({
    targetId: idSchema, // project id, or revision id for revision reviews
    decision: z.enum(['FORWARD', 'APPROVE', 'REJECT']),
    comment: z.string().trim().max(2000).optional(),
  })
  .refine((d) => d.decision !== 'REJECT' || (d.comment && d.comment.length >= 10), {
    path: ['comment'],
    message: 'Explain what needs to change (at least 10 characters)',
  });
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
