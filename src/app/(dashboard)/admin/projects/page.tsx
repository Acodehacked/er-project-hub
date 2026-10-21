import type { Metadata } from 'next';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks } from '@/components/shared/pagination-links';
import { SearchForm } from '@/components/shared/search-form';
import { StatusBadge } from '@/components/shared/status-badge';
import { requirePermission } from '@/lib/auth/guards';
import { STATUS_LABELS, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { adminProjectQuerySchema } from '@/lib/validation/project';
import { PROJECT_STATUSES } from '@/db/schema/enums';
import { listAllProjects } from '@/features/admin/queries';
import { ProjectRowActions } from '@/features/admin/components/project-row-actions';

export const metadata: Metadata = { title: 'All projects' };

export default async function AdminProjectsPage({ searchParams }: PageProps<'/admin/projects'>) {
  await requirePermission('admin:projects');
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const query = adminProjectQuerySchema.parse(flat);
  const result = await listAllProjects(query);

  const statusHref = (s?: string) => {
    const p = new URLSearchParams();
    if (query.q) p.set('q', query.q);
    if (s) p.set('status', s);
    return `/admin/projects${p.size ? `?${p}` : ''}`;
  };

  return (
    <>
      <PageHeader title="All projects" description="Every project in every state." breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Projects' }]} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[undefined, ...PROJECT_STATUSES].map((s) => (
            <Link key={s ?? 'all'} href={statusHref(s)} className={cn('rounded-full border px-3 py-1 text-sm transition-colors', query.status === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/50')}>
              {s ? STATUS_LABELS[s] : 'All'}
            </Link>
          ))}
        </div>
        <SearchForm defaultValue={query.q} placeholder="Search titles…" keep={{ status: query.status }} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Dept · Year</TableHead>
              <TableHead className="hidden lg:table-cell">Updated</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <p className="flex items-center gap-1.5 font-medium">{p.isFeatured && <Star className="size-3.5 fill-primary text-primary" aria-label="Featured" />}{p.title}</p>
                  <p className="text-xs text-muted-foreground">Led by {p.leader.name} · {p.viewsCount} views</p>
                </TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="hidden font-mono text-sm md:table-cell">{p.department.code} · {p.academicYear.label}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{timeAgo(p.updatedAt)}</TableCell>
                <TableCell><ProjectRowActions project={p} /></TableCell>
              </TableRow>
            ))}
            {result.items.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No projects match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <PaginationLinks page={result.page} totalPages={result.totalPages} basePath="/admin/projects" searchParams={flat} />
    </>
  );
}
