import type { DefaultSession } from 'next-auth';
import type { UserRole } from '@/db/schema/enums';

// Teach TypeScript about the extra fields we put on the Auth.js session/JWT.
declare module 'next-auth' {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    uid?: string;
    role?: UserRole;
  }
}
