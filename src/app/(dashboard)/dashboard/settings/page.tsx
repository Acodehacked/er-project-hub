import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { requireUser } from '@/lib/auth/guards';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { profileHref } from '@/lib/format';
import { isStorageConfigured } from '@/lib/storage';
import { getAccount } from '@/features/account/service';
import { AvatarUploader, PasswordForm, ProfileForm } from '@/features/account/components/settings-forms';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const account = await getAccount(user.id);
  if (!account) notFound();
  const publicHref = profileHref(account);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Settings"
        description="Your public profile and account security."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
        actions={publicHref && <Button asChild variant="outline"><Link href={publicHref}><ExternalLink /> View public profile</Link></Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>These details are managed by the administrator.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ['Email', account.email],
              ['Username', `@${account.username}`],
              ['Role', ROLE_LABELS[account.role]],
              ['Department', account.department?.name ?? '—'],
              ...(account.studentIdentifier ? [['Register number', account.studentIdentifier]] : []),
              ...(account.graduationYear ? [['Graduation year', String(account.graduationYear)]] : []),
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>Shown on {publicHref ? <span className="font-mono">{publicHref}</span> : 'your projects'}. Your email is never shown publicly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUploader user={{ id: account.id, name: account.name, avatarKey: account.avatarKey }} storageReady={isStorageConfigured} />
          <ProfileForm defaults={{ name: account.name, bio: account.bio ?? '', githubUrl: account.githubUrl ?? '', linkedinUrl: account.linkedinUrl ?? '' }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Use at least 8 characters with a letter and a number.</CardDescription>
        </CardHeader>
        <CardContent><PasswordForm /></CardContent>
      </Card>
    </div>
  );
}
