'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { handleActionResult } from '@/components/forms/form-fields';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { USER_ROLES } from '@/db/schema/enums';
import type { UserRole } from '@/types';
import { resetPasswordAction, updateUserAction } from '@/actions/admin-actions';

const NO_DEPT = '__none';

export function EditUserDialog({
  user,
  departments,
}: {
  user: { id: string; name: string; role: UserRole; departmentId: string | null; isActive: boolean };
  departments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(user.role);
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? NO_DEPT);
  const [isActive, setIsActive] = useState(user.isActive);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await updateUserAction({ userId: user.id, role, departmentId: departmentId === NO_DEPT ? null : departmentId, isActive });
      if (handleActionResult(result)) {
        setOpen(false);
        router.refresh();
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${user.name}`}><Pencil /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {user.name}</DialogTitle>
          <DialogDescription>Role changes take effect on the user’s next request. The user is notified.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{USER_ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DEPT}>No department</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Representatives and faculty review projects of their department.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="active">Account active</Label>
              <p className="text-xs text-muted-foreground">Inactive users are signed out and cannot sign in.</p>
            </div>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={pending}>{pending && <Spinner />} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ user }: { user: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [pending, startTransition] = useTransition();

  const generate = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    setPassword(`${Array.from(bytes, (b) => chars[b % chars.length]).join('')}7`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) generate(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Reset password for ${user.name}`}><KeyRound /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {user.name}</DialogTitle>
          <DialogDescription>Share the new password with the user in person or through an official channel. They can change it in Settings.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" aria-label="New password" />
          <Button variant="outline" onClick={generate}>Generate</Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={pending}
            onClick={() => startTransition(async () => { if (handleActionResult(await resetPasswordAction({ userId: user.id, newPassword: password }))) setOpen(false); })}
          >
            {pending && <Spinner />} Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
