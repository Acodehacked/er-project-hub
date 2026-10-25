import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { CountUp } from '@/components/motion/count-up';
import { cn } from '@/lib/utils';

export function StatTile({
  label,
  value,
  icon: Icon,
  href,
  tone = 'primary',
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  tone?: 'primary' | 'info' | 'success' | 'warning' | 'muted';
  hint?: string;
}) {
  const tones = {
    primary: 'bg-tile-3/15 text-tile-3',
    info: 'bg-tile-1/15 text-info',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/20 text-warning-foreground dark:text-warning',
    muted: 'bg-muted text-muted-foreground',
  };
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn('grid size-9 place-items-center rounded-xl', tones[tone])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <CountUp value={value} className="mt-2 block text-3xl font-semibold tracking-tight tabular-nums" />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const cls = 'block rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition-all';
  return href ? (
    <Link href={href} className={cn(cls, 'hover:-translate-y-0.5 hover:border-tile-3/40')}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
