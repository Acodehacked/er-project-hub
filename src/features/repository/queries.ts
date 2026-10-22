import 'server-only';
import { cache } from 'react';
import { and, asc, count, countDistinct, desc, eq, exists, inArray, like, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import {
  academicYears,
  departments,
  projectImages,
  projectMembers,
  projectTechnologies,
  projects,
  technologies,
  users,
} from '@/db/schema';
import type { RepositoryQuery } from '@/lib/validation/project';
import type { Paginated } from '@/types';
import { publicUserColumns } from '@/features/projects/queries';

export const REPOSITORY_PAGE_SIZE = 12;

/**
 * Turns user text into a safe MySQL BOOLEAN MODE query: every word is
 * required and prefix-matched ("smart irri" -> "+smart* +irri*").
 * Operator characters are stripped so users cannot inject syntax.
 * (Values are still sent as bound parameters — this is about FULLTEXT syntax.)
 */
function toBooleanQuery(q: string): string | null {
  const words = q
    .replace(/[+\-<>()~*"@]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .slice(0, 8);
  return words.length ? words.map((w) => `+${w}*`).join(' ') : null;
}

/** Card-sized data for a list of project ids, preserving the given order. */
export async function getProjectCards(ids: string[]) {
  if (ids.length === 0) return [];
  const leader = alias(users, 'leader');

  const rows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      title: projects.title,
      abstract: projects.abstract,
      status: projects.status,
      viewsCount: projects.viewsCount,
      isFeatured: projects.isFeatured,
      approvedAt: projects.approvedAt,
      updatedAt: projects.updatedAt,
      department: {
        code: departments.code,
        name: departments.name,
      },
      academicYear: {
        label: academicYears.label,
      },
      leader: {
        id: leader.id,
        name: leader.name,
        username: leader.username,
        role: leader.role,
        graduationYear: leader.graduationYear,
        avatarKey: leader.avatarKey,
      },
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .innerJoin(academicYears, eq(projects.academicYearId, academicYears.id))
    .innerJoin(leader, eq(projects.leaderId, leader.id))
    .where(inArray(projects.id, ids));

  const [imagesRows, techRows, membersRows] = await Promise.all([
    db
      .select({ id: projectImages.id, projectId: projectImages.projectId })
      .from(projectImages)
      .where(and(inArray(projectImages.projectId, ids), eq(projectImages.isCover, true))),
    db
      .select({
        projectId: projectTechnologies.projectId,
        technology: {
          name: technologies.name,
          slug: technologies.slug,
        },
      })
      .from(projectTechnologies)
      .innerJoin(technologies, eq(projectTechnologies.technologyId, technologies.id))
      .where(inArray(projectTechnologies.projectId, ids)),
    db
      .select({ id: projectMembers.id, projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(inArray(projectMembers.projectId, ids)),
  ]);

  const imagesByProject = new Map<string, { id: string }[]>();
  for (const img of imagesRows) {
    const list = imagesByProject.get(img.projectId) ?? [];
    if (list.length === 0) {
      list.push({ id: img.id });
      imagesByProject.set(img.projectId, list);
    }
  }

  const techsByProject = new Map<string, { technology: { name: string; slug: string } }[]>();
  for (const t of techRows) {
    const list = techsByProject.get(t.projectId) ?? [];
    if (list.length < 4) {
      list.push({ technology: t.technology });
      techsByProject.set(t.projectId, list);
    }
  }

  const membersByProject = new Map<string, { id: string }[]>();
  for (const m of membersRows) {
    const list = membersByProject.get(m.projectId) ?? [];
    list.push({ id: m.id });
    membersByProject.set(m.projectId, list);
  }

  const assembled = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    abstract: r.abstract,
    status: r.status,
    viewsCount: r.viewsCount,
    isFeatured: r.isFeatured,
    approvedAt: r.approvedAt,
    updatedAt: r.updatedAt,
    department: r.department,
    academicYear: r.academicYear,
    leader: r.leader,
    images: imagesByProject.get(r.id) ?? [],
    technologies: techsByProject.get(r.id) ?? [],
    members: membersByProject.get(r.id) ?? [],
  }));

  const byId = new Map(assembled.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => !!r);
}

export type ProjectCardData = Awaited<ReturnType<typeof getProjectCards>>[number];

export async function searchRepository(query: RepositoryQuery): Promise<Paginated<ProjectCardData>> {
  const conditions: SQL[] = [eq(projects.status, 'APPROVED')];
  const booleanQuery = query.q ? toBooleanQuery(query.q) : null;
  const match = booleanQuery
    ? sql`MATCH(${projects.title}, ${projects.abstract}) AGAINST (${booleanQuery} IN BOOLEAN MODE)`
    : null;

  if (query.q) {
    // FULLTEXT for relevance, plus LIKE on the title so very short words still match.
    conditions.push(or(...(match ? [match] : []), like(projects.title, `%${query.q.replace(/[%_]/g, '')}%`))!);
  }
  if (query.department) {
    conditions.push(
      exists(
        db.select({ one: sql`1` }).from(departments).where(and(eq(departments.id, projects.departmentId), eq(departments.code, query.department))),
      ),
    );
  }
  if (query.year) {
    conditions.push(
      exists(
        db.select({ one: sql`1` }).from(academicYears).where(and(eq(academicYears.id, projects.academicYearId), eq(academicYears.label, query.year))),
      ),
    );
  }
  if (query.tech) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(projectTechnologies)
          .innerJoin(technologies, eq(technologies.id, projectTechnologies.technologyId))
          .where(and(eq(projectTechnologies.projectId, projects.id), eq(technologies.slug, query.tech))),
      ),
    );
  }
  if (query.featured) conditions.push(eq(projects.isFeatured, true));

  const where = and(...conditions);
  const sort = query.sort ?? (query.q ? 'relevance' : 'newest');
  const orderBy =
    sort === 'views'
      ? [desc(projects.viewsCount)]
      : sort === 'title'
        ? [asc(projects.title)]
        : sort === 'relevance' && match
          ? [desc(match), desc(projects.approvedAt)]
          : [desc(projects.approvedAt)];

  const pageSize = REPOSITORY_PAGE_SIZE;
  const [totalRow] = await db.select({ value: count() }).from(projects).where(where);
  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page, totalPages);

  const idRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(where)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { items: await getProjectCards(idRows.map((r) => r.id)), page, pageSize, total, totalPages };
}

/** Filter options for the repository sidebar. */
export const getRepositoryFilters = cache(async () => {
  const [depts, years, techs] = await Promise.all([
    db.select({ code: departments.code, name: departments.name }).from(departments).orderBy(asc(departments.name)),
    db.select({ label: academicYears.label }).from(academicYears).orderBy(desc(academicYears.startYear)),
    getTechnologyUsage(30),
  ]);
  return { departments: depts, years, technologies: techs };
});

/** Technologies with the number of APPROVED projects using them. */
export async function getTechnologyUsage(limit?: number) {
  const usage = db
    .select({
      id: technologies.id,
      name: technologies.name,
      slug: technologies.slug,
      category: technologies.category,
      projectCount: sql<number>`count(${projects.id})`.mapWith(Number),
    })
    .from(technologies)
    .leftJoin(projectTechnologies, eq(projectTechnologies.technologyId, technologies.id))
    .leftJoin(projects, and(eq(projects.id, projectTechnologies.projectId), eq(projects.status, 'APPROVED')))
    .groupBy(technologies.id, technologies.name, technologies.slug, technologies.category)
    .orderBy(desc(sql`count(${projects.id})`), asc(technologies.name));
  return limit ? usage.limit(limit) : usage;
}

export async function getTechnologyBySlug(slug: string) {
  const [row] = await db.select().from(technologies).where(eq(technologies.slug, slug)).limit(1);
  return row;
}

export async function getFeaturedProjects(limit = 6) {
  let rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.status, 'APPROVED'), eq(projects.isFeatured, true)))
    .orderBy(desc(projects.approvedAt))
    .limit(limit);
  if (rows.length < 3) {
    rows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.status, 'APPROVED'))
      .orderBy(desc(projects.isFeatured), desc(projects.viewsCount))
      .limit(limit);
  }
  return getProjectCards(rows.map((r) => r.id));
}

export async function getPublicStats() {
  const [[approved], [depts], [techs], [students]] = await Promise.all([
    db.select({ value: count() }).from(projects).where(eq(projects.status, 'APPROVED')),
    db.select({ value: count() }).from(departments),
    db.select({ value: count() }).from(technologies),
    db
      .select({ value: countDistinct(projectMembers.userId) })
      .from(projectMembers)
      .innerJoin(projects, and(eq(projects.id, projectMembers.projectId), eq(projects.status, 'APPROVED'))),
  ]);
  return {
    projects: approved?.value ?? 0,
    departments: depts?.value ?? 0,
    technologies: techs?.value ?? 0,
    contributors: students?.value ?? 0,
  };
}

/** Increment views — called at most once per visitor per project per day (cookie-guarded). */
export async function incrementViews(projectId: string) {
  await db
    .update(projects)
    .set({ viewsCount: sql`${projects.viewsCount} + 1` })
    .where(and(eq(projects.id, projectId), eq(projects.status, 'APPROVED')));
}
