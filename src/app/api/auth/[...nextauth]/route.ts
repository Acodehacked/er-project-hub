// Auth.js endpoints (/api/auth/session, /api/auth/signout, CSRF token, ...).
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
