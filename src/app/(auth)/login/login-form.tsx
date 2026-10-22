'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, handleActionResult } from '@/components/forms/form-fields';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { loginAction } from '@/actions/auth-actions';

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await loginAction(values, callbackUrl);
      if (handleActionResult(result, form, { quiet: true })) {
        router.replace(result.data.redirectTo);
        router.refresh();
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <InputField control={form.control} name="email" label="Email" type="email" autoComplete="email" placeholder="you@college.edu" autoFocus />
        <InputField control={form.control} name="password" label="Password" type="password" autoComplete="current-password" />
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending && <Spinner />} Sign in
        </Button>
      </FieldGroup>
    </form>
  );
}
