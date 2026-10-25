import Link from 'next/link';
import { cn } from '@/lib/utils';

/** ErHub wordmark: three linked hexagons (a "hub") drawn in the tile spectrum. */
export function Logo({ className, href = '/', compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2 font-semibold tracking-tight', className)} aria-label="ErHub home">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0 transition-transform duration-500 group-hover:rotate-[30deg]" fill="none" aria-hidden>
        <defs>
          <linearGradient id="erhub-mark" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--tile-1)" />
            <stop offset="0.5" stopColor="var(--tile-3)" />
            <stop offset="1" stopColor="var(--tile-5)" />
          </linearGradient>
        </defs>
        <g stroke="url(#erhub-mark)" strokeWidth="2.4" strokeLinejoin="round">
          <path d="M16 3.5l5.2 3v6l-5.2 3-5.2-3v-6z" />
          <path d="M9.2 15.5l5.2 3v6l-5.2 3-5.2-3v-6z" />
          <path d="M22.8 15.5l5.2 3v6l-5.2 3-5.2-3v-6z" />
        </g>
      </svg>
      {!compact && <span className="text-lg text-foreground">ErHub</span>}
    </Link>
  );
}
