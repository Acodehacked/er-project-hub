import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { academicYears, departments, technologies, users } from '@/db/schema';

/** Reference data used by forms (department/year pickers, tech tags, guide list). */

export const getDepartments = cache(() => db.select().from(departments).orderBy(asc(departments.name)));

export const getAcademicYears = cache(() =>
  db.select().from(academicYears).orderBy(desc(academicYears.startYear)),
);

export const getCurrentAcademicYear = cache(async () => {
  const [current] = await db.select().from(academicYears).where(eq(academicYears.isCurrent, true)).limit(1);
  if (current) return current;
  const [latest] = await db.select().from(academicYears).orderBy(desc(academicYears.startYear)).limit(1);
  return latest;
});

export const getTechnologies = cache(() =>
  db
    .select({ id: technologies.id, name: technologies.name, slug: technologies.slug, category: technologies.category })
    .from(technologies)
    .orderBy(asc(technologies.name)),
);

/** Active faculty who can be chosen as guides. */
export const getFacultyGuides = cache(async () => {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      departmentId: users.departmentId,
      avatarKey: users.avatarKey,
      department: {
        code: departments.code,
      },
    })
    .from(users)
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(and(eq(users.role, 'FACULTY'), eq(users.isActive, true)))
    .orderBy(asc(users.name));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    username: r.username,
    departmentId: r.departmentId,
    avatarKey: r.avatarKey,
    department: r.department.code ? r.department : null,
  }));
});
