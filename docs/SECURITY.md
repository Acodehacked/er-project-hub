# Security

| Threat | Defence | Where |
| --- | --- | --- |
| **Broken access control / IDOR** | Every action reloads the project and runs a policy check for *this* user and *this* project; unauthorised pages return 404 | `features/projects/policy.ts`, `guards.ts` |
| **Unauthorised approval** | Department and guide rules in the policy; team members can never review their own project; optimistic locking on status changes | `policy.ts`, `workflow.ts` |
| **SQL injection** | Drizzle sends every value as a bound parameter; FULLTEXT search terms are also stripped of operator characters | all queries, `repository/queries.ts` |
| **XSS** | React escapes everything it renders; we never use `dangerouslySetInnerHTML`; external links use `rel="noopener noreferrer nofollow"` | components |
| **CSRF** | Server Actions only accept same-origin POSTs (Next.js checks the Origin header); Auth.js uses a CSRF token; cookies are `SameSite=Lax` | framework |
| **Weak passwords / credential stuffing** | bcrypt (cost 12), password rules, rate limiting per IP and per email, constant-time response for unknown emails | `auth.ts`, `password.ts`, `rate-limit.ts` |
| **Session theft** | Encrypted HttpOnly cookie; user re-checked in the DB on every request, so deactivation is instant | `auth.ts`, `session.ts` |
| **Malicious uploads** | Allow-list of types (JPG, PNG, WebP, PDF, DOCX, PPTX); extension must match the MIME type; 25 MB cap; **magic-byte check** of the real content after upload; the server generates storage keys | `validation/files.ts`, `files/service.ts` |
| **File access leaks** | Private bucket; every download goes through `/api/files/[id]`, which checks the policy and issues a 5-minute signed URL | `api/files/[id]/route.ts` |
| **Open redirects** | Login `callbackUrl` must be a same-site path | `auth-actions.ts` |
| **Leaking internals** | `runAction` returns friendly messages; unexpected errors are logged on the server only; env vars are validated and never exposed to the client | `lib/action.ts`, `lib/env.ts` |
| **Clickjacking, sniffing** | CSP, `X-Frame-Options: DENY`, `nosniff`, strict referrer and permissions policies | `next.config.ts` |
| **Accountability** | Audit log for registrations, role changes, password resets, deletions, uploads and live edits | `lib/security/audit.ts` |

## Known limits (accepted for now)

- The rate limiter is in memory, which suits a single server. Use Redis if ErHub ever runs on several instances.
- Email verification and email password reset are deferred until email delivery exists.
- The dev `.env` and Docker credentials are local-only. Production secrets must be generated separately.
