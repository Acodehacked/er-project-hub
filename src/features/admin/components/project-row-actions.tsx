'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Eye, MoreHorizontal, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { handleActionResult } from '@/components/forms/form-fields';
import type { ProjectStatus } from '@/types';
import { archiveProjectAction, setFeaturedAction, unarchiveProjectAction } from '@/actions/admin-actions';

export function ProjectRowActions({ project }: { project: { id: string; slug: string; status: ProjectStatus; isFeatured: boolean } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<Parameters<typeof handleActionResult>[0]>) =>
    startTransition(async () => { if (handleActionResult(await fn())) router.refresh(); });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending} aria-label="Project actions"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={project.status === 'APPROVED' ? `/projects/${project.slug}` : `/dashboard/projects/${project.id}`}><Eye /> Open</Link>
        </DropdownMenuItem>
        {project.status === 'APPROVED' && (
          <DropdownMenuItem onSelect={() => run(() => setFeaturedAction(project.id, !project.isFeatured))}>
            {project.isFeatured ? <><StarOff /> Remove from featured</> : <><Star /> Feature on home page</>}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {project.status === 'ARCHIVED' ? (
          <DropdownMenuItem onSelect={() => run(() => unarchiveProjectAction(project.id))}><ArchiveRestore /> Restore</DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onSelect={() => run(() => archiveProjectAction(project.id))}><Archive /> Archive</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
