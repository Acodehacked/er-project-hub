import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { requireUser } from '@/lib/auth/guards';
import { isStorageConfigured } from '@/lib/storage';
import { getAcademicYears, getDepartments, getFacultyGuides, getTechnologies } from '@/features/catalog/queries';
import { buildChecklist } from '@/features/projects/checklist';
import { loadManagedProject } from '@/features/projects/load';
import { getOpenRevision } from '@/features/projects/queries';
import { canEditContent, canEditLight, canManageTeam, canProposeRevision, canSubmit, isLeader } from '@/features/projects/policy';
import { ProjectBasicsForm } from '@/features/projects/components/project-basics-form';
import { RevisionForm } from '@/features/projects/components/revision-form';
import { TeamManager } from '@/features/projects/components/team-manager';
import { TechAndLinks } from '@/features/projects/components/tech-and-links';
import { WizardSteps, WIZARD_STEPS, type WizardStep } from '@/features/projects/components/wizard-steps';
import { Checklist, SubmitButton } from '@/features/projects/components/project-actions-panel';
import { FileManager } from '@/features/files/components/file-manager';

export const metadata: Metadata = { title: 'Edit project' };

export default async function EditProjectPage({ params, searchParams }: PageProps<'/dashboard/projects/[id]/edit'>) {
  const user = await requireUser();
  const project = await loadManagedProject((await params).id, user);
  const rawStep = (await searchParams).step;
  const step: WizardStep = WIZARD_STEPS.some((s) => s.key === rawStep) ? (rawStep as WizardStep) : 'basics';

  const approved = project.status === 'APPROVED';
  const fullEdit = canEditContent(user, project);
  const lightEdit = canEditLight(user, project);
  const locked = !lightEdit;
  const checklist = buildChecklist(project);
  const done = {
    basics: project.abstract.length >= 50,
    team: project.members.length > 1 || !!project.guideId,
    tech: project.technologies.length > 0,
    files: project.images.length + project.documents.length > 0,
  };
  const stepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);
  const prev = WIZARD_STEPS[stepIndex - 1];
  const next = WIZARD_STEPS[stepIndex + 1];

  const [departments, years] = await Promise.all([getDepartments(), getAcademicYears()]);
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const yearOptions = years.map((y) => ({ value: y.id, label: y.label }));
  const basics = {
    title: project.title,
    abstract: project.abstract,
    description: project.description ?? '',
    departmentId: project.departmentId,
    academicYearId: project.academicYearId,
  };

  let body: React.ReactNode;
  if (step === 'basics') {
    if (approved && canProposeRevision(user, project)) {
      const open = await getOpenRevision(project.id);
      body = (
        <RevisionForm
          projectId={project.id}
          current={basics}
          departments={deptOptions}
          years={yearOptions}
          disabledReason={open ? 'A revision is already waiting for review. Withdraw it from the project overview to propose another.' : undefined}
        />
      );
    } else {
      body = fullEdit ? (
        <ProjectBasicsForm projectId={project.id} defaults={basics} departments={deptOptions} years={yearOptions} />
      ) : (
        <p className="text-sm text-muted-foreground">These details cannot be edited right now.</p>
      );
    }
  } else if (step === 'team') {
    const guides = await getFacultyGuides();
    const mode = canManageTeam(user, project) ? 'direct' : approved && (isLeader(user, project) || user.role === 'ADMIN') ? 'revision' : 'readonly';
    body = (
      <TeamManager
        projectId={project.id}
        mode={mode}
        guideId={project.guideId}
        canChooseGuide={canManageTeam(user, project)}
        guides={guides.map((g) => ({ value: g.id, label: `${g.name}${g.department ? ` (${g.department.code})` : ''}` }))}
        members={project.members.map((m) => ({
          memberId: m.id,
          userId: m.user.id,
          name: m.user.name,
          username: m.user.username,
          avatarKey: m.user.avatarKey,
          role: m.role,
          roleTitle: m.roleTitle,
        }))}
      />
    );
  } else if (step === 'tech') {
    const all = await getTechnologies();
    body = (
      <TechAndLinks
        projectId={project.id}
        allTechnologies={all}
        selectedIds={project.technologies.map((t) => t.technologyId)}
        links={{ githubUrl: project.githubUrl ?? '', demoUrl: project.demoUrl ?? '' }}
        readOnly={!lightEdit}
        live={approved}
      />
    );
  } else if (step === 'files') {
    body = (
      <FileManager
        projectId={project.id}
        storageReady={isStorageConfigured}
        readOnly={!lightEdit}
        images={project.images.map((i) => ({ id: i.id, fileName: i.fileName, isCover: i.isCover, caption: i.caption }))}
        documents={project.documents.map((d) => ({ id: d.id, fileName: d.fileName, kind: d.kind, fileSize: d.fileSize }))}
      />
    );
  } else {
    const ready = checklist.every((i) => !i.required || i.done);
    body = (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Final check</CardTitle>
            <CardDescription>Fix anything marked required, then submit. Preview the public page to see what reviewers will see.</CardDescription>
          </CardHeader>
          <CardContent><Checklist projectId={project.id} items={checklist} editable={fullEdit} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>A student representative of your department screens the submission.</li>
              <li>{project.guide ? `Your guide, ${project.guide.name}, ` : 'Department faculty '}makes the final decision.</li>
              <li>Once approved, the project is published in the repository and on every member’s profile.</li>
            </ol>
            <Button asChild variant="outline" className="w-full"><Link href={`/projects/${project.slug}`}>Preview public page</Link></Button>
            {canSubmit(user, project) ? (
              <SubmitButton projectId={project.id} ready={ready} resubmit={project.status === 'REJECTED'} />
            ) : approved ? (
              <p className="rounded-lg bg-success/10 p-3 text-success">This project is already published.</p>
            ) : (
              <p className="rounded-lg bg-muted p-3">Only the team leader ({project.leader.name}) can submit.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={project.title}
        description={<span className="flex items-center gap-2"><StatusBadge status={project.status} /> {approved && <span className="text-sm">Links, technologies and files update live.</span>}</span>}
        breadcrumbs={[
          { label: 'My projects', href: '/dashboard/projects' },
          { label: project.title, href: `/dashboard/projects/${project.id}` },
          { label: 'Edit' },
        ]}
      />
      <WizardSteps projectId={project.id} current={step} done={done} />
      {locked && (
        <Alert className="mb-6">
          <Lock />
          <AlertTitle>Locked while in review</AlertTitle>
          <AlertDescription>You can look around, but changes are disabled until reviewers finish.</AlertDescription>
        </Alert>
      )}
      {body}
      <div className="mt-8 flex justify-between border-t pt-5">
        {prev ? (
          <Button asChild variant="ghost"><Link href={`/dashboard/projects/${project.id}/edit?step=${prev.key}`}><ArrowLeft /> {prev.label}</Link></Button>
        ) : (
          <Button asChild variant="ghost"><Link href={`/dashboard/projects/${project.id}`}><ArrowLeft /> Overview</Link></Button>
        )}
        {next && (
          <Button asChild variant="ghost"><Link href={`/dashboard/projects/${project.id}/edit?step=${next.key}`}>{next.label} <ArrowRight /></Link></Button>
        )}
      </div>
    </div>
  );
}
