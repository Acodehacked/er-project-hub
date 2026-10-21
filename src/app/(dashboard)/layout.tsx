import { cookies } from 'next/headers';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { CommandPalette } from '@/components/navigation/command-palette';
import { UserMenu } from '@/components/navigation/user-menu';
import { toMenuUser } from '@/components/navigation/menu-user';
import { buildDashboardNav } from '@/components/navigation/nav-config';
import { requireUser } from '@/lib/auth/guards';
import { hasPermission, ROLE_LABELS } from '@/lib/auth/rbac';
import { getUnreadCount, listNotifications } from '@/features/notifications/queries';
import { getReviewCounts } from '@/features/reviews/queries';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

/**
 * Shell for every signed-in page (/dashboard/*, /admin/*).
 * `requireUser()` here protects the whole subtree on the server.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const isReviewer = hasPermission(user, 'review:screen') || hasPermission(user, 'review:final');

  const [unread, latest, reviewCounts, cookieStore] = await Promise.all([
    getUnreadCount(user.id),
    listNotifications(user.id, 8),
    isReviewer ? getReviewCounts(user) : Promise.resolve({ total: 0 }),
    cookies(),
  ]);

  const sections = buildDashboardNav(user);
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        sections={sections}
        badges={{ reviews: reviewCounts.total, notifications: unread }}
        user={{ id: user.id, name: user.name, roleLabel: ROLE_LABELS[user.role], avatarKey: user.avatarKey }}
        canCreate={hasPermission(user, 'project:create')}
      />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-lg">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
          <CommandPalette items={sections.flatMap((s) => s.items)} className="w-9 px-0 sm:w-72 sm:px-3" />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell unread={unread} items={latest} />
            <ThemeToggle />
            <UserMenu user={toMenuUser(user)} />
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
