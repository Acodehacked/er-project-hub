import { Archive, Bell, CircleCheck, CircleX, Forward, GraduationCap, Send, UserMinus, UserPlus, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAP: Record<string, { icon: typeof Bell; tone: string }> = {
  submitted: { icon: Send, tone: 'bg-info/15 text-info' },
  forwarded: { icon: Forward, tone: 'bg-warning/20 text-warning-foreground dark:text-warning' },
  approved: { icon: CircleCheck, tone: 'bg-success/15 text-success' },
  rejected: { icon: CircleX, tone: 'bg-destructive/15 text-destructive' },
  archived: { icon: Archive, tone: 'bg-muted text-muted-foreground' },
  added: { icon: UserPlus, tone: 'bg-accent text-accent-foreground' },
  removed: { icon: UserMinus, tone: 'bg-muted text-muted-foreground' },
  assigned: { icon: GraduationCap, tone: 'bg-accent text-accent-foreground' },
  updated: { icon: UserCog, tone: 'bg-info/15 text-info' },
};

/** Icon for a notification type such as "project.approved". */
export function NotificationIcon({ type, className }: { type: string; className?: string }) {
  const meta = MAP[type.split('.')[1] ?? ''] ?? { icon: Bell, tone: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', meta.tone, className)}>
      <meta.icon className="size-4" />
    </span>
  );
}
