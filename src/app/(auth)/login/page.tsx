import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in with your college email to continue.</p>
      </div>
      <LoginForm callbackUrl={typeof callbackUrl === 'string' ? callbackUrl : undefined} />
      <p className="text-center text-sm text-muted-foreground">
        New to ErHub?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">Create a student account</Link>
      </p>
    </div>
  );
}
