/**
 * Drizzle "relations" describe how tables connect so we can use the
 * relational query API, e.g.:
 *
 *   db.query.projects.findFirst({ with: { members: { with: { user: true } } } })
 *
 * They do NOT create database constraints — the `.references()` calls in the
 * schema files do that. Relations only teach Drizzle how to JOIN.
 */
import { relations } from 'drizzle-orm';
import { users } from './schema/users';
import { departments } from './schema/departments';
import { academicYears } from './schema/academic-years';
import { projects } from './schema/projects';
import { projectMembers } from './schema/project-members';
import { technologies } from './schema/technologies';
import { projectTechnologies } from './schema/project-technologies';
import { projectDocuments } from './schema/documents';
import { projectImages } from './schema/images';
import { projectRevisions } from './schema/revisions';
import { approvals } from './schema/approvals';
import { notifications } from './schema/notifications';
import { auditLogs } from './schema/audit-logs';

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  // Two relations point from projects to users, so each needs a relationName.
  ledProjects: many(projects, { relationName: 'project_leader' }),
  guidedProjects: many(projects, { relationName: 'project_guide' }),
  memberships: many(projectMembers),
  notifications: many(notifications),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
  projects: many(projects),
}));

export const academicYearsRelations = relations(academicYears, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  leader: one(users, {
    fields: [projects.leaderId],
    references: [users.id],
    relationName: 'project_leader',
  }),
  guide: one(users, {
    fields: [projects.guideId],
    references: [users.id],
    relationName: 'project_guide',
  }),
  department: one(departments, { fields: [projects.departmentId], references: [departments.id] }),
  academicYear: one(academicYears, { fields: [projects.academicYearId], references: [academicYears.id] }),
  members: many(projectMembers),
  technologies: many(projectTechnologies),
  documents: many(projectDocuments),
  images: many(projectImages),
  revisions: many(projectRevisions),
  approvals: many(approvals),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const technologiesRelations = relations(technologies, ({ many }) => ({
  projects: many(projectTechnologies),
}));

export const projectTechnologiesRelations = relations(projectTechnologies, ({ one }) => ({
  project: one(projects, { fields: [projectTechnologies.projectId], references: [projects.id] }),
  technology: one(technologies, {
    fields: [projectTechnologies.technologyId],
    references: [technologies.id],
  }),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({ one }) => ({
  project: one(projects, { fields: [projectDocuments.projectId], references: [projects.id] }),
  uploadedBy: one(users, { fields: [projectDocuments.uploadedById], references: [users.id] }),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, { fields: [projectImages.projectId], references: [projects.id] }),
  uploadedBy: one(users, { fields: [projectImages.uploadedById], references: [users.id] }),
}));

export const projectRevisionsRelations = relations(projectRevisions, ({ one, many }) => ({
  project: one(projects, { fields: [projectRevisions.projectId], references: [projects.id] }),
  proposedBy: one(users, { fields: [projectRevisions.proposedById], references: [users.id] }),
  approvals: many(approvals),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  project: one(projects, { fields: [approvals.projectId], references: [projects.id] }),
  revision: one(projectRevisions, { fields: [approvals.revisionId], references: [projectRevisions.id] }),
  actor: one(users, { fields: [approvals.actorId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
