import 'server-only';
import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { db } from '@/db';
import { academicYears, auditLogs, departments, projects, users } from '@/db/schema';
import type { Paginated, ProjectStatus, UserRole } from '@/types';

const PAGE_SIZE = 20;

export async function listUsers(params: { q?: string; role?: UserRole; page: number }) {
  const conditions: SQL[] = [];
  if (params.q) {
    const term = `%${params.q.replace(/[%_]/g, '')}%`;
    conditions.push(or(like(users.name, term), like(users.email, term), like(users.username, term), like(users.studentIdentifier, term))!);
  }
  if (params.role) conditions.push(eq(users.role, params.role));
  const where = conditions.length ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(users).where(where);
  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);

  const rows = await db
    .select({
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        username: users.username,
        role: users.role,
        departmentId: users.departmentId,
        studentIdentifier: users.studentIdentifier,
        graduationYear: users.graduationYear,
        bio: users.bio,
        avatarKey: users.avatarKey,
        githubUrl: users.githubUrl,
        linkedinUrl: users.linkedinUrl,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      },
      department: {
        code: departments.code,
      },
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const items = rows.map((r) => ({
    ...r.user,
    department: r.department?.code ? r.department : null,
  }));
  return { items, page, pageSize: PAGE_SIZE, total, totalPages } satisfies Paginated<(typeof items)[number]>;
}

export async function listAllProjects(params: { q?: string; status?: ProjectStatus; page: number }) {
  const conditions: SQL[] = [];
  if (params.q) conditions.push(like(projects.title, `%${params.q.replace(/[%_]/g, '')}%`));
  if (params.status) conditions.push(eq(projects.status, params.status));
  const where = conditions.length ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ value: count() }).from(projects).where(where);
  const total = totalRow?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page, totalPages);

  const leader = alias(users, 'leader');
  const rows = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      status: projects.status,
      isFeatured: projects.isFeatured,
      viewsCount: projects.viewsCount,
      updatedAt: projects.updatedAt,
      department: {
        code: departments.code,
      },
      academicYear: {
        label: academicYears.label,
      },
      leader: {
        name: leader.name,
        username: leader.username,
      },
    })
    .from(projects)
    .innerJoin(departments, eq(projects.departmentId, departments.id))
    .innerJoin(academicYears, eq(projects.academicYearId, academicYears.id))
    .innerJoin(leader, eq(projects.leaderId, leader.id))
    .where(where)
    .orderBy(desc(projects.updatedAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    isFeatured: r.isFeatured,
    viewsCount: r.viewsCount,
    updatedAt: r.updatedAt,
    department: r.department,
    academicYear: r.academicYear,
    leader: r.leader,
  }));
  return { items, page, pageSize: PAGE_SIZE, total, totalPages };
}

export async function listAuditLogs(page: number) {
  const [totalRow] = await db.select({ value: count() }).from(auditLogs);
  const total = totalRow?.value ?? 0;
  const pageSize = 30;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const rows = await db
    .select({
      log: auditLogs,
      user: {
        name: users.name,
        username: users.username,
      },
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset((current - 1) * pageSize);

  const items = rows.map((r) => ({
    ...r.log,
    user: r.user?.name ? r.user : null,
  }));
  return { items, page: current, pageSize, total, totalPages };
}
