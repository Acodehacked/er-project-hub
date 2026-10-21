/**
 * Expected, user-safe errors. Anything thrown that is NOT an AppError is
 * treated as an unexpected bug: it is logged on the server and the user only
 * sees a generic message, so database/stack details never leak.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: AppErrorCode = 'INTERNAL',
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'STORAGE_UNAVAILABLE'
  | 'INTERNAL';

export class UnauthenticatedError extends AppError {
  constructor(message = 'Please sign in to continue.') {
    super(message, 'UNAUTHENTICATED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do that.') {
    super(message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'We could not find what you were looking for.') {
    super(message, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Please fix the highlighted fields.', fieldErrors?: Record<string, string[]>) {
    super(message, 'VALIDATION', fieldErrors);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many attempts. Please wait a minute and try again.') {
    super(message, 'RATE_LIMITED');
  }
}

/** True for MySQL duplicate-key violations (ER_DUP_ENTRY). */
export function isDuplicateKeyError(error: unknown): boolean {
  let current: unknown = error;
  // Drizzle wraps driver errors, so walk the `cause` chain.
  for (let i = 0; i < 3 && current; i++) {
    if (typeof current === 'object' && current !== null && 'code' in current && current.code === 'ER_DUP_ENTRY') {
      return true;
    }
    current = typeof current === 'object' && current !== null && 'cause' in current ? current.cause : undefined;
  }
  return false;
}
