import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, GitPullRequestArrow, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { RevisionStatusBadge } from '@/components/shared/status-badge';
import { Reveal } from '@/components/motion/reveal';
import { requireAnyPermission } from '@/lib/auth/guards';
import { hasPermission } from '@/lib/auth/rbac';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getFinalQueue, getRevisionQueue, getScreeningQueue } from '@/features/reviews/queries';
import { QueueList } from '@/features/reviews/components/queue-list';

export const metadata: Metadata = { title: 'Reviews' };

export default async function ReviewsPage({ searchParams }: PageProps<'/dashboard/reviews'>) {
  const user = await requireAnyPermission('review:screen', 'review:final');
  const canScreen = hasPermission(user, 'review:screen');
  const canFinal = hasPermission(user, 'review:final');

  const [screening, finalQueue, revisions] = await Promise.all([
    canScreen ? getScreeningQueue(user) : Promise.resolve([]),
    canFinal ? getFinalQueue(user) : Promise.resolve([]),
    getRevisionQueue(user),
  ]);

  const tabs = [
    ...(canScreen ? [{ key: 'screening', label: 'Screening', count: screening.length }] : []),
    ...(canFinal ? [{ key: 'final', label: 'Final review', count: finalQueue.length }] : []),
    { key: 'revisions', label: 'Revisions', count: revisions.length },
  ];
  const requested = (await searchParams).tab;
  const tab = tabs.find((t) => t.key === requested)?.key ?? tabs[0]!.key;

  return (
    <>
      <PageHeader
        title="Reviews"
        description={
          canScreen && !canFinal
            ? 'Screen new submissions from your department before they go to faculty.'
            : 'Projects and revisions waiting for your decision.'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reviews' }]}
      />
      <nav className="mb-6 flex gap-1 border-b" aria-label="Review queues">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/reviews?tab=${t.key}`}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              t.key === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            <Badge variant={t.count ? 'default' : 'secondary'} className="rounded-full px-1.5">{t.count}</Badge>
          </Link>
        ))}
      </nav>

      <Reveal replayKey={tab}>
        {tab === 'screening' &&
          (screening.length ? (
            <QueueList projects={screening} currentUserId={user.id} />
          ) : (
            <EmptyState icon={Inbox} title="No submissions to screen" description="When students in your department submit projects, they appear here." />
          ))}
        {tab === 'final' &&
          (finalQueue.length ? (
            <QueueList projects={finalQueue} currentUserId={user.id} />
          ) : (
            <EmptyState icon={Inbox} title="Nothing awaiting your decision" description="Projects that pass screening — and those you guide — appear here." />
          ))}
        {tab === 'revisions' &&
          (revisions.length ? (
            <ul className="divide-y rounded-xl border bg-card">
              {revisions.map((r) => (
                <li key={r.id}>
                  <Link href={`/dashboard/reviews/revisions/${r.id}`} className="group flex items-center gap-4 p-4 hover:bg-accent/50">
                    <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground"><GitPullRequestArrow className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:text-accent-foreground">{r.project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Changes to {Object.keys(r.changes).map((k) => k.replace('Id', '')).join(', ')} · by {r.proposedBy.name} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <RevisionStatusBadge status={r.status} />
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={GitPullRequestArrow} title="No revisions waiting" description="Edits proposed to already-published projects show up here." />
          ))}
      </Reveal>
    </>
  );
}
