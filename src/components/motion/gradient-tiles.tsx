'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { gsap, useGSAP, MOTION_OK } from './gsap';

/** Deterministic 0..1 noise so server and client render the same field. */
function noise(c: number, r: number, seed: number) {
  const x = Math.sin(c * 127.1 + r * 311.7 + seed * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

const SPECTRUM = ['--tile-1', '--tile-2', '--tile-3', '--tile-4', '--tile-5', '--tile-6'];

/**
 * Field of frosted gradient squares that runs blue → violet → pink → orange
 * from left to right. Columns rise and dip like a skyline; the top of each
 * column fades to faint glass. Tiles rise in on load, then one "breathes"
 * now and then. Decorative only.
 *
 *   <GradientTiles cols={14} rows={4} />
 */
export function GradientTiles({
  cols = 14,
  rows = 4,
  seed = 1,
  className,
  animate = true,
}: {
  cols?: number;
  rows?: number;
  /** Change for a different (still deterministic) arrangement. */
  seed?: number;
  className?: string;
  animate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!animate) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from('[data-tile]', {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: { grid: [rows, cols], from: 'end', amount: 0.9 },
          clearProps: 'opacity,transform',
        });
        const tiles = gsap.utils.toArray<HTMLElement>('[data-tile][data-strong]');
        const pulse = () => {
          const tile = tiles[Math.floor(Math.random() * tiles.length)];
          if (tile) gsap.fromTo(tile, { scale: 1 }, { scale: 0.9, duration: 0.7, ease: 'sine.inOut', yoyo: true, repeat: 1 });
        };
        const id = window.setInterval(pulse, 1400);
        return () => window.clearInterval(id);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const tiles = [];
  for (let row = 0; row < rows; row++) {
    const fromBottom = (rows - 1 - row) / Math.max(rows - 1, 1);
    for (let c = 0; c < cols; c++) {
      const t = c / Math.max(cols - 1, 1);
      // Skyline: tall on both edges, a soft dip just left of centre.
      const level = 0.78 + 0.3 * t - 0.5 * Math.exp(-(((t - 0.4) / 0.17) ** 2));
      const s = Math.min(1, Math.max(0, (level - fromBottom * 0.9) * 1.7 + (noise(c, row, seed) - 0.5) * 0.45));
      const pos = t * (SPECTRUM.length - 1);
      const color = SPECTRUM[Math.round(pos + (noise(row, c, seed) - 0.5) * 0.8)] ?? SPECTRUM[0];
      tiles.push(
        <div
          key={`${row}-${c}`}
          data-tile
          data-strong={s > 0.5 ? '' : undefined}
          className="tile aspect-square transition-transform duration-500 hover:scale-95"
          style={{ '--tile': `var(${color})`, '--s': s.toFixed(2) } as React.CSSProperties}
        />,
      );
    }
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('grid gap-[3px]', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {tiles}
    </div>
  );
}
