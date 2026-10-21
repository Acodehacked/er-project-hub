import 'server-only';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { academicYears, approvals, departments, projectTechnologies, projects, technologies, users } from '@/db/schema';
import { PROJECT_STATUSES } from '@/db/schema/enums';

/** Aggregates for the admin analytics page. Each query is a single GROUP BY. */

export async function getStatusBreakdown() {
  const rows = await db.select({ status: projects.status, value: count() }).from(projects).groupBy(projects.status);
  const map = new Map(rows.map((r) => [r.status, r.value]));
  return PROJECT_STATUSES.map((status) => ({ status, value: map.get(status) ?? 0 }));
}

export function getProjectsByDepartment() {
  return db
    .select({ code: departments.code, name: departments.name, total: count(projects.id), approved: sql<number>`sum(${projects.status} = 'APPROVED')`.mapWith(Number) })
    .from(departments)
    .leftJoin(projects, eq(projects.departmentId, departments.id))
    .groupBy(departments.id, departments.code, departments.name)
    .orderBy(desc(count(projects.id)));
}

export function getProjectsByYear() {
  return db
    .select({ label: academicYears.label, total: count(projects.id), approved: sql<number>`sum(${projects.status} = 'APPROVED')`.mapWith(Number) })
    .from(academicYears)
    .leftJoin(projects, eq(projects.academicYearId, academicYears.id))
    .groupBy(academicYears.id, academicYears.label, academicYears.startYear)
    .orderBy(academicYears.startYear);
}

export function getTopTechnologies(limit = 10) {
  return db
    .select({ name: technologies.name, value: count(projectTechnologies.projectId) })
    .from(projectTechnologies)
    .innerJoin(technologies, eq(technologies.id, projectTechnologies.technologyId))
    .innerJoin(projects, and(eq(projects.id, projectTechnologies.projectId), eq(projects.status, 'APPROVED')))
    .groupBy(technologies.id, technologies.name)
    .orderBy(desc(count(projectTechnologies.projectId)))
    .limit(limit);
}

/** Approvals and rejections per month for the last 12 months. */
export async function getDecisionsOverTime() {
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);
  const month = sql<string>`date_format(${approvals.createdAt}, '%Y-%m')`;
  const rows = await db
    .select({
      month,
      approved: sql<number>`sum(${approvals.action} = 'APPROVE')`.mapWith(Number),
      rejected: sql<number>`sum(${approvals.action} = 'REJECT')`.mapWith(Number),
      submitted: sql<number>`sum(${approvals.action} = 'SUBMIT')`.mapWith(Number),
    })
    .from(approvals)
    .where(gte(approvals.createdAt, since))
    .groupBy(month)
    .orderBy(month);

  // Fill months with no activity so the chart has a continuous axis.
  const byMonth = new Map(rows.map((r) => [r.month, r]));
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const r = byMonth.get(key);
    return {
      month: d.toLocaleString('en', { month: 'short' }),
      approved: r?.approved ?? 0,
      rejected: r?.rejected ?? 0,
      submitted: r?.submitted ?? 0,
    };
  });
}

export function getMostViewed(limit = 8) {
  return db
    .select({ title: projects.title, slug: projects.slug, viewsCount: projects.viewsCount })
    .from(projects)
    .where(eq(projects.status, 'APPROVED'))
    .orderBy(desc(projects.viewsCount))
    .limit(limit);
}

export async function getSystemTotals() {
  const [[userTotal], [projectTotal], [pending], roleRows] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(projects),
    db.select({ value: count() }).from(projects).where(sql`${projects.status} in ('SUBMITTED', 'UNDER_REVIEW')`),
    db.select({ role: users.role, value: count() }).from(users).groupBy(users.role),
  ]);
  return {
    users: userTotal?.value ?? 0,
    projects: projectTotal?.value ?? 0,
    pendingReviews: pending?.value ?? 0,
    byRole: Object.fromEntries(roleRows.map((r) => [r.role, r.value])) as Record<string, number>,
  };
}
