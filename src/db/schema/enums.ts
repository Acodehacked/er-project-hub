/**
 * Single source of truth for every enum-like value in ErHub.
 *
 * The tuples below are used by:
 *  - Drizzle `mysqlEnum(...)` columns (database constraint)
 *  - Zod schemas (`z.enum(USER_ROLES)`) for server-side validation
 *  - UI labels/badges
 *
 * Never redefine these values elsewhere — import them from here or `@/types`.
 */

export const USER_ROLES = ['STUDENT', 'REPRESENTATIVE', 'FACULTY', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROJECT_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_MEMBER_ROLES = [
  'LEADER',
  'DEVELOPER',
  'DESIGNER',
  'RESEARCHER',
  'DOCUMENTATION',
  'OTHER',
] as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLES)[number];

/** What happened in a single step of the review workflow. */
export const APPROVAL_ACTIONS = [
  'SUBMIT',
  'FORWARD',
  'APPROVE',
  'REJECT',
  'ARCHIVE',
  'UNARCHIVE',
] as const;
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];

/** A revision is a proposed "major edit" to an already-approved project. */
export const REVISION_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;
export type RevisionStatus = (typeof REVISION_STATUSES)[number];

export const DOCUMENT_KINDS = ['REPORT', 'PRESENTATION', 'PAPER', 'OTHER'] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const TECHNOLOGY_CATEGORIES = [
  'LANGUAGE',
  'FRAMEWORK',
  'DATABASE',
  'HARDWARE',
  'CLOUD',
  'AI_ML',
  'TOOL',
  'OTHER',
] as const;
export type TechnologyCategory = (typeof TECHNOLOGY_CATEGORIES)[number];
