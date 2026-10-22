'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, SelectField, handleActionResult } from '@/components/forms/form-fields';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { suggestUsername } from '@/lib/security/sanitization';
import { checkUsernameAction, registerAction } from '@/actions/auth-actions';

const thisYear = new Date().getFullYear();

export function RegisterForm({ departments }: { departments: { value: string; label: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [availability, setAvailability] = useState<{ ok: boolean; text: string } | null>(null);
  const usernameTouched = useRef(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      departmentId: '',
      studentIdentifier: '',
      graduationYear: String(thisYear + 1),
    },
  });

  const name = useWatch({ control: form.control, name: 'name' });
  const username = useWatch({ control: form.control, name: 'username' });
  const gradYear = useWatch({ control: form.control, name: 'graduationYear' });

  // Suggest a username from the name until the student edits it themselves.
  useEffect(() => {
    if (!usernameTouched.current && name) form.setValue('username', suggestUsername(name));
  }, [name, form]);

  // Live availability check (debounced).
  useEffect(() => {
    if (!username || username.length < 3) return setAvailability(null);
    const t = setTimeout(async () => {
      const res = await checkUsernameAction(username);
      if (res.ok) setAvailability(res.data.available ? { ok: true, text: 'Available' } : { ok: false, text: res.data.reason ?? 'Already taken' });
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await registerAction(values);
      if (handleActionResult(result, form, { quiet: true })) {
        router.replace(result.data.redirectTo);
        router.refresh();
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <InputField control={form.control} name="name" label="Full name" autoComplete="name" placeholder="Abin Antony" />
        <InputField control={form.control} name="email" label="College email" type="email" autoComplete="email" />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField control={form.control} name="departmentId" label="Department" options={departments} placeholder="Choose department" />
          <InputField control={form.control} name="studentIdentifier" label="Register / roll number" placeholder="CSE22001" />
        </div>
        <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
          <InputField
            control={form.control}
            name="username"
            label="Username"
            autoComplete="username"
            onKeyDown={() => (usernameTouched.current = true)}
            description={
              <span className="flex flex-wrap items-center gap-x-2">
                <span>
                  Your profile: <span className="font-mono">/{gradYear || 'year'}/{username || 'username'}</span>
                </span>
                {availability && (
                  <span className={availability.ok ? 'flex items-center gap-1 text-success' : 'flex items-center gap-1 text-destructive'}>
                    {availability.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />} {availability.text}
                  </span>
                )}
              </span>
            }
          />
          <InputField control={form.control} name="graduationYear" label="Graduation year" type="number" inputMode="numeric" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField control={form.control} name="password" label="Password" type="password" autoComplete="new-password" description="8+ characters with a letter and a number." />
          <InputField control={form.control} name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner />} Create account
        </Button>
      </FieldGroup>
    </form>
  );
}
