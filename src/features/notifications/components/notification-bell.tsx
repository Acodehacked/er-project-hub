'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { markNotificationsReadAction } from '@/actions/account-actions';
import { NotificationIcon } from './notification-icon';

export type BellNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationBell({ unread, items }: { unread: number; items: BellNotification[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const open = (n: BellNotification) => {
    startTransition(async () => {
      if (!n.isRead) await markNotificationsReadAction([n.id]);
      if (n.link) router.push(n.link);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await markNotificationsReadAction()))}>
              <CheckCheck /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => open(n)} className={cn('flex w-full gap-3 px-4 py-3 text-left hover:bg-accent/60', !n.isRead && 'bg-primary/5')}>
                    <NotificationIcon type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {n.title}
                        {!n.isRead && <span className="size-1.5 rounded-full bg-primary" />}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/dashboard/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
