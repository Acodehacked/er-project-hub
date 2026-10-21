import 'server-only';
import { cache } from 'react';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { academicYears, departments, technologies, users } from '@/db/schema';

/** Reference data used by forms (department/year pickers, tech tags, guide list). */

export const getDepartments = cache(() => db.query.departments.findMany({ orderBy: [asc(departments.name)] }));

export const getAcademicYears = cache(() =>
  db.query.academicYears.findMany({ orderBy: [desc(academicYears.startYear)] }),
);

export const getCurrentAcademicYear = cache(async () => {
  return (
    (await db.query.academicYears.findFirst({ where: eq(academicYears.isCurrent, true) })) ??
    (await db.query.academicYears.findFirst({ orderBy: [desc(academicYears.startYear)] }))
  );
});

export const getTechnologies = cache(() =>
  db.query.technologies.findMany({ orderBy: [asc(technologies.name)], columns: { id: true, name: true, slug: true, category: true } }),
);

/** Active faculty who can be chosen as guides. */
export const getFacultyGuides = cache(() =>
  db.query.users.findMany({
    where: and(eq(users.role, 'FACULTY'), eq(users.isActive, true)),
    columns: { id: true, name: true, username: true, departmentId: true, avatarKey: true },
    with: { department: { columns: { code: true } } },
    orderBy: [asc(users.name)],
  }),
);
