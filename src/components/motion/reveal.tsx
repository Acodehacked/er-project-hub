'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { gsap, useGSAP, MOTION_OK } from './gsap';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Animate direct children one after another instead of the wrapper as a whole. */
  stagger?: boolean | number;
  /** Start offset in px (slides up into place). */
  y?: number;
  delay?: number;
  /** Wait until scrolled into view (default true). */
  onScroll?: boolean;
  /** Change this to replay the animation (e.g. when filters change). */
  replayKey?: string;
};

/**
 * Fade/slide content in with GSAP. Respects prefers-reduced-motion: users who
 * opt out see content immediately with no animation.
 *
 *   <Reveal stagger>{cards}</Reveal>
 */
export function Reveal({ children, className, stagger, y = 18, delay = 0, onScroll = true, replayKey }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const targets = stagger ? Array.from(el.children) : [el];
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: 0.55,
          delay,
          ease: 'power3.out',
          stagger: stagger ? (typeof stagger === 'number' ? stagger : 0.07) : 0,
          clearProps: 'opacity,transform',
          scrollTrigger: onScroll ? { trigger: el, start: 'top 90%', once: true } : undefined,
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [replayKey], revertOnUpdate: true },
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
