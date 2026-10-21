import { hasPermission } from '@/lib/auth/rbac';
import type { UserRole } from '@/types';

/**
 * Role-aware navigation, computed on the server and passed to client
 * components. Icons are referenced by name (functions cannot cross the
 * server→client boundary) and resolved in `nav-icons.tsx`.
 */
export type NavIcon =
  | 'home'
  | 'folder'
  | 'plus'
  | 'inbox'
  | 'graduation'
  | 'bell'
  | 'settings'
  | 'users'
  | 'building'
  | 'calendar'
  | 'cpu'
  | 'layers'
  | 'chart'
  | 'shield'
  | 'library'
  | 'search';

export type NavItem = { title: string; href: string; icon: NavIcon; badgeKey?: 'reviews' | 'notifications' };
export type NavSection = { label: string; items: NavItem[] };

export function buildDashboardNav(user: { role: UserRole }): NavSection[] {
  const sections: NavSection[] = [];

  const workspace: NavItem[] = [{ title: 'Overview', href: '/dashboard', icon: 'home' }];
  if (hasPermission(user, 'project:create')) {
    workspace.push({ title: 'My projects', href: '/dashboard/projects', icon: 'folder' });
    workspace.push({ title: 'New project', href: '/dashboard/projects/new', icon: 'plus' });
  }
  if (hasPermission(user, 'review:screen') || hasPermission(user, 'review:final')) {
    workspace.push({ title: 'Reviews', href: '/dashboard/reviews', icon: 'inbox', badgeKey: 'reviews' });
  }
  if (hasPermission(user, 'project:guide')) {
    workspace.push({ title: 'Guiding', href: '/dashboard/guiding', icon: 'graduation' });
  }
  workspace.push({ title: 'Notifications', href: '/dashboard/notifications', icon: 'bell', badgeKey: 'notifications' });
  sections.push({ label: 'Workspace', items: workspace });

  if (user.role === 'ADMIN') {
    sections.push({
      label: 'Administration',
      items: [
        { title: 'Admin overview', href: '/admin', icon: 'shield' },
        { title: 'Analytics', href: '/admin/analytics', icon: 'chart' },
        { title: 'Users', href: '/admin/users', icon: 'users' },
        { title: 'All projects', href: '/admin/projects', icon: 'layers' },
        { title: 'Departments', href: '/admin/departments', icon: 'building' },
        { title: 'Academic years', href: '/admin/academic-years', icon: 'calendar' },
        { title: 'Technologies', href: '/admin/technologies', icon: 'cpu' },
        { title: 'Audit log', href: '/admin/audit', icon: 'shield' },
      ],
    });
  }

  sections.push({
    label: 'Explore',
    items: [
      { title: 'Project repository', href: '/projects', icon: 'library' },
      { title: 'Technologies', href: '/technologies', icon: 'cpu' },
      { title: 'Settings', href: '/dashboard/settings', icon: 'settings' },
    ],
  });
  return sections;
}

export const PUBLIC_NAV: NavItem[] = [
  { title: 'Projects', href: '/projects', icon: 'library' },
  { title: 'Technologies', href: '/technologies', icon: 'cpu' },
];
