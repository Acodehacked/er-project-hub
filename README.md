# ErHub — Engineering Project Repository & Innovation Management System

ErHub is the engineering department's home for student projects. Students submit projects with their team, files and links; a **student representative** screens each submission, **faculty** (or the team's chosen guide) make the final decision, and approved projects are published in a searchable public **repository**.

| Area | What it does |
| --- | --- |
| Public site | Landing page, project repository with search and filters, project pages, technologies, student profiles (`/2026/abinantony`) and faculty profiles (`/faculty/meeranair`) |
| Students | Step-by-step project editor with autosave, team and roles, faculty guide, images and documents, submit for review, revisions after approval |
| Representatives | Everything students can do, plus screening of their department's submissions |
| Faculty | Final review (guided projects first), a list of teams they guide |
| Admin | Users and roles, departments, academic years, technologies (with merging), every project, analytics, audit log |

## Tech stack

Next.js 16 (App Router) · React 19.2 · TypeScript · Tailwind CSS v4 · shadcn/ui · GSAP · MySQL 8.4 · Drizzle ORM · Auth.js v5 · Zod 4 · React Hook Form · Cloudflare R2.

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explains why each one was chosen.

## Run it locally

You need **Node.js 22 or newer**, **npm** and **Docker Desktop**.

```bash
npm install                 # 1. install dependencies
cp .env.example .env        # 2. create your env file (it already points at the Docker database)
npm run db:up               # 3. start MySQL 8.4 in Docker
npm run db:migrate          # 4. create the tables
npm run db:seed             # 5. load demo data
npm run dev                 # 6. open http://localhost:3000
```

Set `AUTH_SECRET` in `.env` to a random string of 32 or more characters. Generate one with `npx auth secret`.

### Demo accounts

Every demo account uses the password **`Erhub@2026`**.

| Role | Email |
| --- | --- |
| Admin | admin@erhub.dev |
| Faculty (CSE) | meera@erhub.dev |
| Faculty (CSE, guides a project under review) | rahul@erhub.dev |
| Student representative (CSE) | sneha@erhub.dev |
| Student (CSE) | abinantony@erhub.dev |
| Student (ECE, has a rejected project) | annathomas@erhub.dev |

### File uploads

Uploads go to Cloudflare R2. Without R2 keys the app still runs, and the upload screens show an "Uploads unavailable" notice. [docs/R2_SETUP.md](docs/R2_SETUP.md) explains how to turn uploads on.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and start |
| `npm run typecheck` | Check TypeScript types |
| `npm run db:up` / `db:down` | Start or stop the dev MySQL container |
| `npm run db:generate` | Create a migration after changing `src/db/schema` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Replace all data with demo data (dev only) |
| `npm run db:reset` | Drop all tables, then migrate and seed |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): folder structure, request flow, technology choices
- [DATABASE.md](docs/DATABASE.md): ER diagram, tables, migrations
- [AUTHENTICATION.md](docs/AUTHENTICATION.md): sign-in, sessions, roles and permissions
- [SECURITY.md](docs/SECURITY.md): threats we defend against and how
- [CONTRIBUTING.md](docs/CONTRIBUTING.md): conventions and Git workflow for the team
- [R2_SETUP.md](docs/R2_SETUP.md): Cloudflare R2 bucket, keys and CORS
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): not started yet (planned)
- [MASTER.md](MASTER.md): the original project brief
