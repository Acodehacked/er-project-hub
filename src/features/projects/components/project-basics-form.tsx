'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, SelectField, TextareaField, handleActionResult } from '@/components/forms/form-fields';
import { projectBasicsSchema, type ProjectBasicsInput } from '@/lib/validation/project';
import { createDraftAction, updateBasicsAction } from '@/actions/project-actions';

type Option = { value: string; label: string };

/**
 * Step 1 of the project wizard.
 *  - Create mode: "Save draft & continue" creates the project.
 *  - Edit mode: changes autosave a moment after you stop typing.
 */
export function ProjectBasicsForm({
  projectId,
  defaults,
  departments,
  years,
}: {
  projectId?: string;
  defaults: ProjectBasicsInput;
  departments: Option[];
  years: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const form = useForm<ProjectBasicsInput>({ resolver: zodResolver(projectBasicsSchema), defaultValues: defaults, mode: 'onChange' });
  const values = useWatch({ control: form.control });
  const firstRender = useRef(true);

  // Autosave (edit mode only): wait 1.2s after the last change, save if valid.
  useEffect(() => {
    if (!projectId) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(async () => {
      const parsed = projectBasicsSchema.safeParse(form.getValues());
      if (!parsed.success) return;
      setSaveState('saving');
      const result = await updateBasicsAction(projectId, parsed.data);
      setSaveState(result.ok ? 'saved' : 'idle');
      if (!result.ok) handleActionResult(result, form);
    }, 1200);
    return () => clearTimeout(t);
  }, [JSON.stringify(values), projectId]);

  const onSubmit = form.handleSubmit((data) =>
    startTransition(async () => {
      if (projectId) {
        const result = await updateBasicsAction(projectId, data);
        if (handleActionResult(result, form, { quiet: true })) router.push(`/dashboard/projects/${projectId}/edit?step=team`);
        return;
      }
      const result = await createDraftAction(data);
      if (handleActionResult(result, form)) router.push(`/dashboard/projects/${result.data.id}/edit?step=team`);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup className="gap-6">
        <InputField control={form.control} name="title" label="Project title" placeholder="e.g. Smart Campus Attendance with Face Recognition" maxLength={200} />
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField control={form.control} name="departmentId" label="Department" options={departments} />
          <SelectField control={form.control} name="academicYearId" label="Academic year" options={years} />
        </div>
        <TextareaField
          control={form.control}
          name="abstract"
          label="Abstract"
          rows={6}
          maxLength={3000}
          placeholder="What problem does your project solve, how does it work, and what did you achieve?"
          description="Shown on project cards and search results. 50–3000 characters."
        />
        <TextareaField
          control={form.control}
          name="description"
          label="Detailed description (optional)"
          rows={10}
          maxLength={20000}
          placeholder="Architecture, methodology, results, future scope…"
        />
      </FieldGroup>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
        <span className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          {projectId && saveState === 'saving' && <><Spinner /> Saving…</>}
          {projectId && saveState === 'saved' && <><CheckCircle2 className="size-4 text-success" /> All changes saved</>}
          {projectId && saveState === 'idle' && <><CloudUpload className="size-4" /> Changes save automatically</>}
        </span>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />} {projectId ? 'Continue to team' : 'Save draft & continue'} <ArrowRight />
        </Button>
      </div>
    </form>
  );
}
