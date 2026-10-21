'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, TextareaField, handleActionResult } from '@/components/forms/form-fields';
import { UserAvatar } from '@/components/shared/user-avatar';
import { profileSchema, type ProfileInput } from '@/lib/validation/admin';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validation/auth';
import { acceptAttributeFor, validateFileMeta } from '@/lib/validation/files';
import { changePasswordAction, updateProfileAction } from '@/actions/account-actions';
import { confirmUploadAction, requestUploadAction } from '@/actions/file-actions';

export function ProfileForm({ defaults }: { defaults: ProfileInput }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults });
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      if (handleActionResult(await updateProfileAction(values), form)) router.refresh();
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <InputField control={form.control} name="name" label="Display name" />
        <TextareaField control={form.control} name="bio" label="Bio" rows={3} maxLength={600} placeholder="Interests, skills, what you’re building…" />
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField control={form.control} name="githubUrl" label="GitHub" placeholder="https://github.com/you" />
          <InputField control={form.control} name="linkedinUrl" label="LinkedIn" placeholder="https://linkedin.com/in/you" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>{pending && <Spinner />} Save profile</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export function PasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      if (handleActionResult(await changePasswordAction(values), form)) form.reset();
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <InputField control={form.control} name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField control={form.control} name="newPassword" label="New password" type="password" autoComplete="new-password" />
          <InputField control={form.control} name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>{pending && <Spinner />} Change password</Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export function AvatarUploader({ user, storageReady }: { user: { id: string; name: string; avatarKey: string | null }; storageReady: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    const problem = validateFileMeta('avatar', { fileName: file.name, mimeType: file.type, size: file.size });
    if (problem) return handleActionResult({ ok: false, error: problem });
    setBusy(true);
    try {
      const ticket = await requestUploadAction({ kind: 'avatar', fileName: file.name, mimeType: file.type, size: file.size });
      if (!handleActionResult(ticket)) return;
      const res = await fetch(ticket.data.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!res.ok) return handleActionResult({ ok: false, error: 'Upload failed. Check the R2 CORS settings.' });
      handleActionResult(await confirmUploadAction({ kind: 'avatar', key: ticket.data.key, fileName: file.name }));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar user={user} className="size-16 text-lg" />
      <div className="space-y-1">
        <input ref={input} type="file" hidden accept={acceptAttributeFor('avatar')} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
        <Button type="button" variant="outline" size="sm" disabled={!storageReady || busy} onClick={() => input.current?.click()}>
          {busy ? <Spinner /> : <Camera />} Change photo
        </Button>
        <p className="text-xs text-muted-foreground">{storageReady ? 'JPG, PNG or WebP, up to 2 MB.' : 'Photo uploads need R2 storage to be configured.'}</p>
      </div>
    </div>
  );
}
