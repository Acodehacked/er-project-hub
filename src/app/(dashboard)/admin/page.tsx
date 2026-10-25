import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CalendarRange, ChartColumn, Cpu, FolderKanban, Inbox, Layers, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatTile } from '@/components/dashboard/stat-tile';
import { Reveal } from '@/components/motion/reveal';
import { requirePermission } from '@/lib/auth/guards';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { timeAgo } from '@/lib/format';
import { USER_ROLES } from '@/db/schema/enums';
import { getSystemTotals } from '@/features/analytics/queries';
import { listAuditLogs } from '@/features/admin/queries';

export const metadata: Metadata = { title: 'Administration' };

const LINKS = [
  { href: '/admin/analytics', label: 'Analytics', icon: ChartColumn, text: 'Projects by status, department, year and technology.' },
  { href: '/admin/users', label: 'Users', icon: Users, text: 'Promote representatives and faculty, deactivate accounts, reset passwords.' },
  { href: '/admin/projects', label: 'All projects', icon: Layers, text: 'Feature, archive or restore any project.' },
  { href: '/admin/departments', label: 'Departments', icon: Building2, text: 'Add or rename departments.' },
  { href: '/admin/academic-years', label: 'Academic years', icon: CalendarRange, text: 'Add years and set the current one.' },
  { href: '/admin/technologies', label: 'Technologies', icon: Cpu, text: 'Tidy the catalogue and merge duplicates.' },
  { href: '/admin/audit', label: 'Audit log', icon: ShieldCheck, text: 'Every sensitive action, with who and when.' },
];

export default async function AdminHome() {
  await requirePermission('admin:analytics');
  const [totals, audit] = await Promise.all([getSystemTotals(), listAuditLogs(1)]);

  return (
    <>
      <PageHeader title="Administration" description="Manage people, catalogue data and the repository." breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }]} />
      <Reveal stagger onScroll={false} className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Users" value={totals.users} icon={Users} href="/admin/users" tone="info" />
        <StatTile label="Projects" value={totals.projects} icon={FolderKanban} href="/admin/projects" />
        <StatTile label="Awaiting review" value={totals.pendingReviews} icon={Inbox} href="/admin/projects?status=SUBMITTED" tone="warning" />
        <StatTile label="Faculty" value={totals.byRole.FACULTY ?? 0} icon={Users} href="/admin/users?role=FACULTY" tone="success" />
      </Reveal>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Reveal stagger className="grid gap-3 sm:grid-cols-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-tile-3/50">
              <l.icon className="size-5 text-primary" />
              <p className="mt-3 flex items-center gap-1 font-semibold">{l.label} <ArrowRight className="size-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" /></p>
              <p className="mt-1 text-sm text-muted-foreground">{l.text}</p>
            </Link>
          ))}
        </Reveal>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Users by role</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {USER_ROLES.map((r) => (
                <div key={r} className="flex items-center justify-between text-sm">
                  <span>{ROLE_LABELS[r]}</span>
                  <span className="font-mono tabular-nums">{totals.byRole[r] ?? 0}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link href="/admin/audit">All</Link></Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {audit.items.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span className="truncate"><span className="font-medium">{a.user?.name ?? 'System'}</span> <span className="font-mono text-xs text-muted-foreground">{a.action}</span></span>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
                {audit.items.length === 0 && <li className="text-muted-foreground">No activity yet.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
