import type { Metadata } from 'next';
import Link from 'next/link';
import { BellOff } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { Reveal } from '@/components/motion/reveal';
import { requireUser } from '@/lib/auth/guards';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { listNotifications } from '@/features/notifications/queries';
import { NotificationIcon } from '@/features/notifications/components/notification-icon';
import { MarkAllReadButton } from '@/features/notifications/components/mark-all-read-button';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id, 100);
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You’re all caught up.'}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]}
        actions={unread > 0 && <MarkAllReadButton />}
      />
      {items.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications yet" description="You’ll hear about submissions, reviews and team changes here." />
      ) : (
        <Reveal stagger={0.03} className="divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((n) => {
            const body = (
              <div className={cn('flex gap-3 p-4', !n.isRead && 'bg-accent/60')}>
                <NotificationIcon type={n.type} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {n.title} {!n.isRead && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                  </p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block transition-colors hover:bg-accent/40">{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </Reveal>
      )}
    </div>
  );
}
