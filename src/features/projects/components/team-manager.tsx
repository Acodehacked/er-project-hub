'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, GraduationCap, Info, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/shared/user-avatar';
import { handleActionResult } from '@/components/forms/form-fields';
import { MEMBER_ROLE_LABELS } from '@/lib/format';
import { PROJECT_MEMBER_ROLES } from '@/db/schema/enums';
import type { ProjectMemberRole } from '@/types';
import {
  addMemberAction,
  lookupStudentAction,
  proposeTeamRevisionAction,
  removeMemberAction,
  setGuideAction,
  updateMemberAction,
} from '@/actions/project-actions';

export type TeamMember = {
  memberId: string | null; // null for members staged in a revision
  userId: string;
  name: string;
  username: string;
  avatarKey: string | null;
  role: ProjectMemberRole;
  roleTitle: string | null;
};

type Mode = 'direct' | 'revision' | 'readonly';
const ASSIGNABLE = PROJECT_MEMBER_ROLES.filter((r) => r !== 'LEADER');
const NO_GUIDE = '__none';

export function TeamManager({
  projectId,
  mode,
  members: initial,
  guideId,
  guides,
  canChooseGuide,
}: {
  projectId: string;
  mode: Mode;
  members: TeamMember[];
  guideId: string | null;
  guides: { value: string; label: string }[];
  canChooseGuide: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [staged, setStaged] = useState<TeamMember[]>(initial);
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState<ProjectMemberRole>('DEVELOPER');
  const [roleTitle, setRoleTitle] = useState('');
  const [note, setNote] = useState('');

  const members = mode === 'revision' ? staged : initial;
  const editable = mode !== 'readonly';
  const changed = mode === 'revision' && JSON.stringify(staged) !== JSON.stringify(initial);

  const run = (fn: () => Promise<boolean | void>) => startTransition(async () => { if ((await fn()) !== false) router.refresh(); });

  const add = () =>
    run(async () => {
      if (mode === 'direct') {
        const result = await addMemberAction(projectId, { identifier, role, roleTitle });
        if (!handleActionResult(result)) return false;
      } else {
        const result = await lookupStudentAction(identifier);
        if (!handleActionResult(result)) return false;
        if (staged.some((m) => m.userId === result.data.id)) return void toast.error('Already in the team.');
        setStaged((s) => [...s, { memberId: null, userId: result.data.id, name: result.data.name, username: result.data.username, avatarKey: result.data.avatarKey, role, roleTitle: roleTitle || null }]);
      }
      setIdentifier('');
      setRoleTitle('');
    });

  const changeRole = (m: TeamMember, newRole: ProjectMemberRole) => {
    if (mode === 'revision') return setStaged((s) => s.map((x) => (x.userId === m.userId ? { ...x, role: newRole } : x)));
    run(async () => handleActionResult(await updateMemberAction(projectId, { memberId: m.memberId, role: newRole, roleTitle: m.roleTitle ?? undefined })));
  };

  const changeTitle = (m: TeamMember, title: string) => {
    if (mode === 'revision') return setStaged((s) => s.map((x) => (x.userId === m.userId ? { ...x, roleTitle: title } : x)));
    if (title === (m.roleTitle ?? '')) return;
    run(async () => handleActionResult(await updateMemberAction(projectId, { memberId: m.memberId, role: m.role, roleTitle: title })));
  };

  const remove = (m: TeamMember) => {
    if (mode === 'revision') return setStaged((s) => s.filter((x) => x.userId !== m.userId));
    run(async () => handleActionResult(await removeMemberAction(projectId, m.memberId!)));
  };

  const submitRevision = () =>
    run(async () =>
      handleActionResult(
        await proposeTeamRevisionAction(projectId, {
          members: staged.filter((m) => m.role !== 'LEADER').map((m) => ({ userId: m.userId, role: m.role, roleTitle: m.roleTitle ?? undefined })),
          note,
        }),
      ),
    );

  return (
    <div className="space-y-6">
      {mode === 'revision' && (
        <Alert className="border-info/30 bg-info/5">
          <Info className="text-info" />
          <AlertDescription>
            This project is published. Team changes are sent for review and only go live once approved — the current team stays visible until then.
          </AlertDescription>
        </Alert>
      )}
      {mode === 'readonly' && (
        <Alert>
          <Info />
          <AlertDescription>Only the team leader can change the team, and only while the project is a draft or has changes requested.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>Up to 8 members. Everyone listed can edit the project content; only the leader can submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((m) => (
            <div key={m.userId} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar user={{ id: m.userId, name: m.name, avatarKey: m.avatarKey }} className="size-9" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {m.name} {m.role === 'LEADER' && <Crown className="size-3.5 text-primary" aria-label="Leader" />}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">@{m.username}</p>
                </div>
              </div>
              {m.role === 'LEADER' || !editable ? (
                <span className="text-sm text-muted-foreground">
                  {MEMBER_ROLE_LABELS[m.role]}{m.roleTitle ? ` · ${m.roleTitle}` : ''}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <Select value={m.role} onValueChange={(v) => changeRole(m, v as ProjectMemberRole)} disabled={pending}>
                    <SelectTrigger className="w-36" aria-label={`Role of ${m.name}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{MEMBER_ROLE_LABELS[r]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    defaultValue={m.roleTitle ?? ''}
                    placeholder="Role title"
                    className="w-36"
                    maxLength={80}
                    aria-label={`Role title of ${m.name}`}
                    onBlur={(e) => changeTitle(m, e.target.value.trim())}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${m.name}`} disabled={pending}><Trash2 /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {m.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {mode === 'revision' ? 'They will be removed when the team change is approved.' : 'They will lose access to this project and be notified.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(m)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}

          {editable && members.length < 8 && (
            <div className="rounded-xl border border-dashed p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium"><UserPlus className="size-4 text-primary" /> Add a teammate</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem_9rem_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier">Email, username or register number</Label>
                  <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="CSE22014 or name@college.edu" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), identifier.trim().length >= 3 && add())} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as ProjectMemberRole)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{ASSIGNABLE.map((r) => <SelectItem key={r} value={r}>{MEMBER_ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="roleTitle">Title (optional)</Label>
                  <Input id="roleTitle" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Firmware" maxLength={80} />
                </div>
                <Button type="button" onClick={add} disabled={pending || identifier.trim().length < 3}>
                  {pending ? <Spinner /> : <UserPlus />} Add
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Teammates need an ErHub account first.</p>
            </div>
          )}

          {mode === 'revision' && changed && (
            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Label htmlFor="note">Note for reviewers (optional)</Label>
              <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Why is the team changing?" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setStaged(initial)} disabled={pending}>Discard changes</Button>
                <Button onClick={submitRevision} disabled={pending}>{pending && <Spinner />} Submit team change for review</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="size-5 text-primary" /> Faculty guide</CardTitle>
          <CardDescription>Optional. If you pick a guide, they make the final review decision for your project.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={guideId ?? NO_GUIDE}
            disabled={!canChooseGuide || pending}
            onValueChange={(v) => run(async () => handleActionResult(await setGuideAction(projectId, { guideId: v === NO_GUIDE ? null : v })))}
          >
            <SelectTrigger className="w-full sm:w-96" aria-label="Faculty guide"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_GUIDE}>No guide — any department faculty reviews</SelectItem>
              {guides.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
