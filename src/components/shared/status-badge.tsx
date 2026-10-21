import { CircleCheck, CircleDashed, Clock, Archive, PencilLine, SearchCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { REVISION_STATUS_LABELS, STATUS_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProjectStatus, RevisionStatus } from '@/types';

const STYLES: Record<ProjectStatus, { className: string; icon: typeof Clock }> = {
  DRAFT: { className: 'bg-muted text-muted-foreground', icon: PencilLine },
  SUBMITTED: { className: 'bg-info/12 text-info', icon: Clock },
  UNDER_REVIEW: { className: 'bg-warning/18 text-warning-foreground dark:text-warning', icon: SearchCheck },
  APPROVED: { className: 'bg-success/12 text-success', icon: CircleCheck },
  REJECTED: { className: 'bg-destructive/12 text-destructive', icon: CircleDashed },
  ARCHIVED: { className: 'bg-muted text-muted-foreground', icon: Archive },
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const { className: style, icon: Icon } = STYLES[status];
  return (
    <Badge variant="secondary" className={cn('gap-1 border-0', style, className)}>
      <Icon aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

const REVISION_MAP: Record<RevisionStatus, ProjectStatus> = {
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'ARCHIVED',
};

export function RevisionStatusBadge({ status }: { status: RevisionStatus }) {
  const { className, icon: Icon } = STYLES[REVISION_MAP[status]];
  return (
    <Badge variant="secondary" className={cn('gap-1 border-0', className)}>
      <Icon aria-hidden />
      {REVISION_STATUS_LABELS[status]}
    </Badge>
  );
}
