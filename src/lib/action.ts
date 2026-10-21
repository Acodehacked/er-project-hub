import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import { AppError, isDuplicateKeyError } from './errors';
import type { ActionResult } from '@/types';

/**
 * Wraps the body of every Server Action so they all behave the same way:
 *
 *   export async function submitProject(input: unknown) {
 *     return runAction(async () => {
 *       const user = await requireUser();
 *       ...
 *       return { id };            // -> { ok: true, data: { id } }
 *     });
 *   }
 *
 *  - ZodError        -> { ok: false, error, fieldErrors }
 *  - AppError        -> { ok: false, error: its safe message }
 *  - redirect()/notFound() are re-thrown so Next.js can handle them
 *  - anything else   -> logged, generic message returned
 */
export async function runAction<T>(fn: () => Promise<T>, successMessage?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data, message: successMessage };
  } catch (error) {
    unstable_rethrow(error);

    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: 'Please fix the highlighted fields.',
        fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
      };
    }
    if (error instanceof AppError) {
      return { ok: false, error: error.message, code: error.code, fieldErrors: error.fieldErrors };
    }
    if (isDuplicateKeyError(error)) {
      return { ok: false, error: 'That value is already in use.', code: 'CONFLICT' };
    }

    console.error('[action] Unexpected error:', error);
    return { ok: false, error: 'Something went wrong on our side. Please try again.', code: 'INTERNAL' };
  }
}
