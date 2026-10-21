import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusTimeline } from '@/components/shared/status-timeline';
import { requireUser } from '@/lib/auth/guards';
import { idSchema } from '@/lib/validation/common';
import { getProjectById, getProjectTimeline } from '@/features/projects/queries';
import { canDownloadDocuments, canFinalReview, canScreen, canViewProject, isMember } from '@/features/projects/policy';
import { ProjectDetailView } from '@/features/projects/components/project-detail-view';
import { DecisionPanel } from '@/features/reviews/components/decision-panel';

export const metadata: Metadata = { title: 'Review project' };

export default async function ReviewProjectPage({ params }: PageProps<'/dashboard/reviews/[id]'>) {
  const user = await requireUser();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const project = await getProjectById(id.data);
  if (!project || !canViewProject(user, project)) notFound();
  // Team members manage their own project elsewhere — and can never review it.
  if (isMember(user, project)) redirect(`/dashboard/projects/${project.id}`);

  const timeline = await getProjectTimeline(project.id);
  const stage = canScreen(user, project) ? 'screen' : canFinalReview(user, project) ? 'final' : null;

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Reviews', href: '/dashboard/reviews' }, { label: project.title }]} />
      <ProjectDetailView
        project={project}
        canDownload={canDownloadDocuments(user, project)}
        aside={
          <>
            {stage ? (
              <DecisionPanel targetId={project.id} target="project" stage={stage} />
            ) : (
              <p className="rounded-xl border bg-muted/50 p-4 text-sm text-muted-foreground">
                No decision is needed from you at this stage.
              </p>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base">Review history</CardTitle></CardHeader>
              <CardContent><StatusTimeline steps={timeline.filter((t) => !t.revisionId)} /></CardContent>
            </Card>
          </>
        }
      />
    </>
  );
}
