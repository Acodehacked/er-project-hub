'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { handleActionResult } from '@/components/forms/form-fields';
import { createAcademicYearAction, setCurrentAcademicYearAction } from '@/actions/admin-actions';

export function AddAcademicYear({ suggested }: { suggested: number }) {
  const router = useRouter();
  const [year, setYear] = useState(String(suggested));
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => { if (handleActionResult(await createAcademicYearAction({ startYear: year }))) router.refresh(); });
      }}
    >
      <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-28" aria-label="Starting year" min={2000} max={2100} />
      <Button type="submit" disabled={pending}>{pending ? <Spinner /> : <Plus />} Add {year}-{String((Number(year) + 1) % 100).padStart(2, '0')}</Button>
    </form>
  );
}

export function MakeCurrentButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => { if (handleActionResult(await setCurrentAcademicYearAction(id))) router.refresh(); })}>
      {pending ? <Spinner /> : <CheckCircle2 />} Make current
    </Button>
  );
}
