import type { Metadata } from 'next';
import { count, eq } from 'drizzle-orm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/db';
import { departments, projects, users } from '@/db/schema';
import { requirePermission } from '@/lib/auth/guards';
import { deleteDepartmentAction } from '@/actions/admin-actions';
import { ConfirmActionButton, DepartmentDialog } from '@/features/admin/components/catalog-forms';

export const metadata: Metadata = { title: 'Departments' };

export default async function DepartmentsPage() {
  await requirePermission('admin:catalog');
  const rows = await db
    .select({
      id: departments.id,
      name: departments.name,
      code: departments.code,
      description: departments.description,
      projectCount: db.$count(projects, eq(projects.departmentId, departments.id)),
      userCount: db.$count(users, eq(users.departmentId, departments.id)),
    })
    .from(departments)
    .orderBy(departments.name);

  return (
    <>
      <PageHeader
        title="Departments"
        description="Reviewers only see projects from their own department."
        breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Departments' }]}
        actions={<DepartmentDialog />}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <p className="font-medium">{d.name}</p>
                  {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                </TableCell>
                <TableCell className="font-mono">{d.code}</TableCell>
                <TableCell className="text-right tabular-nums">{d.userCount}</TableCell>
                <TableCell className="text-right tabular-nums">{d.projectCount}</TableCell>
                <TableCell className="text-right">
                  <DepartmentDialog department={{ id: d.id, name: d.name, code: d.code, description: d.description ?? '' }} />
                  <ConfirmActionButton action={deleteDepartmentAction} id={d.id} title={`Delete ${d.name}?`} description="Departments with projects cannot be deleted. Users in this department will have no department." />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
