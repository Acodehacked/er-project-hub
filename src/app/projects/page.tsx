import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PaginationLinks } from '@/components/shared/pagination-links';
import { ProjectCard } from '@/components/shared/project-card';
import { Reveal } from '@/components/motion/reveal';
import { repositoryQuerySchema } from '@/lib/validation/project';
import { getRepositoryFilters, searchRepository } from '@/features/repository/queries';
import { RepositoryFilterSidebar, RepositorySearchBar } from '@/features/repository/components/repository-filters';

export const metadata: Metadata = {
  title: 'Project repository',
  description: 'Search approved engineering projects by department, year and technology.',
};

export default async function RepositoryPage({ searchParams }: PageProps<'/projects'>) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const query = repositoryQuerySchema.parse(flat);
  const [results, filters] = await Promise.all([searchRepository(query), getRepositoryFilters()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Project repository</h1>
        <p className="text-muted-foreground">Approved projects from every department and batch. Search, filter and learn from them.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <RepositoryFilterSidebar options={filters} />
        <div className="min-w-0 space-y-5">
          <RepositorySearchBar options={filters} />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {results.total === 0 ? 'No projects found' : `${results.total} project${results.total === 1 ? '' : 's'}`}
            {query.q && <> matching “<span className="font-medium text-foreground">{query.q}</span>”</>}
          </p>

          {results.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matching projects"
              description="Try fewer words, a different technology, or clear the filters."
              action={
                <Button asChild variant="outline">
                  <Link href="/projects">Clear search</Link>
                </Button>
              }
            />
          ) : (
            <Reveal stagger replayKey={JSON.stringify(query)} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.items.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </Reveal>
          )}

          <PaginationLinks page={results.page} totalPages={results.totalPages} basePath="/projects" searchParams={flat} />
        </div>
      </div>
    </div>
  );
}
