import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Info, Pencil } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusTimeline } from '@/components/shared/status-timeline';
import { getCurrentUser } from '@/lib/auth/session';
import { getProjectBySlug, getProjectTimeline } from '@/features/projects/queries';
import { canDownloadDocuments, canEditLight, canViewProject, isMember } from '@/features/projects/policy';
import { ProjectDetailView } from '@/features/projects/components/project-detail-view';
import { ViewTracker } from '@/features/projects/components/view-tracker';

export async function generateMetadata({ params }: PageProps<'/projects/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project || project.status !== 'APPROVED') return { title: 'Project' };
  return { title: project.title, description: project.abstract.slice(0, 160) };
}

export default async function ProjectPage({ params }: PageProps<'/projects/[slug]'>) {
  const { slug } = await params;
  const [project, user] = await Promise.all([getProjectBySlug(slug), getCurrentUser()]);

  // Unauthorised viewers get a 404 rather than 403, so hidden projects are not revealed.
  if (!project || !canViewProject(user, project)) notFound();

  const insider =
    !!user &&
    (isMember(user, project) ||
      project.guideId === user.id ||
      user.role === 'ADMIN' ||
      (user.role !== 'STUDENT' && user.departmentId === project.departmentId));
  const timeline = insider ? await getProjectTimeline(project.id) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <PageHeader
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.department.code, href: `/projects?department=${project.department.code}` }, { label: project.title }]}
      />
      {project.status !== 'APPROVED' && (
        <Alert className="mb-6 border-info/30 bg-info/5">
          <Info className="text-info" />
          <AlertTitle>Not public yet</AlertTitle>
          <AlertDescription>Only the team, its reviewers and administrators can see this page until the project is approved.</AlertDescription>
        </Alert>
      )}
      <ProjectDetailView
        project={project}
        canDownload={canDownloadDocuments(user, project)}
        aside={
          <>
            {canEditLight(user, project) && (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/dashboard/projects/${project.id}`}><Pencil /> Manage this project</Link>
              </Button>
            )}
            {insider && (
              <Card>
                <CardHeader><CardTitle className="text-base">Review history</CardTitle></CardHeader>
                <CardContent><StatusTimeline steps={timeline.filter((t) => !t.revisionId)} /></CardContent>
              </Card>
            )}
          </>
        }
      />
      {project.status === 'APPROVED' && <ViewTracker projectId={project.id} />}
    </div>
  );
}
