'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type RepositoryFilterOptions = {
  departments: { code: string; name: string }[];
  years: { label: string }[];
  technologies: { slug: string; name: string; projectCount: number }[];
};

const ALL = '__all';
const FILTER_KEYS = ['department', 'year', 'tech', 'featured'] as const;

/**
 * Every filter lives in the URL (?q=&department=&tech=…), so results are
 * shareable, bookmarkable and work with the browser's back button.
 */
function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v && v !== ALL) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return { params, update, pending, activeCount: FILTER_KEYS.filter((k) => params.get(k)).length };
}

function FilterPanel({ options }: { options: RepositoryFilterOptions }) {
  const { params, update, activeCount } = useUrlFilters();
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Department</Label>
        <Select value={params.get('department') ?? ALL} onValueChange={(v) => update({ department: v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All departments</SelectItem>
            {options.departments.map((d) => (
              <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Academic year</Label>
        <Select value={params.get('year') ?? ALL} onValueChange={(v) => update({ year: v })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All years</SelectItem>
            {options.years.map((y) => (
              <SelectItem key={y.label} value={y.label}>{y.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <Label htmlFor="featured-only" className="flex items-center gap-2">
          <Star className="size-4 text-primary" /> Featured only
        </Label>
        <Switch id="featured-only" checked={params.get('featured') === '1'} onCheckedChange={(c) => update({ featured: c ? '1' : null })} />
      </div>
      <div className="space-y-2">
        <Label>Technology</Label>
        <div className="flex flex-wrap gap-1.5">
          {options.technologies
            .filter((t) => t.projectCount > 0)
            .map((t) => {
              const on = params.get('tech') === t.slug;
              return (
                <button
                  key={t.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ tech: on ? null : t.slug })}
                  className={cn(
                    'rounded-md border px-2 py-1 font-mono text-xs transition-colors',
                    on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-tile-3/50 hover:text-accent-foreground',
                  )}
                >
                  {t.name} <span className="opacity-60">{t.projectCount}</span>
                </button>
              );
            })}
        </div>
      </div>
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => update({ department: null, year: null, tech: null, featured: null })}>
          <X /> Clear filters
        </Button>
      )}
    </div>
  );
}

/** Desktop sidebar version of the filters. */
export function RepositoryFilterSidebar({ options }: { options: RepositoryFilterOptions }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24">
        <FilterPanel options={options} />
      </div>
    </aside>
  );
}

/** Search box, sort menu and (on small screens) a button opening the filters. */
export function RepositorySearchBar({ options }: { options: RepositoryFilterOptions }) {
  const { params, update, pending, activeCount } = useUrlFilters();
  const [q, setQ] = useState(params.get('q') ?? '');

  // Debounced search-as-you-type.
  useEffect(() => {
    if ((params.get('q') ?? '') === q.trim()) return;
    const t = setTimeout(() => update({ q: q.trim() || null, sort: null }), 350);
    return () => clearTimeout(t);
  }, [q]);

  const hasQuery = !!params.get('q');

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and abstracts…" className="h-10 bg-card pl-9" aria-label="Search projects" />
        {pending && <Spinner className="absolute top-1/2 right-3 -translate-y-1/2" />}
      </div>
      <div className="flex gap-2">
        <Select value={params.get('sort') ?? (hasQuery ? 'relevance' : 'newest')} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-10 w-40 bg-card" aria-label="Sort results"><SelectValue /></SelectTrigger>
          <SelectContent>
            {hasQuery && <SelectItem value="relevance">Best match</SelectItem>}
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="views">Most viewed</SelectItem>
            <SelectItem value="title">A–Z</SelectItem>
          </SelectContent>
        </Select>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-10 lg:hidden">
              <SlidersHorizontal /> Filters{activeCount > 0 && ` (${activeCount})`}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
            <div className="px-4 pb-6"><FilterPanel options={options} /></div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
