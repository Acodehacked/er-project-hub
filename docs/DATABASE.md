# Database

MySQL 8.4 accessed through **Drizzle ORM**. The schema lives in [src/db/schema](../src/db/schema), one file per table. Every enum value (roles, statuses and so on) is defined once, in [enums.ts](../src/db/schema/enums.ts).

## ER diagram

```mermaid
erDiagram
  DEPARTMENT ||--o{ USER : "belongs to"
  DEPARTMENT ||--o{ PROJECT : owns
  ACADEMIC_YEAR ||--o{ PROJECT : "submitted in"
  USER ||--o{ PROJECT : "leads (leader_id)"
  USER ||--o{ PROJECT : "guides (guide_id)"
  PROJECT ||--|{ PROJECT_MEMBER : has
  USER ||--o{ PROJECT_MEMBER : "is"
  PROJECT ||--o{ PROJECT_TECHNOLOGY : tagged
  TECHNOLOGY ||--o{ PROJECT_TECHNOLOGY : tags
  PROJECT ||--o{ PROJECT_IMAGE : has
  PROJECT ||--o{ PROJECT_DOCUMENT : has
  PROJECT ||--o{ PROJECT_REVISION : "proposed changes"
  PROJECT ||--o{ APPROVAL : "timeline"
  PROJECT_REVISION ||--o{ APPROVAL : "timeline"
  USER ||--o{ APPROVAL : "acts"
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ AUDIT_LOG : "performs"

  USER { uuid id PK; string email UK; string username UK; enum role; uuid department_id FK; string student_identifier UK; int graduation_year }
  PROJECT { uuid id PK; string slug UK; enum status; uuid leader_id FK; uuid guide_id FK; uuid department_id FK; uuid academic_year_id FK }
  PROJECT_MEMBER { uuid id PK; uuid project_id FK; uuid user_id FK; enum role }
  PROJECT_REVISION { uuid id PK; uuid project_id FK; enum status; json changes }
  APPROVAL { uuid id PK; uuid project_id FK; uuid revision_id FK; enum action; string from_status; string to_status }
```

## Tables

| Table | Purpose | Key constraints |
| --- | --- | --- |
| `users` | Everyone who can sign in | unique email, username, register number; role enum; index on role, department, graduation year |
| `departments` | CSE, ECE, … | unique name and code |
| `academic_years` | "2026-27" | unique label and start year; one marked current |
| `projects` | The project itself | unique slug; status enum; FKs to leader, guide, department, year; **FULLTEXT(title, abstract)** for search |
| `project_members` | Who is on the team, with role | unique (project, user); cascade delete with project |
| `technologies` / `project_technologies` | Tech tags (many-to-many) | composite primary key prevents duplicate tags |
| `project_images` / `project_documents` | File **metadata** only; files live in R2 | unique storage key; size, MIME type, uploader |
| `project_revisions` | Proposed "major edits" to approved projects | JSON `changes`, its own status |
| `approvals` | Immutable history of every workflow step | indexed by (project, created_at) |
| `notifications` | In-app notifications | indexed by (user, is_read, created_at) |
| `audit_logs` | Security trail of sensitive actions | indexed by created_at and target |

### Design decisions

- **UUID primary keys** (`varchar(36)`). URLs like `/dashboard/projects/2a7b…` cannot be guessed or counted the way `/projects/1, 2, 3` can.
- **`ON DELETE` behaviour** is chosen per relation: deleting a project cascades to its members, files, revisions and approvals; deleting a department that still has projects is **restricted**; deleting a guide **sets null**.
- **Statuses are MySQL enums** built from the same TypeScript tuples the app uses, so the database rejects invalid values too.
- **Optimistic locking**: workflow updates use `WHERE status = <expected>`, so two reviewers clicking at the same moment cannot both win.
- **No binary data in MySQL.** It stores keys and metadata; R2 stores the bytes.

## Drizzle concepts in this project

| Concept | Where | What it does |
| --- | --- | --- |
| Table schema | `src/db/schema/*.ts` | `mysqlTable(...)` defines columns, defaults, indexes and foreign keys. |
| Type inference | `typeof users.$inferSelect` | Row types come from the schema, so there's no duplicate interface to keep in sync. |
| Relations | `src/db/relations.ts` | Teaches Drizzle how tables join, for `db.query.projects.findMany({ with: { members: true } })`. |
| Query builder | services/queries | `db.select().from(projects).where(eq(projects.status, 'APPROVED'))` is SQL you can read. |
| Transactions | `db.transaction(async (tx) => …)` | Status change and history row are saved together, or not at all. |
| Migrations | `src/db/migrations` | Versioned SQL files generated from the schema. |

## Migrations

1. Edit a file in `src/db/schema/`.
2. `npm run db:generate -- --name short_description` writes a new SQL file to `src/db/migrations/`. **Read it.**
3. `npm run db:migrate` applies it.
4. Commit the schema change **and** the migration together.

Never edit a migration that has already been applied on someone else's machine; add a new one instead. `0001_fulltext_search.sql` is a hand-written migration, because Drizzle cannot declare FULLTEXT indexes for MySQL.

## Dev database

`docker-compose.yml` runs MySQL 8.4 with a named volume (`erhub_mysql84_data`), so data survives restarts. `docker compose down -v` wipes it. `npm run db:reset` rebuilds it from scratch. The Docker credentials are for local development only.
