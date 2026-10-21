'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Send } from 'lucide-react';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, SelectField, TextareaField, handleActionResult } from '@/components/forms/form-fields';
import { projectBasicsSchema } from '@/lib/validation/project';
import { proposeRevisionAction } from '@/actions/project-actions';

const formSchema = projectBasicsSchema.extend({ note: z.string().trim().max(1000).optional() });
type FormValues = z.infer<typeof formSchema>;
type Option = { value: string; label: string };

/**
 * "Major edit" form for APPROVED projects. Only fields that actually changed
 * are sent; the live version stays public until the revision is approved.
 */
export function RevisionForm({
  projectId,
  current,
  departments,
  years,
  disabledReason,
}: {
  projectId: string;
  current: Omit<FormValues, 'note'>;
  departments: Option[];
  years: Option[];
  disabledReason?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { ...current, note: '' } });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const changes: Record<string, unknown> = { note: values.note };
      (['title', 'abstract', 'departmentId', 'academicYearId'] as const).forEach((k) => {
        if (values[k] !== current[k]) changes[k] = values[k];
      });
      if ((values.description ?? '') !== (current.description ?? '')) changes.description = values.description ?? '';
      if (Object.keys(changes).length === 1) {
        handleActionResult({ ok: false, error: 'Change at least one field first.' });
        return;
      }
      if (handleActionResult(await proposeRevisionAction(projectId, changes), form)) router.push(`/dashboard/projects/${projectId}`);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Alert className="border-info/30 bg-info/5">
        <Info className="text-info" />
        <AlertDescription>
          Your project is published. Changes to these fields go through the same review as a new submission. The current version stays visible until your revision is approved.
        </AlertDescription>
      </Alert>
      {disabledReason && (
        <Alert>
          <Info />
          <AlertDescription>{disabledReason}</AlertDescription>
        </Alert>
      )}
      <fieldset disabled={!!disabledReason || pending} className="space-y-6">
        <FieldGroup className="gap-6">
          <InputField control={form.control} name="title" label="Project title" maxLength={200} />
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField control={form.control} name="departmentId" label="Department" options={departments} />
            <SelectField control={form.control} name="academicYearId" label="Academic year" options={years} />
          </div>
          <TextareaField control={form.control} name="abstract" label="Abstract" rows={6} maxLength={3000} />
          <TextareaField control={form.control} name="description" label="Detailed description" rows={10} maxLength={20000} />
          <TextareaField control={form.control} name="note" label="Note for reviewers (optional)" rows={3} maxLength={1000} placeholder="What changed and why?" />
        </FieldGroup>
        <div className="flex justify-end">
          <Button type="submit">{pending ? <Spinner /> : <Send />} Submit revision for review</Button>
        </div>
      </fieldset>
    </form>
  );
}
