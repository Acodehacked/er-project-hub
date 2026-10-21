import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Next.js 16 "proxy" (formerly middleware) — runs before every matched request.
 *
 * It does an *optimistic* check only: is there a valid session cookie, and
 * does its role look right for /admin? This gives fast redirects, but real
 * authorization still happens server-side in pages/actions via the guards in
 * `src/lib/auth/guards.ts` (the cookie role could be stale).
 */
export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/admin') && session.user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
