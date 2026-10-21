import { Archive, ArchiveRestore, CircleCheck, CircleX, Forward, Send } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ApprovalAction } from '@/types';

type TimelineStep = {
  id: string;
  action: ApprovalAction;
  toStatus: string;
  comment: string | null;
  createdAt: Date;
  actor: { name: string };
};

const ACTION_META: Record<ApprovalAction, { label: string; icon: typeof Send; tone: string }> = {
  SUBMIT: { label: 'Submitted for review', icon: Send, tone: 'bg-info/15 text-info' },
  FORWARD: { label: 'Passed screening', icon: Forward, tone: 'bg-warning/20 text-warning-foreground dark:text-warning' },
  APPROVE: { label: 'Approved', icon: CircleCheck, tone: 'bg-success/15 text-success' },
  REJECT: { label: 'Changes requested', icon: CircleX, tone: 'bg-destructive/15 text-destructive' },
  ARCHIVE: { label: 'Archived', icon: Archive, tone: 'bg-muted text-muted-foreground' },
  UNARCHIVE: { label: 'Restored', icon: ArchiveRestore, tone: 'bg-muted text-muted-foreground' },
};

/** Vertical, animated history of every review step with reviewer comments. */
export function StatusTimeline({ steps, emptyText = 'No review activity yet.' }: { steps: TimelineStep[]; emptyText?: string }) {
  if (steps.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;

  return (
    <Reveal stagger={0.1} className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
      {steps.map((step) => {
        const meta = step.toStatus === 'CANCELLED' ? { ...ACTION_META.ARCHIVE, label: 'Cancelled' } : ACTION_META[step.action];
        return (
          <div key={step.id} className="relative flex gap-3">
            <span className={cn('relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-background', meta.tone)}>
              <meta.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-sm font-medium">
                {meta.label} <span className="font-normal text-muted-foreground">by {step.actor.name}</span>
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(step.createdAt)}</p>
              {step.comment && (
                <blockquote className="mt-2 rounded-lg border-l-2 border-primary/50 bg-muted/60 px-3 py-2 text-sm whitespace-pre-line">{step.comment}</blockquote>
              )}
            </div>
          </div>
        );
      })}
    </Reveal>
  );
}
