'use client';

import { Controller, type Control, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/types';

/**
 * Thin wrappers that connect React Hook Form to shadcn/ui fields, so every
 * form shows labels, help text and validation errors the same way.
 */

type BaseProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: React.ReactNode;
  className?: string;
};

export function InputField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  ...inputProps
}: BaseProps<T> & Omit<React.ComponentProps<typeof Input>, 'name'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input id={name} aria-invalid={fieldState.invalid} {...inputProps} {...field} value={field.value ?? ''} />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  maxLength,
  ...props
}: BaseProps<T> & Omit<React.ComponentProps<typeof Textarea>, 'name'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <div className="flex items-baseline justify-between">
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {maxLength && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {String(field.value ?? '').length}/{maxLength}
              </span>
            )}
          </div>
          <Textarea id={name} aria-invalid={fieldState.invalid} maxLength={maxLength} {...props} {...field} value={field.value ?? ''} />
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  placeholder,
  options,
}: BaseProps<T> & { placeholder?: string; options: { value: string; label: string }[] }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="w-full" onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder ?? 'Select…'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

/**
 * Shows the result of a Server Action: success toast, or error toast plus
 * per-field errors returned by server-side Zod validation.
 * Returns true when the action succeeded.
 */
export function handleActionResult<T extends FieldValues, R>(
  result: ActionResult<R>,
  form?: UseFormReturn<T>,
  opts: { quiet?: boolean } = {},
): result is { ok: true; data: R; message?: string } {
  if (result.ok) {
    if (result.message && !opts.quiet) toast.success(result.message);
    return true;
  }
  if (form && result.fieldErrors) {
    for (const [field, messages] of Object.entries(result.fieldErrors)) {
      if (messages?.[0]) form.setError(field as FieldPath<T>, { type: 'server', message: messages[0] });
    }
  }
  toast.error(result.error);
  return false;
}
