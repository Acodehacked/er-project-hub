import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Reveal } from '@/components/motion/reveal';
import { requirePermission } from '@/lib/auth/guards';
import { STATUS_LABELS } from '@/lib/format';
import {
  getDecisionsOverTime,
  getMostViewed,
  getProjectsByDepartment,
  getProjectsByYear,
  getStatusBreakdown,
  getTopTechnologies,
} from '@/features/analytics/queries';
import { DecisionTrend, GroupedBars, StatusPie, TechBars } from '@/features/analytics/components/charts';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  await requirePermission('admin:analytics');
  const [status, byDept, byYear, techs, trend, viewed] = await Promise.all([
    getStatusBreakdown(),
    getProjectsByDepartment(),
    getProjectsByYear(),
    getTopTechnologies(10),
    getDecisionsOverTime(),
    getMostViewed(8),
  ]);

  return (
    <>
      <PageHeader title="Analytics" description="How the repository is growing." breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Analytics' }]} />
      <Reveal stagger className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Projects by status</CardTitle><CardDescription>Every project in the system</CardDescription></CardHeader>
          <CardContent><StatusPie data={status.map((s) => ({ ...s, label: STATUS_LABELS[s.status] }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Review activity</CardTitle><CardDescription>Last 12 months</CardDescription></CardHeader>
          <CardContent><DecisionTrend data={trend} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By department</CardTitle></CardHeader>
          <CardContent><GroupedBars data={byDept} xKey="code" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By academic year</CardTitle></CardHeader>
          <CardContent><GroupedBars data={byYear} xKey="label" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top technologies</CardTitle><CardDescription>Across approved projects</CardDescription></CardHeader>
          <CardContent><TechBars data={techs} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most viewed</CardTitle><CardDescription>Unique daily views of approved projects</CardDescription></CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {viewed.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 place-items-center rounded-full bg-accent font-mono text-xs text-accent-foreground">{i + 1}</span>
                  <Link href={`/projects/${p.slug}`} className="min-w-0 flex-1 truncate hover:text-accent-foreground">{p.title}</Link>
                  <span className="font-mono text-muted-foreground tabular-nums">{p.viewsCount}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </Reveal>
    </>
  );
}
