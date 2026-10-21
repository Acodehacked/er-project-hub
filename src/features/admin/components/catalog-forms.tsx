'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GitMerge, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, SelectField, TextareaField, handleActionResult } from '@/components/forms/form-fields';
import { TECH_CATEGORY_LABELS } from '@/lib/format';
import { departmentSchema, technologySchema, type DepartmentInput, type TechnologyInput } from '@/lib/validation/admin';
import { TECHNOLOGY_CATEGORIES } from '@/db/schema/enums';
import type { ActionResult } from '@/types';
import { mergeTechnologiesAction, saveDepartmentAction, saveTechnologyAction } from '@/actions/admin-actions';

/** Confirm-then-run button for destructive admin actions (server action passed as a prop). */
export function ConfirmActionButton({
  action,
  id,
  title,
  description,
  label = 'Delete',
}: {
  action: (id: string) => Promise<ActionResult<void>>;
  id: string;
  title: string;
  description: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={title} disabled={pending}><Trash2 /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => startTransition(async () => { if (handleActionResult(await action(id))) router.refresh(); })}>
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DepartmentDialog({ department }: { department?: DepartmentInput & { id: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department ?? { name: '', code: '', description: '' },
  });
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      if (handleActionResult(await saveDepartmentAction({ ...values, id: department?.id }), form)) {
        setOpen(false);
        if (!department) form.reset();
        router.refresh();
      }
    }),
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {department ? <Button variant="ghost" size="icon" aria-label={`Edit ${department.name}`}><Pencil /></Button> : <Button><Plus /> Add department</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{department ? 'Edit department' : 'New department'}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-4">
            <InputField control={form.control} name="name" label="Name" placeholder="Computer Science & Engineering" />
            <InputField control={form.control} name="code" label="Code" placeholder="CSE" className="max-w-40" />
            <TextareaField control={form.control} name="description" label="Description" rows={3} maxLength={1000} />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending && <Spinner />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TechnologyDialog({ technology }: { technology?: TechnologyInput & { id: string } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<TechnologyInput>({
    resolver: zodResolver(technologySchema),
    defaultValues: technology ?? { name: '', category: 'OTHER' },
  });
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      if (handleActionResult(await saveTechnologyAction({ ...values, id: technology?.id }), form)) {
        setOpen(false);
        if (!technology) form.reset();
        router.refresh();
      }
    }),
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {technology ? <Button variant="ghost" size="icon" aria-label={`Edit ${technology.name}`}><Pencil /></Button> : <Button><Plus /> Add technology</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{technology ? 'Edit technology' : 'New technology'}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-4">
            <InputField control={form.control} name="name" label="Name" placeholder="TensorFlow" />
            <SelectField control={form.control} name="category" label="Category" options={TECHNOLOGY_CATEGORIES.map((c) => ({ value: c, label: TECH_CATEGORY_LABELS[c] }))} />
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending && <Spinner />} Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MergeTechnologyDialog({ source, options }: { source: { id: string; name: string }; options: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Merge ${source.name}`}><GitMerge /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Merge “{source.name}” into…</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Every project tagged “{source.name}” will be tagged with the chosen technology instead, and “{source.name}” will be deleted.</p>
        <select
          className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          aria-label="Merge into"
        >
          <option value="">Choose a technology…</option>
          {options.filter((o) => o.id !== source.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={!targetId || pending}
            onClick={() => startTransition(async () => {
              if (handleActionResult(await mergeTechnologiesAction({ sourceId: source.id, targetId }))) {
                setOpen(false);
                router.refresh();
              }
            })}
          >
            {pending && <Spinner />} Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
