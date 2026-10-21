import type { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectCard } from '@/components/shared/project-card';
import { Reveal } from '@/components/motion/reveal';
import { requirePermission } from '@/lib/auth/guards';
import { listGuidedProjects } from '@/features/projects/queries';
import { getProjectCards } from '@/features/repository/queries';

export const metadata: Metadata = { title: 'Guiding' };

export default async function GuidingPage() {
  const user = await requirePermission('project:guide');
  const guided = await listGuidedProjects(user.id);
  const cards = await getProjectCards(guided.map((p) => p.id));

  return (
    <>
      <PageHeader
        title="Teams you guide"
        description="Students choose you as their guide. You make the final review decision on these projects."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Guiding' }]}
      />
      {cards.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No teams yet" description="When a team selects you as their faculty guide, their project appears here." />
      ) : (
        <Reveal stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((p) => (
            <ProjectCard key={p.id} project={p} href={p.status === 'APPROVED' ? `/projects/${p.slug}` : `/dashboard/reviews/${p.id}`} showStatus />
          ))}
        </Reveal>
      )}
    </>
  );
}
