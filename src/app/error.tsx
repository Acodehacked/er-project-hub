'use client';

import { useEffect } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Catches unexpected errors in any page. Never shows technical details to users. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-[70dvh] place-items-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-warning/20 text-warning-foreground dark:text-warning">
          <TriangleAlert className="size-7" />
        </span>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">An unexpected error occurred. Please try again.{error.digest && <> Reference: <code className="font-mono text-xs">{error.digest}</code></>}</p>
        <Button onClick={reset}><RotateCcw /> Try again</Button>
      </div>
    </div>
  );
}
