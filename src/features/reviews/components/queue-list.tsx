import Link from 'next/link';
import { ChevronRight, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { timeAgo } from '@/lib/format';
import type { ProjectStatus } from '@/types';

export type QueueProject = {
  id: string;
  title: string;
  status: ProjectStatus;
  submittedAt: Date | null;
  guideId: string | null;
  department: { code: string };
  academicYear: { label: string };
  leader: { id: string; name: string; avatarKey: string | null };
  members: { id: string }[];
};

/** Compact list of projects waiting for a reviewer, linking to the review page. */
export function QueueList({ projects, currentUserId }: { projects: QueueProject[]; currentUserId: string }) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {projects.map((p) => (
        <li key={p.id}>
          <Link href={`/dashboard/reviews/${p.id}`} className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent/50">
            <UserAvatar user={p.leader} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium group-hover:text-primary">{p.title}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span>{p.leader.name} + {p.members.length - 1}</span>
                <span>·</span>
                <span className="font-mono">{p.department.code}</span>
                <span>·</span>
                <span>{p.academicYear.label}</span>
                {p.submittedAt && <><span>·</span><span>submitted {timeAgo(p.submittedAt)}</span></>}
              </p>
            </div>
            {p.guideId === currentUserId && (
              <Badge variant="outline" className="hidden gap-1 sm:inline-flex"><GraduationCap /> Your team</Badge>
            )}
            <StatusBadge status={p.status} className="hidden md:inline-flex" />
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
