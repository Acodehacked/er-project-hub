'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Cpu, FolderOpen, Search, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { paletteSearchAction, type PaletteResult } from '@/actions/search-actions';
import type { NavItem } from './nav-config';
import { NAV_ICONS } from './nav-icons';

/**
 * Global search & jump menu. Opens with Ctrl+K / ⌘K or "/" from anywhere.
 * Shows pages the user can access, plus live results for projects,
 * technologies and people.
 */
export function CommandPalette({ items, className }: { items: NavItem[]; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PaletteResult | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => startTransition(async () => setResults(await paletteSearchAction(query))), 200);
    return () => clearTimeout(t);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn('h-9 justify-between gap-3 text-muted-foreground font-normal shadow-none', className)}
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          <span className="hidden sm:inline">Search projects, people…</span>
        </span>
        <Kbd className="hidden sm:inline-flex">Ctrl K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search ErHub" description="Jump to a page or search projects" shouldFilter={false}>
        <CommandInput placeholder="Type to search projects, technologies, people…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{pending ? <Spinner className="mx-auto" /> : 'No results found.'}</CommandEmpty>
          {results && results.projects.length > 0 && (
            <CommandGroup heading="Projects">
              {results.projects.map((p) => (
                <CommandItem key={p.href} value={p.href} onSelect={() => go(p.href)}>
                  <FolderOpen /> <span className="truncate">{p.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.meta}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.technologies.length > 0 && (
            <CommandGroup heading="Technologies">
              {results.technologies.map((t) => (
                <CommandItem key={t.href} value={t.href} onSelect={() => go(t.href)}>
                  <Cpu /> {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && results.people.length > 0 && (
            <CommandGroup heading="People">
              {results.people.map((p) => (
                <CommandItem key={p.href} value={p.href} onSelect={() => go(p.href)}>
                  <UserRound /> {p.name}
                  <span className="ml-auto text-xs text-muted-foreground">{p.meta}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results && <CommandSeparator />}
          <CommandGroup heading="Go to">
            {items
              .filter((i) => !query || i.title.toLowerCase().includes(query.toLowerCase()))
              .map((item) => {
                const Icon = NAV_ICONS[item.icon];
                return (
                  <CommandItem key={item.href} value={`nav:${item.href}`} onSelect={() => go(item.href)}>
                    <Icon /> {item.title}
                  </CommandItem>
                );
              })}
            {query.trim().length >= 2 && (
              <CommandItem value="search-all" onSelect={() => go(`/projects?q=${encodeURIComponent(query.trim())}`)}>
                <Search /> Search the repository for “{query.trim()}”
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
