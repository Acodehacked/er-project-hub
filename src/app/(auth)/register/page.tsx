import type { Metadata } from 'next';
import Link from 'next/link';
import { getDepartments } from '@/features/catalog/queries';
import { env } from '@/lib/env';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Create account' };

export default async function RegisterPage() {
  const departments = await getDepartments();
  return (
    <div className="w-full max-w-lg space-y-6 py-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Create your student account</h1>
        <p className="text-sm text-muted-foreground">
          Faculty and representative accounts are set up by the administrator.
          {env.ALLOWED_EMAIL_DOMAIN && <> Use your <span className="font-medium text-foreground">@{env.ALLOWED_EMAIL_DOMAIN}</span> email.</>}
        </p>
      </div>
      <RegisterForm departments={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
