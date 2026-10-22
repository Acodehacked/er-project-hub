import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { loginSchema } from '@/lib/validation/auth';
import { verifyPassword, DUMMY_HASH } from '@/lib/auth/password';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import type { UserRole } from '@/types';

class RateLimitedSignin extends CredentialsSignin {
  code = 'rate_limited';
}

/**
 * Auth.js (NextAuth v5) configuration.
 *
 * - Credentials provider: email + password checked against our `users` table.
 * - JWT session strategy: the session lives in an encrypted, HttpOnly cookie.
 *   The token only carries the user id and role. Server code ALWAYS reloads
 *   the user from MySQL (see `getCurrentUser`), so deactivation and role
 *   changes take effect on the very next request.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
        const byIp = checkRateLimit(`login:ip:${ip}`, RATE_LIMITS.login);
        const byEmail = checkRateLimit(`login:email:${email}`, RATE_LIMITS.login);
        if (!byIp.allowed || !byEmail.allowed) throw new RateLimitedSignin();

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        // Always run bcrypt so response time does not reveal whether the email exists.
        const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid || !user.isActive) return null;

        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
