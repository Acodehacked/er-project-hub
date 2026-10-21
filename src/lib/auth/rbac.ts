import type { UserRole } from '@/types';

/**
 * Role-Based Access Control.
 *
 * A *permission* is a named capability. Roles are just bundles of permissions.
 * Code checks permissions (`hasPermission(user, 'review:final')`), never raw
 * role names, so changing who can do what is a one-line edit here.
 *
 * Object-level rules ("is this MY project?") live in
 * `src/features/projects/policy.ts`, which builds on these permissions.
 */
export const PERMISSIONS = [
  'project:create', // create and lead projects
  'review:screen', // stage 1: representative screening
  'review:final', // stage 2: faculty final decision
  'project:guide', // can be chosen as a faculty guide
  'admin:users',
  'admin:catalog', // departments, academic years, technologies
  'admin:projects', // feature/archive/edit any project
  'admin:audit',
  'admin:analytics',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  STUDENT: ['project:create'],
  // A Student Representative is a student with extra screening duties.
  REPRESENTATIVE: ['project:create', 'review:screen'],
  FACULTY: ['review:final', 'project:guide'],
  ADMIN: PERMISSIONS,
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasPermission(user: { role: UserRole } | null | undefined, permission: Permission): boolean {
  return !!user && roleHasPermission(user.role, permission);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Student',
  REPRESENTATIVE: 'Student Representative',
  FACULTY: 'Faculty',
  ADMIN: 'Administrator',
};

/** Roles that have a graduation year and a /[year]/[username] profile. */
export function isStudentLike(role: UserRole): boolean {
  return role === 'STUDENT' || role === 'REPRESENTATIVE';
}
