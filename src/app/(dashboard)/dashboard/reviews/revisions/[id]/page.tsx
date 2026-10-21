import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { inArray } from 'drizzle-orm';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { RevisionStatusBadge } from '@/components/shared/status-badge';
import { StatusTimeline } from '@/components/shared/status-timeline';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/auth/guards';
import { MEMBER_ROLE_LABELS, timeAgo } from '@/lib/format';
import { idSchema } from '@/lib/validation/common';
import { getAcademicYears, getDepartments } from '@/features/catalog/queries';
import { getProjectById } from '@/features/projects/queries';
import { canFinalReviewRevision, canScreenRevision, canViewProject, isMember } from '@/features/projects/policy';
import { getRevisionById } from '@/features/reviews/queries';
import { DecisionPanel } from '@/features/reviews/components/decision-panel';

export const metadata: Metadata = { title: 'Review revision' };

function Diff({ label, before, after }: { label: string; before: React.ReactNode; after: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm whitespace-pre-line">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-destructive uppercase">Current</p>
          {before || <span className="text-muted-foreground">(empty)</span>}
        </div>
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-sm whitespace-pre-line">
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-success uppercase">Proposed</p>
          {after || <span className="text-muted-foreground">(empty)</span>}
        </div>
      </div>
    </div>
  );
}

export default async function ReviewRevisionPage({ params }: PageProps<'/dashboard/reviews/revisions/[id]'>) {
  const user = await requireUser();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const revision = await getRevisionById(id.data);
  if (!revision) notFound();
  const project = await getProjectById(revision.projectId);
  if (!project || !canViewProject(user, project)) notFound();
  // The project may be public, but its pending revisions are not.
  const involved =
    isMember(user, project) ||
    project.guideId === user.id ||
    user.role === 'ADMIN' ||
    (user.role !== 'STUDENT' && user.departmentId === project.departmentId);
  if (!involved) notFound();

  const [departments, years] = await Promise.all([getDepartments(), getAcademicYears()]);
  const deptName = (id?: string) => departments.find((d) => d.id === id)?.name;
  const yearName = (id?: string) => years.find((y) => y.id === id)?.label;
  const c = revision.changes;

  const proposedMembers = c.members
    ? await db.query.users.findMany({ where: inArray(users.id, c.members.map((m) => m.userId).concat('__none')), columns: { id: true, name: true } })
    : [];

  const member = isMember(user, project);
  const stage = member
    ? null
    : canScreenRevision(user, project, revision.status)
      ? 'screen'
      : canFinalReviewRevision(user, project, revision.status)
        ? 'final'
        : null;

  return (
    <>
      <PageHeader
        title={`Revision: ${project.title}`}
        description={<span className="flex flex-wrap items-center gap-2"><RevisionStatusBadge status={revision.status} /> Proposed by {revision.proposedBy.name} · {timeAgo(revision.createdAt)}</span>}
        breadcrumbs={[{ label: 'Reviews', href: '/dashboard/reviews?tab=revisions' }, { label: 'Revision' }]}
        actions={<Button asChild variant="outline"><Link href={`/projects/${project.slug}`}><ExternalLink /> Live project</Link></Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Proposed changes</CardTitle>
            <CardDescription>The live project keeps its current content until this revision is approved.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {c.title !== undefined && <Diff label="Title" before={project.title} after={c.title} />}
            {c.abstract !== undefined && <Diff label="Abstract" before={project.abstract} after={c.abstract} />}
            {c.description !== undefined && <Diff label="Description" before={project.description} after={c.description} />}
            {c.departmentId !== undefined && <Diff label="Department" before={project.department.name} after={deptName(c.departmentId)} />}
            {c.academicYearId !== undefined && <Diff label="Academic year" before={project.academicYear.label} after={yearName(c.academicYearId)} />}
            {c.members && (
              <Diff
                label="Team"
                before={project.members.map((m) => `${m.user.name} — ${MEMBER_ROLE_LABELS[m.role]}`).join('\n')}
                after={[
                  `${project.leader.name} — Leader`,
                  ...c.members.map((m) => `${proposedMembers.find((u) => u.id === m.userId)?.name ?? 'Unknown'} — ${MEMBER_ROLE_LABELS[m.role]}${m.roleTitle ? ` (${m.roleTitle})` : ''}`),
                ].join('\n')}
              />
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          {stage && <DecisionPanel targetId={revision.id} target="revision" stage={stage} />}
          <Card>
            <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
            <CardContent><StatusTimeline steps={revision.approvals} /></CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
