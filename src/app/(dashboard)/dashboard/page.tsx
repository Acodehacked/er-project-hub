import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  CircleCheck,
  FilePenLine,
  FolderKanban,
  GraduationCap,
  Inbox,
  Plus,
  SearchCheck,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatTile } from '@/components/dashboard/stat-tile';
import { Reveal } from '@/components/motion/reveal';
import { requireUser } from '@/lib/auth/guards';
import { hasPermission, ROLE_LABELS } from '@/lib/auth/rbac';
import { formatDate, timeAgo } from '@/lib/format';
import { listGuidedProjects, listMyProjects } from '@/features/projects/queries';
import { getFinalQueue, getRecentDecisions, getScreeningQueue } from '@/features/reviews/queries';
import { listNotifications } from '@/features/notifications/queries';
import { getSystemTotals } from '@/features/analytics/queries';
import { NotificationIcon } from '@/features/notifications/components/notification-icon';
import { QueueList } from '@/features/reviews/components/queue-list';

export const metadata: Metadata = { title: 'Dashboard' };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default async function DashboardHome() {
  const user = await requireUser();
  const canCreate = hasPermission(user, 'project:create');
  const canScreen = hasPermission(user, 'review:screen');
  const canFinal = hasPermission(user, 'review:final');
  const isAdmin = user.role === 'ADMIN';

  const [myProjects, screening, finalQueue, guided, decisions, notifications, totals] = await Promise.all([
    canCreate ? listMyProjects(user.id) : Promise.resolve([]),
    canScreen ? getScreeningQueue(user) : Promise.resolve([]),
    canFinal ? getFinalQueue(user) : Promise.resolve([]),
    hasPermission(user, 'project:guide') ? listGuidedProjects(user.id) : Promise.resolve([]),
    canScreen || canFinal ? getRecentDecisions(user.id, 5) : Promise.resolve([]),
    listNotifications(user.id, 5),
    isAdmin ? getSystemTotals() : Promise.resolve(null),
  ]);

  const drafts = myProjects.filter((p) => p.status === 'DRAFT' || p.status === 'REJECTED');
  const inReview = myProjects.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW');
  const approved = myProjects.filter((p) => p.status === 'APPROVED');

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description={`Signed in as ${ROLE_LABELS[user.role]}. Here’s what needs your attention.`}
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/dashboard/projects/new"><Plus /> New project</Link>
            </Button>
          )
        }
      />

      <Reveal stagger onScroll={false} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canCreate && <StatTile label="Drafts & changes" value={drafts.length} icon={FilePenLine} href="/dashboard/projects" tone="muted" />}
        {canCreate && <StatTile label="In review" value={inReview.length} icon={SearchCheck} href="/dashboard/projects" tone="info" />}
        {canCreate && <StatTile label="Published" value={approved.length} icon={CircleCheck} href="/dashboard/projects" tone="success" />}
        {canScreen && <StatTile label="To screen" value={screening.length} icon={Inbox} href="/dashboard/reviews" tone="warning" />}
        {canFinal && <StatTile label="Final reviews" value={finalQueue.length} icon={Inbox} href="/dashboard/reviews?tab=final" tone="warning" />}
        {hasPermission(user, 'project:guide') && <StatTile label="Teams guided" value={guided.length} icon={GraduationCap} href="/dashboard/guiding" />}
        {totals && <StatTile label="Users" value={totals.users} icon={Users} href="/admin/users" tone="info" />}
        {totals && !canScreen && <StatTile label="Pending reviews" value={totals.pendingReviews} icon={ShieldCheck} href="/admin/projects" />}
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          {(canScreen || canFinal) && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Waiting for you</h2>
                <Button asChild variant="ghost" size="sm"><Link href="/dashboard/reviews">Open reviews <ArrowRight /></Link></Button>
              </div>
              {screening.length + finalQueue.length === 0 ? (
                <EmptyState icon={Inbox} title="Nothing to review" description="New submissions from your department will appear here." />
              ) : (
                <QueueList projects={[...finalQueue, ...screening].slice(0, 6)} currentUserId={user.id} />
              )}
            </section>
          )}

          {canCreate && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">My projects</h2>
                <Button asChild variant="ghost" size="sm"><Link href="/dashboard/projects">View all <ArrowRight /></Link></Button>
              </div>
              {myProjects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Start a draft — you can save and come back any time before submitting."
                  action={<Button asChild><Link href="/dashboard/projects/new"><Plus /> Create your first project</Link></Button>}
                />
              ) : (
                <Reveal stagger className="grid gap-3">
                  {myProjects.slice(0, 5).map((p) => {
                    const openRevision = p.revisions.find((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');
                    return (
                      <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium group-hover:text-primary">{p.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.department.code} · {p.academicYear.label} · {p.members.length} member{p.members.length === 1 ? '' : 's'} · updated {timeAgo(p.updatedAt)}
                            {openRevision && ' · revision in review'}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </Link>
                    );
                  })}
                </Reveal>
              )}
            </section>
          )}

          {guided.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Teams you guide</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {guided.slice(0, 4).map((p) => (
                  <Link key={p.id} href={p.status === 'APPROVED' ? `/projects/${p.slug}` : `/dashboard/reviews/${p.id}`} className="rounded-xl border bg-card p-4 hover:border-primary/40">
                    <p className="truncate font-medium">{p.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.leader.name}</span>
                      <StatusBadge status={p.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent notifications</CardTitle>
                <CardDescription>Updates on your projects and reviews</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bell className="size-4" /> No notifications yet.</p>
              ) : (
                <ul className="space-y-4">
                  {notifications.map((n) => (
                    <li key={n.id} className="flex gap-3">
                      <NotificationIcon type={n.type} />
                      <div className="min-w-0">
                        {n.link ? (
                          <Link href={n.link} className="text-sm font-medium hover:text-primary">{n.title}</Link>
                        ) : (
                          <p className="text-sm font-medium">{n.title}</p>
                        )}
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="ghost" size="sm" className="mt-4 w-full"><Link href="/dashboard/notifications">All notifications</Link></Button>
            </CardContent>
          </Card>

          {decisions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Your recent decisions</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {decisions.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2">
                      <Link href={`/dashboard/reviews/${d.project.id}`} className="truncate hover:text-primary">{d.project.title}</Link>
                      <span className="shrink-0 text-xs text-muted-foreground">{d.action.toLowerCase()} · {formatDate(d.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <Card>
              <CardHeader><CardTitle className="text-base">Administration</CardTitle></CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline" className="justify-start"><Link href="/admin/analytics">Analytics</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link href="/admin/users">Manage users</Link></Button>
                <Button asChild variant="outline" className="justify-start"><Link href="/admin/audit">Audit log</Link></Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
