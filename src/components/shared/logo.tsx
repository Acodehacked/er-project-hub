import Link from 'next/link';
import { cn } from '@/lib/utils';

/** ErHub wordmark: a gear-like hub mark in brand orange. */
export function Logo({ className, href = '/', compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 font-bold tracking-tight', className)} aria-label="ErHub home">
      <span className="relative grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:rotate-12">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
        </svg>
      </span>
      {!compact && (
        <span className="text-lg">
          Er<span className="text-primary">Hub</span>
        </span>
      )}
    </Link>
  );
}
