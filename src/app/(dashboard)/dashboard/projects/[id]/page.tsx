import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleAlert, ExternalLink, GitPullRequestArrow, Lock, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectCover } from '@/components/shared/project-cover';
import { RevisionStatusBadge, StatusBadge } from '@/components/shared/status-badge';
import { StatusTimeline } from '@/components/shared/status-timeline';
import { AvatarStack } from '@/components/shared/user-avatar';
import { requireUser } from '@/lib/auth/guards';
import { formatDate, timeAgo } from '@/lib/format';
import { buildChecklist } from '@/features/projects/checklist';
import { loadManagedProject } from '@/features/projects/load';
import { getOpenRevision, getProjectTimeline, getRevisionHistory } from '@/features/projects/queries';
import { canDeleteProject, canEditContent, canEditLight, canProposeRevision, canSubmit } from '@/features/projects/policy';
import {
  CancelRevisionButton,
  Checklist,
  DeleteProjectButton,
  SubmitButton,
} from '@/features/projects/components/project-actions-panel';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectOverviewPage({ params }: PageProps<'/dashboard/projects/[id]'>) {
  const user = await requireUser();
  const project = await loadManagedProject((await params).id, user);
  const [timeline, openRevision, revisions] = await Promise.all([
    getProjectTimeline(project.id),
    getOpenRevision(project.id),
    getRevisionHistory(project.id),
  ]);

  const checklist = buildChecklist(project);
  const ready = checklist.every((i) => !i.required || i.done);
  const lastRejection = [...timeline].reverse().find((t) => t.action === 'REJECT' && !t.revisionId);
  const locked = project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW';
  const editHref = `/dashboard/projects/${project.id}/edit?step=${project.status === 'APPROVED' ? 'tech' : 'basics'}`;

  return (
    <>
      <PageHeader
        title={project.title}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My projects', href: '/dashboard/projects' }, { label: project.title }]}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <span className="text-sm">{project.department.code} · {project.academicYear.label} · updated {timeAgo(project.updatedAt)}</span>
          </span>
        }
        actions={
          <>
            {(project.status === 'APPROVED' || canEditLight(user, project)) && (
              <Button asChild variant="outline"><Link href={`/projects/${project.slug}`}><ExternalLink /> {project.status === 'APPROVED' ? 'View public page' : 'Preview'}</Link></Button>
            )}
            {canEditLight(user, project) && <Button asChild><Link href={editHref}><Pencil /> Edit project</Link></Button>}
          </>
        }
      />

      {project.status === 'REJECTED' && lastRejection && (
        <Alert variant="destructive" className="mb-6 border-destructive/30 bg-destructive/5">
          <CircleAlert />
          <AlertTitle>Changes requested by {lastRejection.actor.name}</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{lastRejection.comment}</AlertDescription>
        </Alert>
      )}
      {locked && (
        <Alert className="mb-6 border-info/30 bg-info/5">
          <Lock className="text-info" />
          <AlertTitle>{project.status === 'SUBMITTED' ? 'Waiting for screening' : 'With faculty for final review'}</AlertTitle>
          <AlertDescription>The project is locked while it is being reviewed. You’ll get a notification when there’s a decision.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden pt-0">
            <div className="aspect-[16/6] bg-muted">
              <ProjectCover imageId={project.images.find((i) => i.isCover)?.id} seed={project.slug} title={project.title} />
            </div>
            <CardContent className="space-y-4">
              <p className="leading-relaxed whitespace-pre-line text-foreground/90">{project.abstract}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <AvatarStack users={project.members.map((m) => m.user)} />
                <span>{project.members.length} member{project.members.length === 1 ? '' : 's'}</span>
                {project.guide && <span>Guide: <span className="font-medium text-foreground">{project.guide.name}</span></span>}
                {project.approvedAt && <span>Published {formatDate(project.approvedAt)}</span>}
              </div>
            </CardContent>
          </Card>

          {project.status === 'APPROVED' && (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base"><GitPullRequestArrow className="size-4 text-primary" /> Revisions</CardTitle>
                  <CardDescription>Changes to the title, abstract, details or team of a published project are reviewed first.</CardDescription>
                </div>
                {canProposeRevision(user, project) && !openRevision && (
                  <Button asChild size="sm" variant="outline"><Link href={`/dashboard/projects/${project.id}/edit?step=basics`}>Propose changes</Link></Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {openRevision && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tile-3/30 bg-accent/50 p-3">
                    <div className="text-sm">
                      <p className="font-medium">Revision in review</p>
                      <p className="text-muted-foreground">Proposed by {openRevision.proposedBy.name} · {timeAgo(openRevision.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RevisionStatusBadge status={openRevision.status} />
                      <CancelRevisionButton revisionId={openRevision.id} />
                    </div>
                  </div>
                )}
                {revisions.filter((r) => r.id !== openRevision?.id).length === 0 && !openRevision && (
                  <p className="text-sm text-muted-foreground">No revisions yet.</p>
                )}
                {revisions
                  .filter((r) => r.id !== openRevision?.id)
                  .slice(0, 5)
                  .map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">
                        {Object.keys(r.changes).map((k) => k.replace('Id', '')).join(', ')} · {r.proposedBy.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {formatDate(r.createdAt)} <RevisionStatusBadge status={r.status} />
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Review history</CardTitle></CardHeader>
            <CardContent><StatusTimeline steps={timeline} emptyText="Not submitted yet. When you submit, every review step appears here." /></CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {(canEditContent(user, project) || canSubmit(user, project)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ready to submit?</CardTitle>
                <CardDescription>Complete the required items. Optional ones make your project stand out.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Checklist projectId={project.id} items={checklist} editable={canEditContent(user, project)} />
                {canSubmit(user, project) ? (
                  <SubmitButton projectId={project.id} ready={ready} resubmit={project.status === 'REJECTED'} />
                ) : (
                  <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Only the team leader ({project.leader.name}) can submit this project.</p>
                )}
                {canDeleteProject(user, project) && project.status === 'DRAFT' && <DeleteProjectButton projectId={project.id} title={project.title} />}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Quick edit</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              {[
                ['basics', project.status === 'APPROVED' ? 'Propose content changes' : 'Title & abstract'],
                ['team', 'Team & guide'],
                ['tech', 'Technologies & links'],
                ['files', 'Images & documents'],
              ].map(([step, label]) => (
                <Button key={step} asChild variant="outline" className="justify-start" disabled={locked}>
                  <Link href={`/dashboard/projects/${project.id}/edit?step=${step}`}>{label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
