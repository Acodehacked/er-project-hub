import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { TECH_CATEGORY_LABELS } from '@/lib/format';
import { TECHNOLOGY_CATEGORIES } from '@/db/schema/enums';
import { getTechnologyUsage } from '@/features/repository/queries';

export const metadata: Metadata = { title: 'Technologies', description: 'Explore projects by the technologies they use.' };

export default async function TechnologiesPage() {
  const techs = await getTechnologyUsage();
  const max = Math.max(1, ...techs.map((t) => t.projectCount));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-10 max-w-2xl space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Technologies</h1>
        <p className="text-muted-foreground">See what the department builds with. Pick a technology to find every approved project that uses it.</p>
      </div>
      <div className="space-y-10">
        {TECHNOLOGY_CATEGORIES.map((category) => {
          const list = techs.filter((t) => t.category === category);
          if (list.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{TECH_CATEGORY_LABELS[category]}</h2>
              <Reveal stagger={0.03} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((t) => (
                  <Link key={t.id} href={`/technologies/${t.slug}`} className="group rounded-xl border bg-card p-4 transition-colors hover:border-tile-3/50">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono font-semibold group-hover:text-accent-foreground">{t.name}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{t.projectCount}</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary/70 transition-all group-hover:bg-primary" style={{ width: `${(t.projectCount / max) * 100}%` }} />
                    </div>
                  </Link>
                ))}
              </Reveal>
            </section>
          );
        })}
      </div>
    </div>
  );
}
