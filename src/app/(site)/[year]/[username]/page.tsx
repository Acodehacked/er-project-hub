import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ProjectCard } from '@/components/shared/project-card';
import { Reveal } from '@/components/motion/reveal';
import { isStudentLike } from '@/lib/auth/rbac';
import { MEMBER_ROLE_LABELS } from '@/lib/format';
import { getPublicProfile, getStudentApprovedProjects } from '@/features/profiles/queries';
import { ProfileHeader } from '@/features/profiles/components/profile-header';

/**
 * Student profile: /2026/abinantony
 * The year segment must be the student's graduation year; a wrong year
 * redirects to the canonical URL. Only APPROVED projects are listed.
 */
export async function generateMetadata({ params }: PageProps<'/[year]/[username]'>): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  return { title: profile ? `${profile.name}` : 'Profile' };
}

export default async function StudentProfilePage({ params }: PageProps<'/[year]/[username]'>) {
  const { year, username } = await params;
  if (!/^\d{4}$/.test(year)) notFound();

  const profile = await getPublicProfile(username);
  if (!profile || !isStudentLike(profile.role) || !profile.graduationYear) notFound();
  if (String(profile.graduationYear) !== year || username !== profile.username) {
    permanentRedirect(`/${profile.graduationYear}/${profile.username}`);
  }

  const projects = await getStudentApprovedProjects(profile.id);
  const led = projects.filter((p) => p.memberRole === 'LEADER').length;

  return (
    <>
      <ProfileHeader profile={profile} stats={[{ label: 'Projects', value: projects.length }, { label: 'Led', value: led }]} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-5 text-xl font-semibold">Published projects</h2>
        {projects.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No published projects yet" description={`${profile.name.split(' ')[0]}'s approved projects will appear here.`} />
        ) : (
          <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                footer={<p className="text-xs text-muted-foreground">Role: <span className="font-medium text-foreground">{MEMBER_ROLE_LABELS[p.memberRole]}{p.memberRoleTitle ? ` · ${p.memberRoleTitle}` : ''}</span></p>}
              />
            ))}
          </Reveal>
        )}
      </div>
    </>
  );
}
