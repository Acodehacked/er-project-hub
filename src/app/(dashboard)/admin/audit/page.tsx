import type { Metadata } from 'next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks } from '@/components/shared/pagination-links';
import { requirePermission } from '@/lib/auth/guards';
import { formatDateTime } from '@/lib/format';
import { pageSchema } from '@/lib/validation/common';
import { listAuditLogs } from '@/features/admin/queries';

export const metadata: Metadata = { title: 'Audit log' };

export default async function AuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requirePermission('admin:audit');
  const page = pageSchema.parse((await searchParams).page);
  const result = await listAuditLogs(page);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Sensitive actions: registrations, role changes, password resets, deletions, file uploads and live edits."
        breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Audit log' }]}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden lg:table-cell">Details</TableHead>
              <TableHead className="hidden md:table-cell">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</TableCell>
                <TableCell className="text-sm">{a.user ? `${a.user.name} (@${a.user.username})` : 'System'}</TableCell>
                <TableCell><span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{a.action}</span></TableCell>
                <TableCell className="hidden max-w-md truncate font-mono text-xs text-muted-foreground lg:table-cell" title={a.details ? JSON.stringify(a.details) : ''}>
                  {a.details ? JSON.stringify(a.details) : '—'}
                </TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{a.ipAddress ?? '—'}</TableCell>
              </TableRow>
            ))}
            {result.items.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No audit entries yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <PaginationLinks page={result.page} totalPages={result.totalPages} basePath="/admin/audit" searchParams={{}} />
    </>
  );
}
