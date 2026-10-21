import type { Metadata } from 'next';
import Link from 'next/link';
import { FolderKanban, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectCard } from '@/components/shared/project-card';
import { Reveal } from '@/components/motion/reveal';
import { requirePermission } from '@/lib/auth/guards';
import { listMyProjects } from '@/features/projects/queries';
import { getProjectCards } from '@/features/repository/queries';
import type { ProjectStatus } from '@/types';

export const metadata: Metadata = { title: 'My projects' };

const TABS: { key: string; label: string; statuses: ProjectStatus[] }[] = [
  { key: 'all', label: 'All', statuses: [] },
  { key: 'drafts', label: 'Drafts & changes', statuses: ['DRAFT', 'REJECTED'] },
  { key: 'review', label: 'In review', statuses: ['SUBMITTED', 'UNDER_REVIEW'] },
  { key: 'published', label: 'Published', statuses: ['APPROVED'] },
];

export default async function MyProjectsPage() {
  const user = await requirePermission('project:create');
  const mine = await listMyProjects(user.id);
  const cards = await getProjectCards(mine.map((p) => p.id));

  return (
    <>
      <PageHeader
        title="My projects"
        description="Everything you lead or are a member of."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My projects' }]}
        actions={<Button asChild><Link href="/dashboard/projects/new"><Plus /> New project</Link></Button>}
      />
      {cards.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="You have no projects yet"
          description="Create a draft to get started. Your team leader submits it for review when it’s ready."
          action={<Button asChild><Link href="/dashboard/projects/new"><Plus /> Create a project</Link></Button>}
        />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            {TABS.map((t) => {
              const n = t.statuses.length ? cards.filter((c) => t.statuses.includes(c.status)).length : cards.length;
              return <TabsTrigger key={t.key} value={t.key}>{t.label} <span className="ml-1 text-muted-foreground">{n}</span></TabsTrigger>;
            })}
          </TabsList>
          {TABS.map((t) => {
            const list = t.statuses.length ? cards.filter((c) => t.statuses.includes(c.status)) : cards;
            return (
              <TabsContent key={t.key} value={t.key}>
                {list.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nothing here.</p>
                ) : (
                  <Reveal stagger replayKey={t.key} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((p) => (
                      <ProjectCard key={p.id} project={p} href={`/dashboard/projects/${p.id}`} showStatus />
                    ))}
                  </Reveal>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );
}
