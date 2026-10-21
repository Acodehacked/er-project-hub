import Link from 'next/link';
import { CalendarDays, Code2, Download, ExternalLink, Eye, FileText, GraduationCap, Lock, Presentation, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectCover } from '@/components/shared/project-cover';
import { StatusBadge } from '@/components/shared/status-badge';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Reveal } from '@/components/motion/reveal';
import {
  DOCUMENT_KIND_LABELS,
  MEMBER_ROLE_LABELS,
  documentUrl,
  formatDate,
  formatFileSize,
  profileHref,
} from '@/lib/format';
import type { ProjectDetail } from '../queries';
import { ImageGallery } from './image-gallery';

const DOC_ICONS = { REPORT: ScrollText, PRESENTATION: Presentation, PAPER: FileText, OTHER: FileText } as const;

/**
 * The full project presentation, shared by the public project page and the
 * reviewer's page so reviewers see exactly what will be published.
 */
export function ProjectDetailView({
  project,
  canDownload,
  aside,
}: {
  project: ProjectDetail;
  canDownload: boolean;
  /** Extra cards for the sidebar (timeline, review panel, …). */
  aside?: React.ReactNode;
}) {
  const cover = project.images.find((i) => i.isCover) ?? project.images[0];
  const others = project.images;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-8">
        <Reveal stagger onScroll={false} className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">{project.department.code}</Badge>
            <Badge variant="outline">{project.academicYear.label}</Badge>
            {project.status !== 'APPROVED' && <StatusBadge status={project.status} />}
            {project.isFeatured && <Badge>Featured</Badge>}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{project.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {project.approvedAt ? `Published ${formatDate(project.approvedAt)}` : `Created ${formatDate(project.createdAt)}`}</span>
            {project.status === 'APPROVED' && <span className="flex items-center gap-1.5"><Eye className="size-4" /> {project.viewsCount} views</span>}
            <span>{project.department.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.githubUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer nofollow"><Code2 /> Source code</a>
              </Button>
            )}
            {project.demoUrl && (
              <Button asChild size="sm">
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer nofollow"><ExternalLink /> Live demo</a>
              </Button>
            )}
          </div>
        </Reveal>

        <div className="overflow-hidden rounded-2xl border bg-muted aspect-[16/8]">
          <ProjectCover imageId={cover?.id} seed={project.slug} title={project.title} />
        </div>
        {others.length > 1 && <ImageGallery images={others} title={project.title} />}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Abstract</h2>
          <p className="leading-relaxed whitespace-pre-line text-foreground/90">{project.abstract}</p>
        </section>

        {project.description && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Details</h2>
            <div className="leading-relaxed whitespace-pre-line text-foreground/90">{project.description}</div>
          </section>
        )}

        {project.technologies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Technologies</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map(({ technology }) => (
                <Link key={technology.id} href={`/technologies/${technology.slug}`} className="rounded-lg border bg-card px-3 py-1.5 font-mono text-sm transition-colors hover:border-primary/50 hover:text-primary">
                  {technology.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Documents</h2>
          {project.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents attached.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {project.documents.map((doc) => {
                const Icon = DOC_ICONS[doc.kind];
                return (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">{DOCUMENT_KIND_LABELS[doc.kind]} · {formatFileSize(doc.fileSize)}</p>
                    </div>
                    {canDownload ? (
                      <Button asChild size="icon" variant="ghost" aria-label={`Download ${doc.fileName}`}>
                        <a href={documentUrl(doc.id)}><Download /></a>
                      </Button>
                    ) : (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/login?callbackUrl=/projects/${project.slug}`}><Lock /> Sign in</Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Team</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {project.members.map((m) => {
              const href = profileHref(m.user);
              const body = (
                <>
                  <UserAvatar user={m.user} className="size-9" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {MEMBER_ROLE_LABELS[m.role]}{m.roleTitle ? ` · ${m.roleTitle}` : ''}
                    </p>
                  </div>
                </>
              );
              return href ? (
                <Link key={m.id} href={href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-accent">{body}</Link>
              ) : (
                <div key={m.id} className="flex items-center gap-3">{body}</div>
              );
            })}
          </CardContent>
        </Card>
        {project.guide && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="size-4 text-primary" /> Faculty guide</CardTitle></CardHeader>
            <CardContent>
              <Link href={`/faculty/${project.guide.username}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-accent">
                <UserAvatar user={project.guide} className="size-9" />
                <span className="text-sm font-medium">{project.guide.name}</span>
              </Link>
            </CardContent>
          </Card>
        )}
        {aside}
      </aside>
    </div>
  );
}
