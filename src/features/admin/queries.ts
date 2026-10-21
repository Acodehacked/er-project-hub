import 'server-only';
import { and, count, desc, eq, like, or, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { auditLogs, projects, users } from '@/db/schema';
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

  const items = await db.query.users.findMany({
    where,
    columns: { passwordHash: false },
    with: { department: { columns: { code: true } } },
    orderBy: [desc(users.createdAt)],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
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

  const items = await db.query.projects.findMany({
    where,
    columns: { id: true, title: true, slug: true, status: true, isFeatured: true, viewsCount: true, updatedAt: true },
    with: {
      department: { columns: { code: true } },
      academicYear: { columns: { label: true } },
      leader: { columns: { name: true, username: true } },
    },
    orderBy: [desc(projects.updatedAt)],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  return { items, page, pageSize: PAGE_SIZE, total, totalPages };
}

export async function listAuditLogs(page: number) {
  const [totalRow] = await db.select({ value: count() }).from(auditLogs);
  const total = totalRow?.value ?? 0;
  const pageSize = 30;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const items = await db.query.auditLogs.findMany({
    with: { user: { columns: { name: true, username: true } } },
    orderBy: [desc(auditLogs.createdAt)],
    limit: pageSize,
    offset: (current - 1) * pageSize,
  });
  return { items, page: current, pageSize, total, totalPages };
}
