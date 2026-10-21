'use server';

import { and, desc, eq, inArray, like, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { projectMembers, projects, technologies, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

export type PaletteResult = {
  projects: { title: string; href: string; meta: string }[];
  technologies: { name: string; href: string }[];
  people: { name: string; href: string; meta: string }[];
};

/** Quick search for the Ctrl+K command palette. Only returns what the user may see. */
export async function paletteSearchAction(query: string): Promise<PaletteResult> {
  const q = z.string().trim().max(60).catch('').parse(query);
  const empty = { projects: [], technologies: [], people: [] };
  if (q.length < 2) return empty;

  const user = await getCurrentUser();
  if (!checkRateLimit(`palette:${user?.id ?? 'anon'}`, RATE_LIMITS.mutation).allowed) return empty;

  const term = `%${q.replace(/[%_]/g, '')}%`;
  const mine = user
    ? (await db.select({ id: projectMembers.projectId }).from(projectMembers).where(eq(projectMembers.userId, user.id))).map((r) => r.id)
    : [];

  const [projectRows, techRows, peopleRows] = await Promise.all([
    db
      .select({ id: projects.id, title: projects.title, slug: projects.slug, status: projects.status })
      .from(projects)
      .where(and(like(projects.title, term), or(eq(projects.status, 'APPROVED'), mine.length ? inArray(projects.id, mine) : undefined)))
      .orderBy(desc(projects.viewsCount))
      .limit(6),
    db.select({ name: technologies.name, slug: technologies.slug }).from(technologies).where(like(technologies.name, term)).limit(5),
    db
      .select({ name: users.name, username: users.username, role: users.role, graduationYear: users.graduationYear })
      .from(users)
      .where(and(eq(users.isActive, true), inArray(users.role, ['STUDENT', 'REPRESENTATIVE', 'FACULTY']), or(like(users.name, term), like(users.username, term))))
      .limit(5),
  ]);

  return {
    projects: projectRows.map((p) => ({
      title: p.title,
      href: p.status === 'APPROVED' ? `/projects/${p.slug}` : `/dashboard/projects/${p.id}`,
      meta: p.status === 'APPROVED' ? 'Repository' : 'My project',
    })),
    technologies: techRows.map((t) => ({ name: t.name, href: `/technologies/${t.slug}` })),
    people: peopleRows
      .map((p) => ({
        name: p.name,
        href: p.role === 'FACULTY' ? `/faculty/${p.username}` : p.graduationYear ? `/${p.graduationYear}/${p.username}` : '',
        meta: p.role === 'FACULTY' ? 'Faculty' : `Class of ${p.graduationYear}`,
      }))
      .filter((p) => p.href),
  };
}
