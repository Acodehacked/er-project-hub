import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/db';
import { academicYears, projects } from '@/db/schema';
import { requirePermission } from '@/lib/auth/guards';
import { deleteAcademicYearAction } from '@/actions/admin-actions';
import { ConfirmActionButton } from '@/features/admin/components/catalog-forms';
import { AddAcademicYear, MakeCurrentButton } from '@/features/admin/components/academic-year-controls';

export const metadata: Metadata = { title: 'Academic years' };

export default async function AcademicYearsPage() {
  await requirePermission('admin:catalog');
  const rows = await db
    .select({
      id: academicYears.id,
      label: academicYears.label,
      startYear: academicYears.startYear,
      isCurrent: academicYears.isCurrent,
      projectCount: db.$count(projects, eq(projects.academicYearId, academicYears.id)),
    })
    .from(academicYears)
    .orderBy(desc(academicYears.startYear));
  const suggested = (rows[0]?.startYear ?? new Date().getFullYear() - 1) + 1;

  return (
    <>
      <PageHeader
        title="Academic years"
        description="The current year is pre-selected when students create a project."
        breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Academic years' }]}
        actions={<AddAcademicYear suggested={suggested} />}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead className="w-48 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((y) => (
              <TableRow key={y.id}>
                <TableCell className="font-medium">{y.label} {y.isCurrent && <Badge className="ml-2">Current</Badge>}</TableCell>
                <TableCell className="text-right tabular-nums">{y.projectCount}</TableCell>
                <TableCell className="text-right">
                  {!y.isCurrent && <MakeCurrentButton id={y.id} />}
                  <ConfirmActionButton action={deleteAcademicYearAction} id={y.id} title={`Delete ${y.label}?`} description="Years with projects cannot be deleted." />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
