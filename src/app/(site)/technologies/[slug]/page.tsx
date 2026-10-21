import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FolderSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks } from '@/components/shared/pagination-links';
import { ProjectCard } from '@/components/shared/project-card';
import { Reveal } from '@/components/motion/reveal';
import { TECH_CATEGORY_LABELS } from '@/lib/format';
import { pageSchema } from '@/lib/validation/common';
import { getTechnologyBySlug, searchRepository } from '@/features/repository/queries';

export async function generateMetadata({ params }: PageProps<'/technologies/[slug]'>): Promise<Metadata> {
  const tech = await getTechnologyBySlug((await params).slug);
  return { title: tech ? `${tech.name} projects` : 'Technology' };
}

export default async function TechnologyPage({ params, searchParams }: PageProps<'/technologies/[slug]'>) {
  const { slug } = await params;
  const tech = await getTechnologyBySlug(slug);
  if (!tech) notFound();
  const page = pageSchema.parse((await searchParams).page);
  const results = await searchRepository({ tech: slug, page, sort: 'newest' });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title={<span className="font-mono">{tech.name}</span>}
        description={`${TECH_CATEGORY_LABELS[tech.category]} · ${results.total} approved project${results.total === 1 ? '' : 's'}`}
        breadcrumbs={[{ label: 'Technologies', href: '/technologies' }, { label: tech.name }]}
        actions={<Button asChild variant="outline"><Link href={`/projects?tech=${slug}`}>Filter in repository</Link></Button>}
      />
      {results.items.length === 0 ? (
        <EmptyState icon={FolderSearch} title="No approved projects yet" description={`Be the first to publish a project built with ${tech.name}.`} />
      ) : (
        <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.items.map((p) => <ProjectCard key={p.id} project={p} />)}
        </Reveal>
      )}
      <PaginationLinks page={results.page} totalPages={results.totalPages} basePath={`/technologies/${slug}`} searchParams={{}} />
    </div>
  );
}
