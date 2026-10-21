'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { InputField, handleActionResult } from '@/components/forms/form-fields';
import { TECH_CATEGORY_LABELS } from '@/lib/format';
import { projectLinksSchema, type ProjectLinksInput } from '@/lib/validation/project';
import type { TechnologyCategory } from '@/types';
import { setTechnologiesAction, updateLinksAction } from '@/actions/project-actions';

type Tech = { id: string; name: string; category: TechnologyCategory };

export function TechAndLinks({
  projectId,
  allTechnologies,
  selectedIds,
  links,
  readOnly,
  live,
}: {
  projectId: string;
  allTechnologies: Tech[];
  selectedIds: string[];
  links: ProjectLinksInput;
  readOnly: boolean;
  /** True for approved projects: changes go live immediately. */
  live: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(selectedIds);
  const [newNames, setNewNames] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const form = useForm<ProjectLinksInput>({ resolver: zodResolver(projectLinksSchema), defaultValues: { githubUrl: links.githubUrl ?? '', demoUrl: links.demoUrl ?? '' } });

  const byId = useMemo(() => new Map(allTechnologies.map((t) => [t.id, t])), [allTechnologies]);
  const grouped = useMemo(() => {
    const g = new Map<TechnologyCategory, Tech[]>();
    for (const t of allTechnologies) g.set(t.category, [...(g.get(t.category) ?? []), t]);
    return [...g.entries()];
  }, [allTechnologies]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 20 ? s : [...s, id]));
  const exactMatch = allTechnologies.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const save = () =>
    startTransition(async () => {
      const values = form.getValues();
      const parsed = projectLinksSchema.safeParse(values);
      if (!parsed.success) {
        await form.trigger();
        return;
      }
      const [techResult, linkResult] = await Promise.all([
        setTechnologiesAction(projectId, { technologyIds: selected, newTechnologies: newNames }),
        updateLinksAction(projectId, parsed.data),
      ]);
      const ok = handleActionResult(techResult, undefined, { quiet: true }) && handleActionResult(linkResult, form, { quiet: true });
      if (ok) {
        setNewNames([]);
        router.refresh();
        if (!live) router.push(`/dashboard/projects/${projectId}/edit?step=files`);
        else handleActionResult({ ok: true, data: undefined, message: 'Changes are live' });
      }
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Technologies</CardTitle>
          <CardDescription>Pick everything your project uses — it helps others discover it. At least one is required to submit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex min-h-10 flex-wrap gap-2 rounded-lg border bg-muted/40 p-2">
            {selected.length === 0 && newNames.length === 0 && <span className="px-1 py-1 text-sm text-muted-foreground">Nothing selected yet</span>}
            {selected.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1 py-1 pr-1 font-mono">
                {byId.get(id)?.name}
                {!readOnly && <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${byId.get(id)?.name}`} className="rounded-full p-0.5 hover:bg-foreground/10"><X className="size-3" /></button>}
              </Badge>
            ))}
            {newNames.map((n) => (
              <Badge key={n} className="gap-1 py-1 pr-1 font-mono">
                {n} (new)
                <button type="button" onClick={() => setNewNames((s) => s.filter((x) => x !== n))} aria-label={`Remove ${n}`} className="rounded-full p-0.5 hover:bg-white/20"><X className="size-3" /></button>
              </Badge>
            ))}
          </div>
          {!readOnly && (
            <Command className="rounded-lg border">
              <CommandInput placeholder="Search technologies…" value={search} onValueChange={setSearch} />
              <CommandList className="max-h-64">
                <CommandEmpty>
                  {search.trim() && !exactMatch ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNewNames((s) => [...new Set([...s, search.trim()])].slice(0, 10));
                        setSearch('');
                      }}
                    >
                      <Plus /> Add “{search.trim()}” as a new technology
                    </Button>
                  ) : (
                    'No technologies found.'
                  )}
                </CommandEmpty>
                {grouped.map(([category, techs]) => (
                  <CommandGroup key={category} heading={TECH_CATEGORY_LABELS[category]}>
                    {techs.map((t) => (
                      <CommandItem key={t.id} value={t.name} onSelect={() => toggle(t.id)}>
                        <Check className={selected.includes(t.id) ? 'opacity-100 text-primary' : 'opacity-0'} />
                        {t.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>Optional. Link your source code repository and a live demo or video.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <InputField control={form.control} name="githubUrl" label="Source code URL" placeholder="https://github.com/team/project" disabled={readOnly} />
            <InputField control={form.control} name="demoUrl" label="Demo or video URL" placeholder="https://…" disabled={readOnly} />
          </FieldGroup>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending && <Spinner />} {live ? 'Save changes' : <>Save & continue <ArrowRight /></>}
          </Button>
        </div>
      )}
    </div>
  );
}
