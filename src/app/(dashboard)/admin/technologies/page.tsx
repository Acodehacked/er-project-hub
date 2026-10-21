import type { Metadata } from 'next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/lib/auth/guards';
import { TECH_CATEGORY_LABELS } from '@/lib/format';
import { deleteTechnologyAction } from '@/actions/admin-actions';
import { getTechnologyUsage } from '@/features/repository/queries';
import { ConfirmActionButton, MergeTechnologyDialog, TechnologyDialog } from '@/features/admin/components/catalog-forms';

export const metadata: Metadata = { title: 'Technologies' };

export default async function TechnologiesAdminPage() {
  await requirePermission('admin:catalog');
  const techs = (await getTechnologyUsage()).sort((a, b) => a.name.localeCompare(b.name));
  const options = techs.map((t) => ({ id: t.id, name: t.name }));

  return (
    <>
      <PageHeader
        title="Technologies"
        description="Students can add new technologies while editing; merge duplicates like “ReactJS” into “React” here."
        breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Technologies' }]}
        actions={<TechnologyDialog />}
      />
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Approved projects</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {techs.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono font-medium">{t.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{TECH_CATEGORY_LABELS[t.category]}</TableCell>
                <TableCell className="text-right tabular-nums">{t.projectCount}</TableCell>
                <TableCell className="text-right">
                  <TechnologyDialog technology={{ id: t.id, name: t.name, category: t.category }} />
                  <MergeTechnologyDialog source={{ id: t.id, name: t.name }} options={options} />
                  <ConfirmActionButton action={deleteTechnologyAction} id={t.id} title={`Delete ${t.name}?`} description="Technologies used by projects cannot be deleted — merge them instead." />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
