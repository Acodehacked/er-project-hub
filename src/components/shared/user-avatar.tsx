import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { avatarUrl, initials } from '@/lib/format';
import { cn } from '@/lib/utils';

type AvatarUser = { id: string; name: string; avatarKey: string | null };

export function UserAvatar({ user, className }: { user: AvatarUser; className?: string }) {
  const src = avatarUrl(user);
  return (
    <Avatar className={cn('size-8', className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Overlapping avatars for a team. */
export function AvatarStack({ users, max = 4 }: { users: AvatarUser[]; max?: number }) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((u) => (
        <UserAvatar key={u.id} user={u} className="size-7 ring-2 ring-background" />
      ))}
      {rest > 0 && (
        <span className="grid size-7 place-items-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background">+{rest}</span>
      )}
    </div>
  );
}
