'use client';

import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from './gsap';

/**
 * Decorative hero backdrop: thin vertical column lines that fade out towards
 * the bottom, with two faint spectrum glows drifting slowly behind them.
 */
export function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.to('[data-orb="a"]', { x: 60, y: -30, duration: 12, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to('[data-orb="b"]', { x: -50, y: 40, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.from('[data-columns]', { opacity: 0, duration: 1.4, ease: 'power2.out' });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div data-columns className="bg-columns absolute inset-0 [mask-image:linear-gradient(to_bottom,black_20%,transparent_85%)]" />
      <div data-orb="a" className="absolute -top-32 right-[8%] size-[26rem] rounded-full bg-tile-3/15 blur-3xl" />
      <div data-orb="b" className="absolute top-40 -left-24 size-[22rem] rounded-full bg-tile-1/15 blur-3xl" />
    </div>
  );
}
