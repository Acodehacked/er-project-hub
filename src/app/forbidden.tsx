import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Rendered (HTTP 403) when a guard calls `forbidden()`. */
export default function Forbidden() {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="text-2xl font-bold">You don’t have access to this page</h1>
        <p className="text-muted-foreground">Your role doesn’t include this area. If you think that’s a mistake, contact the administrator.</p>
        <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  );
}
