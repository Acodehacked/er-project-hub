'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Circle, Send, Trash2, Undo2 } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { handleActionResult } from '@/components/forms/form-fields';
import { cn } from '@/lib/utils';
import type { ChecklistItem } from '../checklist';
import { cancelRevisionAction, deleteProjectAction, submitProjectAction } from '@/actions/project-actions';

/** Readiness checklist with links to the step that fixes each item. */
export function Checklist({ projectId, items, editable }: { projectId: string; items: ChecklistItem[]; editable: boolean }) {
  const done = items.filter((i) => i.done).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Completeness</span>
        <span className="text-muted-foreground tabular-nums">{done}/{items.length}</span>
      </div>
      <Progress value={(done / items.length) * 100} />
      <ul className="space-y-1.5">
        {items.map((item) => {
          const content = (
            <>
              {item.done ? <Check className="size-4 text-success" /> : <Circle className={cn('size-4', item.required ? 'text-destructive' : 'text-muted-foreground')} />}
              <span className={cn(item.done && 'text-muted-foreground line-through decoration-muted-foreground/40')}>{item.label}</span>
              {item.required && !item.done && <span className="ml-auto text-[11px] font-medium text-destructive">Required</span>}
            </>
          );
          return (
            <li key={item.key}>
              {editable && !item.done ? (
                <Link href={`/dashboard/projects/${projectId}/edit?step=${item.step}`} className="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm hover:bg-accent">{content}</Link>
              ) : (
                <div className="flex items-center gap-2 px-1 py-0.5 text-sm">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubmitButton({ projectId, ready, resubmit }: { projectId: string; ready: boolean; resubmit: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full" size="lg" disabled={!ready || pending}>
          {pending ? <Spinner /> : <Send />} {resubmit ? 'Resubmit for review' : 'Submit for review'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit this project for review?</AlertDialogTitle>
          <AlertDialogDescription>
            The project will be locked while a student representative screens it and faculty review it. You will be notified of every decision.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                if (handleActionResult(await submitProjectAction(projectId))) router.refresh();
              })
            }
          >
            Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DeleteProjectButton({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={pending}>
          <Trash2 /> Delete draft
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes the draft, its team list and all uploaded files. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() =>
              startTransition(async () => {
                const result = await deleteProjectAction(projectId);
                if (handleActionResult(result)) router.push(result.data.redirectTo);
              })
            }
          >
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CancelRevisionButton({ revisionId }: { revisionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => { if (handleActionResult(await cancelRevisionAction(revisionId))) router.refresh(); })}
    >
      {pending ? <Spinner /> : <Undo2 />} Withdraw revision
    </Button>
  );
}
