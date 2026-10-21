# Contributing

## Getting set up

Follow the README's **Run it locally** steps, then sign in with a demo account for the role you're working on.

## Where does my code go?

| I want to… | Put it in |
| --- | --- |
| Add a page / URL | `src/app/...` (keep it thin: load data, render components) |
| Change data (create, update, delete) | A function in `src/features/<feature>/service.ts`, exposed through a Server Action in `src/actions/` |
| Read data for a page | `src/features/<feature>/queries.ts` |
| Decide who may do something to a project | `src/features/projects/policy.ts` |
| Validate input | A Zod schema in `src/lib/validation/` |
| A reusable UI piece | `src/components/shared/`, or `src/features/<feature>/components/` if it's feature-specific |
| A new table or column | `src/db/schema/` + `npm run db:generate` (see DATABASE.md) |

## Rules of thumb

1. **Never trust the browser.** Every Server Action calls a guard, parses input with Zod, and checks the policy.
2. **One source of truth.** Import enums and types from `@/types` or `@/db/schema/enums`; never redefine `'APPROVED' | ...`.
3. **No business logic in components.** Components display data and call actions.
4. **Server-only code** (`@/db`, services, `@/lib/env`) must never be imported into a `'use client'` file.
5. **Return `runAction(...)`** from actions, so every result has the same `{ ok, data | error }` shape.
6. Use theme tokens (`bg-primary`, `text-muted-foreground`), not hard-coded colours, so light and dark mode both work.
7. Animations go through `components/motion/*` so reduced motion is respected.

## Naming

- Files: `kebab-case.ts(x)`. Components: `PascalCase`. Functions and variables: `camelCase`.
- Server Actions end in `Action` (`submitProjectAction`).
- Database columns are `snake_case` in SQL and `camelCase` in TypeScript (Drizzle maps them).

## Git workflow

- Keep commits small and meaningful: `feat: add revision diff view`, `fix: lock project during review`.
- Run `npm run typecheck` and `npm run build` before pushing.
- When the team grows, protect `main` and use feature branches with pull requests reviewed by the team leader (Member 1).

## Before you open a PR or push

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] Tried the change while signed in as each affected role
- [ ] New schema changes have a migration committed with them
