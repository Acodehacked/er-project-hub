'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Decorative toggle that sits inline with a headline: a spectrum-gradient
 * track whose knob flips "on" shortly after load. Sized in `em`, so it scales
 * with the surrounding text.
 */
export function SpectrumSwitch({ className }: { className?: string }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setOn(true), 700);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <span
      aria-hidden
      onMouseEnter={() => setOn((v) => !v)}
      className={cn(
        'relative inline-block h-[0.62em] w-[1.12em] shrink-0 translate-y-[-0.06em] rounded-full align-middle transition-[filter] duration-500',
        'shadow-[inset_0_2px_6px_oklch(0.3_0.07_268/0.25),0_10px_24px_-10px_var(--tile-4)]',
        on ? 'saturate-100' : 'saturate-50',
        className,
      )}
      style={{ backgroundImage: 'linear-gradient(90deg, var(--tile-1), var(--tile-3) 55%, var(--tile-4) 80%, var(--tile-6))' }}
    >
      <span
        className={cn(
          'absolute top-1/2 size-[0.52em] -translate-y-1/2 rounded-full bg-white motion-safe:transition-[left] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(.5,1.6,.4,1)]',
          'shadow-[0_4px_10px_oklch(0.3_0.07_268/0.35),inset_0_-2px_4px_oklch(0.85_0.02_268)]',
          on ? 'left-[calc(100%-0.57em)]' : 'left-[0.05em]',
        )}
      />
    </span>
  );
}
