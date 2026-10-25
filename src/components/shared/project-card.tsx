import Link from 'next/link';
import { Eye, Star, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProjectCover } from './project-cover';
import { StatusBadge } from './status-badge';
import type { ProjectCardData } from '@/features/repository/queries';

/**
 * Card used in the repository grid, profiles and dashboards. Pass
 * `href` to link somewhere other than the public project page.
 */
export function ProjectCard({
  project,
  href,
  showStatus = false,
  footer,
}: {
  project: ProjectCardData;
  href?: string;
  showStatus?: boolean;
  footer?: React.ReactNode;
}) {
  const link = href ?? `/projects/${project.slug}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-tile-3/40 hover:shadow-xl hover:shadow-tile-3/10">
      <div className="relative m-1.5 mb-0 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
        <div className="size-full transition-transform duration-500 group-hover:scale-[1.04]">
          <ProjectCover imageId={project.images[0]?.id} seed={project.slug} title={project.title} />
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge className="glass text-foreground">{project.department.code}</Badge>
          {project.isFeatured && (
            <Badge className="border-0 bg-primary/90 backdrop-blur">
              <Star className="fill-current" /> Featured
            </Badge>
          )}
        </div>
        {showStatus && <StatusBadge status={project.status} className="absolute top-3 right-3 bg-background/90 backdrop-blur" />}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-2 leading-snug font-semibold">
            <Link href={link} className="after:absolute after:inset-0 focus-visible:outline-none">
              {project.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{project.abstract}</p>
        </div>
        {project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.map((t) => (
              <span key={t.technology.slug} className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-secondary-foreground">
                {t.technology.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span className="truncate">
            {project.leader.name} · {project.academicYear.label}
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-1" title="Team size">
              <Users className="size-3.5" /> {project.members.length}
            </span>
            {project.status === 'APPROVED' && (
              <span className="flex items-center gap-1" title="Views">
                <Eye className="size-3.5" /> {project.viewsCount}
              </span>
            )}
          </span>
        </div>
        {footer && <div className="relative z-10 border-t pt-3">{footer}</div>}
      </div>
    </article>
  );
}
