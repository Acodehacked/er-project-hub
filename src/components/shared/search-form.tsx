import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Plain GET search form — works without JavaScript and keeps the query in
 * the URL. `keep` preserves other filters as hidden inputs.
 */
export function SearchForm({ defaultValue, placeholder, keep = {} }: { defaultValue?: string; placeholder: string; keep?: Record<string, string | undefined> }) {
  return (
    <form className="relative w-full sm:w-80" role="search">
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" defaultValue={defaultValue} placeholder={placeholder} className="bg-card pl-9" aria-label={placeholder} />
    </form>
  );
}
