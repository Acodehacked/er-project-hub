import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/lib/auth/guards';
import { getAcademicYears, getCurrentAcademicYear, getDepartments } from '@/features/catalog/queries';
import { ProjectBasicsForm } from '@/features/projects/components/project-basics-form';
import { WIZARD_STEPS } from '@/features/projects/components/wizard-steps';

export const metadata: Metadata = { title: 'New project' };

export default async function NewProjectPage() {
  const user = await requirePermission('project:create');
  const [departments, years, current] = await Promise.all([getDepartments(), getAcademicYears(), getCurrentAcademicYear()]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Start a new project"
        description="Begin with the basics. You’ll add your team, technologies and files next — everything is saved as a draft."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My projects', href: '/dashboard/projects' }, { label: 'New' }]}
      />
      <ol className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
        {WIZARD_STEPS.map((s, i) => (
          <li key={s.key} className={i === 0 ? 'rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground' : 'rounded-full border px-3 py-1'}>
            {i + 1}. {s.label}
          </li>
        ))}
      </ol>
      <Card>
        <CardContent className="pt-6">
          <ProjectBasicsForm
            defaults={{
              title: '',
              abstract: '',
              description: '',
              departmentId: user.departmentId ?? '',
              academicYearId: current?.id ?? '',
            }}
            departments={departments.map((d) => ({ value: d.id, label: d.name }))}
            years={years.map((y) => ({ value: y.id, label: `${y.label}${y.isCurrent ? ' (current)' : ''}` }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
