# Deployment

> **Status: not started yet.** Deployment was deliberately left out of the v2 build. This page records the plan so nothing is forgotten.

## Planned target

```
College domain → Next.js (Node 22, `npm run build && npm start`) → MySQL 8.4 → Cloudflare R2
```

## Checklist for later

- [ ] Production MySQL on a **persistent** volume or a managed database, never inside the app container. Daily backups with `mysqldump`, tested restores.
- [ ] Generate a fresh `AUTH_SECRET` and set `APP_URL` to the real domain.
- [ ] Production R2 bucket, with CORS limited to the real domain.
- [ ] Run `npm run db:migrate` on deploy. Never run `db:seed` or `db:reset` in production; both refuse when `NODE_ENV=production`.
- [ ] Update the existing `Dockerfile` (it predates v2) to a multi-stage Node 22 build with `output: 'standalone'`.
- [ ] HTTPS via a reverse proxy (Caddy or Nginx), which also forwards `X-Forwarded-For` for rate limiting and audit IPs.
- [ ] If running more than one instance, move rate limiting to Redis.
- [ ] Implement the email channel (`src/features/notifications/email.ts`) and email password reset.
