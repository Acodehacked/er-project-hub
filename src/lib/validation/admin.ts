import { z } from 'zod';
import { TECHNOLOGY_CATEGORIES, USER_ROLES } from '@/db/schema/enums';
import { idSchema, optionalUrl, pageSchema } from './common';
import { passwordSchema } from './auth';

export const departmentSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(2).max(150),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Letters, numbers and hyphens only'),
  description: z.string().trim().max(1000).optional(),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const academicYearSchema = z.object({
  id: idSchema.optional(),
  startYear: z.coerce.number<string | number>().int().min(2000).max(2100),
});
export type AcademicYearInput = z.input<typeof academicYearSchema>;

export const technologySchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1).max(80),
  category: z.enum(TECHNOLOGY_CATEGORIES),
});
export type TechnologyInput = z.infer<typeof technologySchema>;

export const mergeTechnologiesSchema = z
  .object({ sourceId: idSchema, targetId: idSchema })
  .refine((d) => d.sourceId !== d.targetId, { path: ['targetId'], message: 'Pick a different technology' });

export const updateUserSchema = z.object({
  userId: idSchema,
  role: z.enum(USER_ROLES),
  departmentId: idSchema.nullable(),
  isActive: z.boolean(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  userId: idSchema,
  newPassword: passwordSchema,
});

export const userQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  role: z.enum(USER_ROLES).optional().catch(undefined),
  page: pageSchema,
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(600).optional(),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
});
export type ProfileInput = z.infer<typeof profileSchema>;
