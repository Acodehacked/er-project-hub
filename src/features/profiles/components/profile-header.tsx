import { Code2, GraduationCap, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Reveal } from '@/components/motion/reveal';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import type { UserRole } from '@/types';

export type PublicProfile = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  graduationYear: number | null;
  bio: string | null;
  avatarKey: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  department: { code: string; name: string } | null;
};

export function ProfileHeader({ profile, stats }: { profile: PublicProfile; stats: { label: string; value: number }[] }) {
  return (
    <section className="relative overflow-hidden border-b bg-card/50">
      <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <Reveal stagger onScroll={false} className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-end sm:px-6">
        <UserAvatar user={profile} className="size-24 text-2xl ring-4 ring-background" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
            <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-mono">@{profile.username}</span>
            {profile.department && <span>{profile.department.name}</span>}
            {profile.graduationYear && <span className="flex items-center gap-1"><GraduationCap className="size-4" /> Class of {profile.graduationYear}</span>}
          </p>
          {profile.bio && <p className="max-w-2xl text-foreground/90">{profile.bio}</p>}
          <div className="flex gap-2 pt-1">
            {profile.githubUrl && (
              <Button asChild variant="outline" size="sm"><a href={profile.githubUrl} target="_blank" rel="noopener noreferrer nofollow"><Code2 /> GitHub</a></Button>
            )}
            {profile.linkedinUrl && (
              <Button asChild variant="outline" size="sm"><a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow"><Link2 /> LinkedIn</a></Button>
            )}
          </div>
        </div>
        <div className="flex gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
