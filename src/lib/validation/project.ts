import { z } from 'zod';
import { PROJECT_MEMBER_ROLES, PROJECT_STATUSES } from '@/db/schema/enums';
import { idSchema, optionalUrl, pageSchema } from './common';

const title = z.string().trim().min(5, 'Title must be at least 5 characters').max(200);
const abstract = z
  .string()
  .trim()
  .min(50, 'Write at least 50 characters so reviewers understand the project')
  .max(3000, 'Keep the abstract under 3000 characters');
const description = z.string().trim().max(20_000, 'Description is too long').optional();

/** Step 1 of the project wizard — also used to create the draft. */
export const projectBasicsSchema = z.object({
  title,
  abstract,
  description,
  departmentId: idSchema,
  academicYearId: idSchema,
});
export type ProjectBasicsInput = z.infer<typeof projectBasicsSchema>;

/** "Light" fields — editable live even after approval. */
export const projectLinksSchema = z.object({
  githubUrl: optionalUrl,
  demoUrl: optionalUrl,
});
export type ProjectLinksInput = z.infer<typeof projectLinksSchema>;

export const projectTechnologiesSchema = z.object({
  technologyIds: z.array(idSchema).max(20, 'Pick at most 20 technologies'),
  /** New technology names typed by the student that do not exist yet. */
  newTechnologies: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
});
export type ProjectTechnologiesInput = z.input<typeof projectTechnologiesSchema>;

export const projectGuideSchema = z.object({
  guideId: idSchema.nullable(),
});

export const memberRoleSchema = z.enum(PROJECT_MEMBER_ROLES).exclude(['LEADER']);

export const addMemberSchema = z.object({
  /** Email, username or register number of an existing ErHub user. */
  identifier: z.string().trim().min(3, 'Enter an email, username or register number').max(255),
  role: memberRoleSchema,
  roleTitle: z.string().trim().max(80).optional(),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  memberId: idSchema,
  role: memberRoleSchema,
  roleTitle: z.string().trim().max(80).optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

/** A proposed "major edit" to an approved project. */
export const revisionSchema = z
  .object({
    title: title.optional(),
    abstract: abstract.optional(),
    description,
    departmentId: idSchema.optional(),
    academicYearId: idSchema.optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine(
    (d) => d.title || d.abstract || d.description !== undefined || d.departmentId || d.academicYearId,
    'Change at least one field',
  );
export type RevisionInput = z.infer<typeof revisionSchema>;

/** Public repository search — parsed from URL search params. */
export const repositoryQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  department: z.string().trim().max(20).optional().catch(undefined),
  year: z.string().trim().max(20).optional().catch(undefined),
  tech: z.string().trim().max(90).optional().catch(undefined),
  featured: z
    .enum(['1'])
    .optional()
    .catch(undefined),
  sort: z.enum(['newest', 'views', 'title', 'relevance']).optional().catch(undefined),
  page: pageSchema,
});
export type RepositoryQuery = z.infer<typeof repositoryQuerySchema>;

export const adminProjectQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(PROJECT_STATUSES).optional().catch(undefined),
  page: pageSchema,
});
