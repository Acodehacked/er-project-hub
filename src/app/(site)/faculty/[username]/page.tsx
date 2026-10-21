import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ProjectCard } from '@/components/shared/project-card';
import { Reveal } from '@/components/motion/reveal';
import { getGuidedApprovedProjects, getPublicProfile } from '@/features/profiles/queries';
import { ProfileHeader } from '@/features/profiles/components/profile-header';

/** Faculty profile: /faculty/meeranair — lists the approved projects they guided. */
export async function generateMetadata({ params }: PageProps<'/faculty/[username]'>): Promise<Metadata> {
  const profile = await getPublicProfile((await params).username);
  return { title: profile ? profile.name : 'Faculty' };
}

export default async function FacultyProfilePage({ params }: PageProps<'/faculty/[username]'>) {
  const profile = await getPublicProfile((await params).username);
  if (!profile || profile.role !== 'FACULTY') notFound();
  const projects = await getGuidedApprovedProjects(profile.id);

  return (
    <>
      <ProfileHeader profile={profile} stats={[{ label: 'Projects guided', value: projects.length }]} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-5 text-xl font-semibold">Guided projects</h2>
        {projects.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No published guided projects yet" />
        ) : (
          <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </Reveal>
        )}
      </div>
    </>
  );
}
