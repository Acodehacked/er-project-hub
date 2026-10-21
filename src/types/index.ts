/**
 * Shared types for every module. Enum types are DERIVED from the tuples in
 * `src/db/schema/enums.ts`, and row types are inferred from Drizzle tables,
 * so there is exactly one source of truth.
 */
export type {
  UserRole,
  ProjectStatus,
  ProjectMemberRole,
  ApprovalAction,
  RevisionStatus,
  DocumentKind,
  TechnologyCategory,
} from '@/db/schema/enums';

export type {
  User,
  Department,
  AcademicYear,
  Project,
  ProjectMember,
  Technology,
  ProjectDocument,
  ProjectImage,
  ProjectRevision,
  RevisionChanges,
  Approval,
  Notification,
  AuditLog,
} from '@/db/schema';

import type { AppErrorCode } from '@/lib/errors';
import type { UserRole } from '@/db/schema/enums';

/** What every Server Action returns. Check `result.ok` before using `data`. */
export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code?: AppErrorCode; fieldErrors?: Record<string, string[]> };

/** The signed-in user as seen by server code (always loaded fresh from the DB). */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  departmentId: string | null;
  graduationYear: number | null;
  avatarKey: string | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
